require('./../config');

const async = require('async');
const logger = require('./logger');
const DomainCollection = require('./../types/domain/collection');
const BranchCollection = require('./../types/branch/collection');
const RetailSegmentCollection = require('./../types/retailSegment/collection');
const OutletCollection = require('./../types/outlet/collection');
const PersonnelCollection = require('./../types/personnel/collection');


async.waterfall([

    (cb) => {
        DomainCollection.findOne({
            'name.en': 'BAHRAIN',
            archived: false,
        }, {
            fields: {
                _id: 1,
                name: 1,
            },
        }, cb);
    },

    (countryBahrain, cb) => {
        const setCountry = [countryBahrain];

        DomainCollection.aggregate([
            {
                $match: {
                    archived: false,
                },
            },
            {
                $project: {
                    _id: 1,
                    'name.en': 1,
                    'name.ar': 1,
                    type: 1,
                    parent: 1,
                },
            }, {
                $group: {
                    _id: null,
                    setDomain: {
                        $push: '$$ROOT',
                    },
                },
            }, {
                $project: {
                    setDomain: 1,
                    setCountry: {
                        $let: {
                            vars: {
                                setCountry,
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$$setCountry',
                                        }, 0],
                                    },
                                    then: '$$setCountry',
                                    else: {
                                        $filter: {
                                            input: '$setDomain',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$item.type', 'country'] },
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }, {
                $project: {
                    setDomain: 1,
                    setCountry: 1,
                    setRegion: {
                        $let: {
                            vars: {
                                setRegion: [],
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$$setRegion',
                                        }, 0],
                                    },
                                    then: '$$setRegion',
                                    else: {
                                        $let: {
                                            vars: {
                                                setId: '$setCountry._id',
                                            },
                                            in: {
                                                $filter: {
                                                    input: '$setDomain',
                                                    as: 'item',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$item.type', 'region'] },
                                                            { $setIsSubset: [['$$item.parent'], '$$setId'] },
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }, {
                $project: {
                    setDomain: 1,
                    setCountry: 1,
                    setRegion: 1,
                    setSubRegion: {
                        $let: {
                            vars: {
                                setSubRegion: [],
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$$setSubRegion',
                                        }, 0],
                                    },
                                    then: '$$setSubRegion',
                                    else: {
                                        $let: {
                                            vars: {
                                                setId: '$setRegion._id',
                                            },
                                            in: {
                                                $filter: {
                                                    input: '$setDomain',
                                                    as: 'item',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$item.type', 'subRegion'] },
                                                            { $setIsSubset: [['$$item.parent'], '$$setId'] },
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }, {
                $project: {
                    setCountry: {
                        _id: 1,
                        name: 1,
                    },
                    setRegion: {
                        _id: 1,
                        name: 1,
                    },
                    setSubRegion: {
                        _id: 1,
                        name: 1,
                    },
                },
            },
            {
                $project: {
                    setSubRegion: '$setSubRegion._id',
                    setDomain: {
                        $let: {
                            vars: {
                                setCountry: '$setCountry._id',
                                setRegion: '$setRegion._id',
                                setSubRegion: '$setSubRegion._id',
                            },
                            in: {
                                $concatArrays: ['$$setCountry', '$$setRegion', '$$setSubRegion'],
                            },
                        },
                    },
                },
            },
        ], cb);
    },

    (result, cb) => {
        const groups = result.length ?
            result.slice().pop() : {
                setSubRegion: [],
                setDomain: [],
            };

        logger.info('Current Bahrain locations:', {
            setSubRegion: groups.setSubRegion.map(objectId => objectId.toString()),
            setDomain: groups.setDomain.map(objectId => objectId.toString()),
        });

        async.series([

            (cb) => {
                OutletCollection.updateMany({}, {
                    $pull: {
                        subRegions: {
                            $in: groups.setSubRegion,
                        },
                    },
                }, cb);
            },

            (cb) => {
                RetailSegmentCollection.updateMany({}, {
                    $pull: {
                        subRegions: {
                            $in: groups.setSubRegion,
                        },
                    },
                }, cb);
            },

            (cb) => {
                DomainCollection.updateMany({
                    _id: {
                        $in: groups.setDomain,
                    },
                }, {
                    $set: {
                        archived: true,
                    },
                }, cb);
            },

        ], (err) => {
            if (err) {
                return cb(err);
            }

            cb(null, {
                setDomain: groups.setDomain,
                setSubRegion: groups.setSubRegion,
            });
        });
    },

    (options, cb) => {
        BranchCollection.aggregate([{
            $match: {
                subRegion: {
                    $in: options.setSubRegion,
                },
            },
        }, {
            $project: {
                'name.en': 1,
                'name.ar': 1,
                retailSegment: 1,
                outlet: 1,
            },
        }, {
            $group: {
                _id: null,
                setBranch: {
                    $push: {
                        _id: '$_id',
                        name: {
                            en: '$name.en',
                            ar: '$name.ar',
                        },
                    },
                },
                setRetailSegment: {
                    $addToSet: '$retailSegment',
                },
                setOutlet: {
                    $addToSet: '$outlet',
                },
            },
        }, {
            $project: {
                setBranch: 1,
                setRetailSegment: {
                    $filter: {
                        input: '$setRetailSegment',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                setOutlet: {
                    $filter: {
                        input: '$setOutlet',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
            },
        }, {
            $lookup: {
                from: 'retailSegments',
                localField: 'setRetailSegment',
                foreignField: '_id',
                as: 'setRetailSegment',
            },
        }, {
            $project: {
                setBranch: 1,
                setRetailSegment: {
                    $filter: {
                        input: '$setRetailSegment',
                        as: 'item',
                        cond: {
                            $eq: ['$$item.archived', false],
                        },
                    },
                },
                setOutlet: 1,
            },
        }, {
            $project: {
                setBranch: 1,
                setRetailSegment: {
                    _id: 1,
                    name: {
                        en: 1,
                        ar: 1,
                    },
                },
                setOutlet: 1,
            },
        }, {
            $lookup: {
                from: 'outlets',
                localField: 'setOutlet',
                foreignField: '_id',
                as: 'setOutlet',
            },
        }, {
            $project: {
                setBranch: 1,
                setRetailSegment: 1,
                setOutlet: {
                    $filter: {
                        input: '$setOutlet',
                        as: 'item',
                        cond: {
                            $eq: ['$$item.archived', false],
                        },
                    },
                },
            },
        }, {
            $project: {
                setBranch: 1,
                setRetailSegment: 1,
                setOutlet: {
                    _id: 1,
                    name: {
                        en: 1,
                        ar: 1,
                    },
                },
            },
        }, {
            $project: {
                setBranch: '$setBranch._id',
                setRetailSegment: '$setRetailSegment._id',
                setOutlet: '$setOutlet._id',
            },
        }], (err, result) => {
            if (err) {
                return cb(err);
            }

            const groups = result.length ?
                result.slice().pop() : {
                    setBranch: [],
                    setRetailSegment: [],
                    setOutlet: [],
                };

            logger.info('Branches in Bahrain', {
                setBranch: groups.setBranch.map(objectId => objectId.toString()),
                setRetailSegment: groups.setRetailSegment.map(objectId => objectId.toString()),
                setOutlet: groups.setOutlet.map(objectId => objectId.toString()),
            });

            const nextOptions = Object.assign({}, groups, {
                setDomain: options.setDomain,
                setSubRegion: options.setSubRegion,
            });

            cb(null, nextOptions);
        });
    },

    (options, cb) => {
        async.series([

            (cb) => {
                async.parallel([

                    (cb) => {
                        PersonnelCollection.updateMany({
                            country: null,
                        }, {
                            $set: {
                                country: [],
                            },
                        }, cb);
                    },

                    (cb) => {
                        PersonnelCollection.updateMany({
                            region: null,
                        }, {
                            $set: {
                                region: [],
                            },
                        }, cb);
                    },

                    (cb) => {
                        PersonnelCollection.updateMany({
                            subRegion: null,
                        }, {
                            $set: {
                                subRegion: [],
                            },
                        }, cb);
                    },

                    (cb) => {
                        PersonnelCollection.updateMany({
                            branch: null,
                        }, {
                            $set: {
                                branch: [],
                            },
                        }, cb);
                    },

                ], cb);
            },

            (cb) => {
                PersonnelCollection.updateMany({}, {
                    $pull: {
                        country: options.setDomain,
                        region: options.setDomain,
                        subRegion: options.setDomain,
                        branch: options.setBranch,
                    },
                }, cb);
            },

            (cb) => {
                BranchCollection.updateMany({
                    _id: {
                        $in: options.setBranch,
                    },
                }, {
                    $set: {
                        archived: true,
                    },
                }, cb);
            },

        ], cb);
    },

], (err) => {
    if (err) {
        logger.error(err);
        process.exit(1);
    }

    logger.info('Bahrain locations archived');
    process.exit(0);
});
