const mongoose = require('mongoose');
const ActivityListModel = require('./../../../types/activityList/model');
const aclActivityListMatch = require('./../reusable-components/aclMatch');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const session = req.session;
    const accessRoleLevel = session.level;
    const userId = session.uId;
    const query = req.query;
    const queryFilter = query.filter || {};
    const globalSearch = queryFilter.globalSearch;
    const $matchPersonnel = {
        $and: [],
    };
    const user = req.personnelModel;

    const filter = {};
    const isObjectId = (filter) => {
        return filter.type === 'ObjectId';
    };

    if (queryFilter.country && isObjectId(queryFilter.country)) {
        filter.setCountry = queryFilter.country.values.map(id => ObjectId(id));
    }

    if (queryFilter.region && isObjectId(queryFilter.region)) {
        filter.setRegion = queryFilter.region.values.map(id => ObjectId(id));
    }

    if (queryFilter.subRegion && isObjectId(queryFilter.subRegion)) {
        filter.setSubRegion = queryFilter.subRegion.values.map(id => ObjectId(id));
    }

    if (queryFilter.branch && isObjectId(queryFilter.branch)) {
        filter.setBranch = queryFilter.branch.values.map(id => ObjectId(id));
    }

    if (queryFilter.module && queryFilter.module) {
        filter.setModule = queryFilter.module.values.map(id => parseInt(id, 10));
    }

    if (queryFilter.position && isObjectId(queryFilter.position)) {
        filter.setPosition = queryFilter.position.values.map(id => ObjectId(id));
    }

    if (queryFilter.time) {
        filter.setPeriod = queryFilter.time.values.map(date => new Date(date));
    }

    const getSearchReference = (string) => {
        return { $regex: string, $options: 'i' };
    };

    if (globalSearch && globalSearch.length > 0) {
        $matchPersonnel.$and.push({
            $or: [
                { 'createdBy.name.en': getSearchReference(globalSearch) },
                { 'createdBy.name.ar': getSearchReference(globalSearch) },
            ],
        });
    }

    if (filter.setPosition) {
        $matchPersonnel.$and.push({
            position: filter.setPosition,
        });
    }

    const isSearch = $matchPersonnel.$and.length > 0;
    const today = new Date();

    const pipeline = [
        {
            $match: Object.assign({}, aclActivityListMatch({
                currentUser: {
                    accessRoleLevel,
                    _id: ObjectId(userId),
                },
                queryObject: {},
            }), {
                'createdBy.date': { $gte: new Date(today.setMonth(today.getMonth() - 2)) },
            }),
        },
        {
            $project: {
                country: {
                    $ifNull: ['$country', []],
                },
                region: {
                    $ifNull: ['$region', []],
                },
                subRegion: {
                    $ifNull: ['$subRegion', []],
                },
                branch: {
                    $ifNull: ['$branch', []],
                },
                createdBy: '$createdBy.user',
                createdAt: '$createdBy.date',
                module: 1,
            },
        },
    ];

    if (isSearch) {
        pipeline.push(...[
            {
                $group: {
                    _id: '$createdBy',
                    setActivity: {
                        $push: '$$ROOT',
                    },
                },
            },
            {
                $lookup: {
                    from: 'personnels',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'createdBy',
                },
            },
            {
                $project: {
                    createdBy: {
                        $let: {
                            vars: {
                                user: {
                                    $arrayElemAt: ['$createdBy', 0],
                                },
                            },
                            in: {
                                firstName: '$$user.firstName',
                                lastName: '$$user.lastName',
                                name: {
                                    en: {
                                        $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'],
                                    },
                                    ar: {
                                        $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'],
                                    },
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    setActivity: 1,
                },
            },
            {
                $match: $matchPersonnel,
            },
            {
                $unwind: {
                    path: '$setActivity',
                },
            },
        ]);

        pipeline.push({
            $replaceRoot: { newRoot: '$setActivity' },
        });
    }

    if (filter.setPeriod) {
        pipeline.push({
            $match: {
                $and: [{
                    createdAt: { $gte: new Date(filter.setPeriod[0]) },
                }, {
                    createdAt: { $lte: new Date(filter.setPeriod[1]) },
                }],
            },
        });
    }

    const $matchGeneral = {
        $and: [],
    };

    if (filter.setModule) {
        $matchGeneral.$and.push({
            module: filter.setModule,
        });
    }

    if ($matchGeneral.$and.length > 0) {
        pipeline.push({
            $match: $matchGeneral,
        });
    }

    pipeline.push(...[
        {
            $group: {
                _id: null,
                country: {
                    $push: '$country',
                },
                region: {
                    $push: '$region',
                },
                subRegion: {
                    $push: '$subRegion',
                },
                branch: {
                    $push: '$branch',
                },
                createdBy: {
                    $push: '$createdBy',
                },
                module: {
                    $push: '$module',
                },
            },
        },
        {
            $project: {
                country: {
                    $reduce: {
                        input: '$country',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                region: {
                    $reduce: {
                        input: '$region',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                subRegion: {
                    $reduce: {
                        input: '$subRegion',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                branch: {
                    $reduce: {
                        input: '$branch',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                createdBy: {
                    $setUnion: '$createdBy',
                },
                module: {
                    $setUnion: '$module',
                },
            },
        },
        {
            $lookup: {
                from: 'personnels',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
            },
        },
        {
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                position: '$createdBy.position',
                module: 1,
            },
        },
        {
            $lookup: {
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        },
        {
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                position: {
                    _id: 1,
                    name: 1,
                },
                module: 1,
            },
        },
        {
            $lookup: {
                from: 'modules',
                localField: 'module',
                foreignField: '_id',
                as: 'module',
            },
        },
        {
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                position: 1,
                module: {
                    _id: 1,
                    name: 1,
                },
            },
        },
        {
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        },
        {
            $project: {
                country: {
                    _id: 1,
                    name: 1,
                },
                region: 1,
                subRegion: 1,
                branch: 1,
                position: 1,
                module: 1,
            },
        },
        user.country.length ? {
            $addFields: {
                country: {
                    $filter: {
                        input: '$country',
                        as: 'item',
                        cond: {
                            $setIsSubset: [['$$item._id'], user.country],
                        },
                    },
                },
            },
        } : null,
        {
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        },
        {
            $project: {
                country: 1,
                region: {
                    _id: 1,
                    name: 1,
                    parent: 1,
                },
                subRegion: 1,
                branch: 1,
                position: 1,
                module: 1,
            },
        },
        {
            $addFields: {
                region: {
                    $let: {
                        vars: {
                            setCountry: filter.setCountry && filter.setCountry.length ? filter.setCountry : {
                                $map: {
                                    input: '$country',
                                    as: 'item',
                                    in: '$$item._id',
                                },
                            },
                            setRegion: filter.setRegion && filter.setRegion.length ? filter.setRegion :
                                user.region.length ? {
                                    $let: {
                                        vars: {
                                            setRegionInsideActivities: {
                                                $filter: {
                                                    input: '$region',
                                                    as: 'item',
                                                    cond: {
                                                        $setIsSubset: [['$$item._id'], user.region],
                                                    },
                                                },
                                            },
                                        },
                                        in: {
                                            $map: {
                                                input: '$$setRegionInsideActivities',
                                                as: 'item',
                                                in: '$$item._id',
                                            },
                                        },
                                    },
                                } : {
                                    $map: {
                                        input: '$region',
                                        as: 'item',
                                        in: '$$item._id',
                                    },
                                },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$$setRegion',
                                    }, 0],
                                },
                                then: {
                                    $filter: {
                                        input: '$region',
                                        as: 'item',
                                        cond: {
                                            $and: [
                                                { $setIsSubset: [['$$item.parent'], '$$setCountry'] },
                                                { $setIsSubset: [['$$item._id'], '$$setRegion'] },
                                            ],
                                        },
                                    },
                                },
                                else: {
                                    $filter: {
                                        input: '$region',
                                        as: 'item',
                                        cond: {
                                            $setIsSubset: [['$$item.parent'], '$$setCountry'],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        },
        {
            $project: {
                country: 1,
                region: {
                    _id: 1,
                    name: 1,
                },
                subRegion: {
                    _id: 1,
                    name: 1,
                    parent: 1,
                },
                branch: 1,
                position: 1,
                module: 1,
            },
        },
        {
            $addFields: {
                subRegion: {
                    $let: {
                        vars: {
                            setRegion: filter.setRegion && filter.setRegion.length ? filter.setRegion : {
                                $map: {
                                    input: '$region',
                                    as: 'item',
                                    in: '$$item._id',
                                },
                            },
                            setSubRegion: filter.setSubRegion && filter.setSubRegion.length ? filter.setSubRegion :
                                user.subRegion.length ? {
                                    $let: {
                                        vars: {
                                            setSubRegionInsideActivities: {
                                                $filter: {
                                                    input: '$subRegion',
                                                    as: 'item',
                                                    cond: {
                                                        $setIsSubset: [['$$item._id'], user.subRegion],
                                                    },
                                                },
                                            },
                                        },
                                        in: {
                                            $map: {
                                                input: '$$setSubRegionInsideActivities',
                                                as: 'item',
                                                in: '$$item._id',
                                            },
                                        },
                                    },
                                } : {
                                    $map: {
                                        input: '$subRegion',
                                        as: 'item',
                                        in: '$$item._id',
                                    },
                                },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$$setSubRegion',
                                    }, 0],
                                },
                                then: {
                                    $filter: {
                                        input: '$subRegion',
                                        as: 'item',
                                        cond: {
                                            $and: [
                                                { $setIsSubset: [['$$item.parent'], '$$setRegion'] },
                                                { $setIsSubset: [['$$item._id'], '$$setSubRegion'] },
                                            ],
                                        },
                                    },
                                },
                                else: {
                                    $filter: {
                                        input: '$subRegion',
                                        as: 'item',
                                        cond: {
                                            $setIsSubset: [['$$item.parent'], '$$setRegion'],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        },
        {
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                branch: {
                    _id: 1,
                    name: 1,
                    subRegion: 1,
                },
                position: 1,
                module: 1,
            },
        },
        {
            $addFields: {
                branch: {
                    $let: {
                        vars: {
                            setSubRegion: {
                                $map: {
                                    input: '$subRegion',
                                    as: 'item',
                                    in: '$$item._id',
                                },
                            },
                            setBranch: filter.setBranch && filter.setBranch.length ? filter.setBranch :
                                user.branch.length ? {
                                    $let: {
                                        vars: {
                                            setBranchInsideActivities: {
                                                $filter: {
                                                    input: '$branch',
                                                    as: 'item',
                                                    cond: {
                                                        $setIsSubset: [['$$item._id'], user.branch],
                                                    },
                                                },
                                            },
                                        },
                                        in: {
                                            $map: {
                                                input: '$$setBranchInsideActivities',
                                                as: 'item',
                                                in: '$$item._id',
                                            },
                                        },
                                    },
                                } : {
                                    $map: {
                                        input: '$branch',
                                        as: 'item',
                                        in: '$$item._id',
                                    },
                                },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$$setBranch',
                                    }, 0],
                                },
                                then: {
                                    $filter: {
                                        input: '$branch',
                                        as: 'item',
                                        cond: {
                                            $and: [
                                                { $setIsSubset: [['$$item.subRegion'], '$$setSubRegion'] },
                                                { $setIsSubset: [['$$item._id'], '$$setBranch'] },
                                            ],
                                        },
                                    },
                                },
                                else: {
                                    $filter: {
                                        input: '$branch',
                                        as: 'item',
                                        cond: {
                                            $setIsSubset: [['$$item.subRegion'], '$$setSubRegion'],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $project: {
                country: {
                    _id: 1,
                    name: 1,
                },
                region: {
                    _id: 1,
                    name: 1,
                },
                subRegion: {
                    _id: 1,
                    name: 1,
                },
                branch: {
                    _id: 1,
                    name: 1,
                },
                position: {
                    _id: 1,
                    name: 1,
                },
                module: {
                    _id: 1,
                    name: 1,
                },
            },
        },
    ]);

    ActivityListModel.aggregate(pipeline.filter(stage => stage)).allowDiskUse(true).exec((err, result) => {
        if (err) {
            return next(err);
        }

        const filters = result.length ?
            result.slice().pop() : {
                country: [],
                region: [],
                subRegion: [],
                branch: [],
                position: [],
                module: [],
            };

        res.status(200).send(filters);
    });
};
