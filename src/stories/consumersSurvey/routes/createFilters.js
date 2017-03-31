const _ = require('underscore');
const FilterMapper = require('../../../helpers/filterMapper');
const PersonnelModel = require('../../../types/personnel/model');

module.exports = (req, res, next) => {
    const query = req.query;

    const filterMapper = new FilterMapper();
    const filter = filterMapper.mapFilter({
        filter: query.filter,
        personnel: req.personnelModel,
    });

    const pipeLine = [];
    const locationMatch = {
        $and: [],
    };

    if (filter.country) {
        locationMatch.$and.push({
            $or: [
                {
                    country: filter.country,
                },
                {
                    country: { $exists: false },
                },
            ],
        });
    }

    if (filter.region) {
        locationMatch.$and.push({
            $or: [
                {
                    region: filter.region,
                },
                {
                    region: { $exists: false },
                },
            ],
        });
    }

    if (filter.subRegion) {
        locationMatch.$and.push({
            $or: [
                {
                    subRegion: filter.subRegion,
                },
                {
                    subRegion: { $exists: false },
                },
            ],
        });
    }

    if (filter.branch) {
        locationMatch.$and.push({
            $or: [
                {
                    branch: filter.branch,
                },
                {
                    branch: { $exists: false },
                },
            ],
        });
    }


    if (filter.position) {
        locationMatch.$and.push({
            $or: [
                {
                    position: filter.position,
                },
                {
                    position: { $exists: false },
                },
            ],
        });
    }

    if (locationMatch.$and.length) {
        pipeLine.push({
            $match: locationMatch,
        });
    }

    pipeLine.push({
        $lookup: {
            from: 'branches',
            localField: 'branch',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeLine.push({
        $project: {
            country: 1,
            region: 1,
            subRegion: 1,
            branch: {
                _id: 1,
                name: 1,
                subRegion: 1,
                outlet: 1,
                retailSegment: 1,
            },
            outlet: 1,
            _id: 1,
            origin: 1,
            retailSegment: 1,
            brand: 1,
            variant: 1,
            category: 1,
            product: 1,
            editedBy: 1,
            createdBy: 1,
            archived: 1,
            type: 1,
            status: 1,
            configuration: 1,
            priority: 1,
            assignedTo: 1,
            location: 1,
            name: 1,
            position: 1,
            firstName: 1,
            lastName: 1,
        },
    });

    if (filter.outlet) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        'branch.outlet': filter.outlet,
                    },
                    {
                        'branch.outlet': { $exists: false },
                    },
                ],
            },
        });
    }

    if (filter.retailSegment) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        'branch.retailSegment': filter.retailSegment,
                    },
                    {
                        'branch.retailSegment': { $exists: false },
                    },
                ],
            },
        });
    }

    pipeLine.push({
        $project: {
            outlet: '$branch.outlet',
            retailSegment: '$branch.retailSegment',
            country: 1,
            region: 1,
            subRegion: 1,
            branch: 1,
            _id: 1,
            origin: 1,
            brand: 1,
            variant: 1,
            category: 1,
            product: 1,
            editedBy: 1,
            createdBy: 1,
            archived: 1,
            type: 1,
            status: 1,
            configuration: 1,
            priority: 1,
            assignedTo: 1,
            location: 1,
            name: 1,
            position: 1,
            firstName: 1,
            lastName: 1,
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'country',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'region',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'outlets',
            localField: 'outlet',
            foreignField: '_id',
            as: 'outlet',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'retailSegments',
            localField: 'retailSegment',
            foreignField: '_id',
            as: 'retailSegment',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'positions',
            localField: 'position',
            foreignField: '_id',
            as: 'position',
        },
    });

    pipeLine.push({
        $project: {
            outlet: {
                $cond: {
                    if: {
                        $eq: [
                            '$outlet',
                            [

                            ],
                        ],
                    },
                    then: null,
                    else: {
                        $arrayElemAt: [
                            '$outlet',
                            0,
                        ],
                    },
                },
            },
            retailSegment: {
                $cond: {
                    if: {
                        $eq: [
                            '$retailSegment',
                            [

                            ],
                        ],
                    },
                    then: null,
                    else: {
                        $arrayElemAt: [
                            '$retailSegment',
                            0,
                        ],
                    },
                },
            },
            position: {
                $cond: {
                    if: {
                        $eq: [
                            '$position',
                            [

                            ],
                        ],
                    },
                    then: null,
                    else: {
                        $arrayElemAt: [
                            '$position',
                            0,
                        ],
                    },
                },
            },
            _id: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            branch: 1,
            origin: 1,
            brand: 1,
            variant: 1,
            category: 1,
            product: 1,
            editedBy: 1,
            createdBy: 1,
            archived: 1,
            type: 1,
            status: 1,
            configuration: 1,
            priority: 1,
            assignedTo: 1,
            location: 1,
            name: 1,
            firstName: 1,
            lastName: 1,
        },
    });

    pipeLine.push({
        $project: {
            country: {
                _id: 1,
                name: 1,
            },
            region: {
                _id: 1,
                name: 1,
                parent: 1,
            },
            subRegion: {
                _id: 1,
                name: 1,
                parent: 1,
            },
            outlet: {
                $cond: {
                    if: {
                        $eq: [
                            '$outlet',
                            null,
                        ],
                    },
                    then: null,
                    else: {
                        _id: '$outlet._id',
                        name: '$outlet.name',
                    },
                },
            },
            retailSegment: {
                $cond: {
                    if: {
                        $eq: [
                            '$retailSegment',
                            null,
                        ],
                    },
                    then: null,
                    else: {
                        _id: '$retailSegment._id',
                        name: '$retailSegment.name',
                    },
                },
            },
            position: {
                $cond: {
                    if: {
                        $eq: [
                            '$position',
                            null,
                        ],
                    },
                    then: null,
                    else: {
                        _id: '$position._id',
                        name: '$position.name',
                    },
                },
            },
            _id: 1,
            branch: 1,
            origin: 1,
            brand: 1,
            variant: 1,
            category: 1,
            product: 1,
            editedBy: 1,
            createdBy: 1,
            archived: 1,
            type: 1,
            status: 1,
            configuration: 1,
            priority: 1,
            assignedTo: 1,
            location: 1,
            name: 1,
            firstName: 1,
            lastName: 1,
        },
    });

    pipeLine.push({
        $project: {
            country: {
                $filter: {
                    input: '$country',
                    as: 'oneItem',
                    cond: {
                        $ne: [
                            '$$oneItem',
                            null,
                        ],
                    },
                },
            },
            region: {
                $filter: {
                    input: '$region',
                    as: 'oneItem',
                    cond: {
                        $ne: [
                            '$$oneItem',
                            null,
                        ],
                    },
                },
            },
            subRegion: {
                $filter: {
                    input: '$subRegion',
                    as: 'oneItem',
                    cond: {
                        $ne: [
                            '$$oneItem',
                            null,
                        ],
                    },
                },
            },
            branch: {
                $filter: {
                    input: '$branch',
                    as: 'oneItem',
                    cond: {
                        $ne: [
                            '$$oneItem',
                            null,
                        ],
                    },
                },
            },
            personnel: {
                _id: '$_id',
                name: {
                    en: {
                        $concat: ['$firstName.en', ' ', '$lastName.en'],
                    },
                    ar: {
                        $concat: ['$firstName.ar', ' ', '$lastName.ar'],
                    },
                },
            },
            position: 1,
            retailSegment: 1,
            outlet: 1,
        },
    });

    pipeLine.push({
        $group: {
            _id: null,
            country: { $addToSet: '$country' },
            region: { $addToSet: '$region' },
            subRegion: { $addToSet: '$subRegion' },
            branch: { $addToSet: '$branch' },
            position: { $addToSet: '$position' },
            retailSegment: { $addToSet: '$retailSegment' },
            outlet: { $addToSet: '$outlet' },
            personnel: { $addToSet: '$personnel' },
        },
    });

    pipeLine.push({
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
            position: 1,
            retailSegment: 1,
            outlet: 1,
            personnel: 1,
        },
    });

    pipeLine.push({
        $project: {
            country: 1,
            region: {
                $let: {
                    vars: {
                        setCountry: filter.country && filter.country.$in.length ? filter.country.$in : {
                            $map: {
                                input: '$country',
                                as: 'item',
                                in: '$$item._id',
                            },
                        },
                    },
                    in: {
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
            subRegion: 1,
            branch: 1,
            position: 1,
            retailSegment: 1,
            outlet: 1,
            personnel: 1,
        },
    });

    pipeLine.push({
        $project: {
            country: 1,
            region: 1,
            subRegion: {
                $let: {
                    vars: {
                        setRegion: filter.region && filter.region.$in.length ? filter.region.$in : {
                            $map: {
                                input: '$region',
                                as: 'item',
                                in: '$$item._id',
                            },
                        },
                    },
                    in: {
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
            branch: 1,
            retailSegment: 1,
            outlet: 1,
            position: 1,
            personnel: 1,
        },
    });

    pipeLine.push({
        $project: {
            country: 1,
            region: 1,
            subRegion: 1,
            branch: {
                $let: {
                    vars: {
                        setSubRegion: filter.subRegion && filter.subRegion.$in.length ? filter.subRegion.$in : {
                            $map: {
                                input: '$subRegion',
                                as: 'item',
                                in: '$$item._id',
                            },
                        },
                    },
                    in: {
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
            retailSegment: 1,
            outlet: 1,
            position: 1,
            personnel: 1,
        },
    });

    pipeLine.push({
        $project: {
            country: 1,
            region: 1,
            subRegion: 1,
            branch: 1,
            retailSegment: {
                $let: {
                    vars: {
                        setRetailSegment: filter.retailSegment && filter.retailSegment.$in.length ? filter.retailSegment.$in : {
                            $map: {
                                input: '$branch',
                                as: 'item',
                                in: '$$item.retailSegment',
                            },
                        },
                    },
                    in: {
                        $filter: {
                            input: '$retailSegment',
                            as: 'item',
                            cond: {
                                $setIsSubset: [['$$item._id'], '$$setRetailSegment'],
                            },
                        },
                    },
                },
            },
            outlet: 1,
            position: 1,
            personnel: 1,
        },
    });

    pipeLine.push({
        $project: {
            country: 1,
            region: 1,
            subRegion: 1,
            branch: 1,
            retailSegment: 1,
            outlet: {
                $let: {
                    vars: {
                        setOutlet: filter.outlet && filter.outlet.$in.length ? filter.outlet.$in : {
                            $map: {
                                input: '$branch',
                                as: 'item',
                                in: '$$item.outlet',
                            },
                        },
                    },
                    in: {
                        $filter: {
                            input: '$outlet',
                            as: 'item',
                            cond: {
                                $setIsSubset: [['$$item._id'], '$$setOutlet'],
                            },
                        },
                    },
                },
            },
            position: 1,
            personnel: 1,
        },
    });

    const aggregation = PersonnelModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse: true,
    };

    aggregation.exec((err, result) => {
        if (err) {
            return next(err);
        }

        result = result[0] || {};

        res.status(200).send(result);
    });
};
