const _ = require('underscore');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const FilterMapper = require('../../../helpers/filterMapper');
const PersonnelModel = require('../../../types/personnel/model');

const $defProjectionExtended = {
    _id: 1,
    origin: 1,
    country: 1,
    retailSegment: 1,
    region: 1,
    subRegion: 1,
    outlet: 1,
    branch: 1,
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
};

module.exports = (req, res, next) => {
    const query = req.query;

    const filterMapper = new FilterMapper();
    const filter = filterMapper.mapFilter({
        filter: query.filter,
        personnel: req.personnelModel,
    });

    const aggregationHelper = new AggregationHelper($defProjectionExtended, filter);
    const pipeLine = [];

    pipeLine.push({
        $unwind: {
            path: '$country',
            preserveNullAndEmptyArrays: true,
        },
    });

    if (filter.country) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        country: filter.country,
                    },
                    {
                        country: { $exists: false },
                    },
                ],
            },
        });
    }

    pipeLine.push({
        $unwind: {
            path: '$region',
            preserveNullAndEmptyArrays: true,
        },
    });

    if (filter.region) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        region: filter.region,
                    },
                    {
                        region: { $exists: false },
                    },
                ],
            },
        });
    }

    pipeLine.push({
        $unwind: {
            path: '$subRegion',
            preserveNullAndEmptyArrays: true,
        },
    });

    if (filter.subRegion) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        subRegion: filter.subRegion,
                    },
                    {
                        subRegion: { $exists: false },
                    },
                ],
            },
        });
    }

    pipeLine.push({
        $unwind: {
            path: '$branch',
            preserveNullAndEmptyArrays: true,
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
            from: 'branches',
            localField: 'branch',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeLine.push({
        $project: {
            country: {
                $cond: {
                    if: {
                        $eq: [
                            '$country',
                            [

                            ],
                        ],
                    },
                    then: null,
                    else: {
                        $arrayElemAt: [
                            '$country',
                            0,
                        ],
                    },
                },
            },
            region: {
                $cond: {
                    if: {
                        $eq: [
                            '$region',
                            [

                            ],
                        ],
                    },
                    then: null,
                    else: {
                        $arrayElemAt: [
                            '$region',
                            0,
                        ],
                    },
                },
            },
            subRegion: {
                $cond: {
                    if: {
                        $eq: [
                            '$subRegion',
                            [

                            ],
                        ],
                    },
                    then: null,
                    else: {
                        $arrayElemAt: [
                            '$subRegion',
                            0,
                        ],
                    },
                },
            },
            branch: {
                $cond: {
                    if: {
                        $eq: [
                            '$branch',
                            [

                            ],
                        ],
                    },
                    then: null,
                    else: {
                        $arrayElemAt: [
                            '$branch',
                            0,
                        ],
                    },
                },
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

    pipeLine.push({
        $project: {
            country: {
                $cond: {
                    if: {
                        $eq: [
                            '$country',
                            null,
                        ],
                    },
                    then: null,
                    else: {
                        _id: '$country._id',
                        name: '$country.name',
                    },
                },
            },
            region: {
                $cond: {
                    if: {
                        $eq: [
                            '$region',
                            null,
                        ],
                    },
                    then: null,
                    else: {
                        _id: '$region._id',
                        name: '$region.name',
                        parent: '$region.parent',
                    },
                },
            },
            subRegion: {
                $cond: {
                    if: {
                        $eq: [
                            '$subRegion',
                            null,
                        ],
                    },
                    then: null,
                    else: {
                        _id: '$subRegion._id',
                        name: '$subRegion.name',
                        parent: '$subRegion.parent',
                    },
                },
            },
            branch: {
                $cond: {
                    if: {
                        $eq: [
                            '$branch',
                            null,
                        ],
                    },
                    then: null,
                    else: {
                        _id: '$branch._id',
                        name: '$branch.name',
                        subRegion: '$branch.subRegion',
                        outlet: '$branch.outlet',
                        retailSegment: '$branch.retailSegment',
                    },
                },
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

    if (filter.position) {
        pipeLine.push({
            $match: {
                $or: [
                    {
                        position: filter.position,
                    },
                    {
                        position: { $exists: false },
                    },
                ],
            },
        });
    }

    pipeLine.push({
        $lookup: {
            from: 'outlets',
            localField: 'branch.outlet',
            foreignField: '_id',
            as: 'outlet',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'retailSegments',
            localField: 'branch.retailSegment',
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
        $group: {
            _id: '$_id',
            country: {
                $addToSet: '$country',
            },
            region: {
                $addToSet: '$region',
            },
            subRegion: {
                $addToSet: '$subRegion',
            },
            branch: {
                $addToSet: '$branch',
            },
            origin: {
                $first: '$origin',
            },
            retailSegment: {
                $first: '$retailSegment',
            },
            outlet: {
                $first: '$outlet',
            },
            brand: {
                $first: '$brand',
            },
            variant: {
                $first: '$variant',
            },
            category: {
                $first: '$category',
            },
            product: {
                $first: '$product',
            },
            editedBy: {
                $first: '$editedBy',
            },
            createdBy: {
                $first: '$createdBy',
            },
            archived: {
                $first: '$archived',
            },
            type: {
                $first: '$type',
            },
            status: {
                $first: '$status',
            },
            configuration: {
                $first: '$configuration',
            },
            priority: {
                $first: '$priority',
            },
            assignedTo: {
                $first: '$assignedTo',
            },
            location: {
                $first: '$location',
            },
            name: {
                $first: '$name',
            },
            position: {
                $first: '$position',
            },
            firstName: {
                $first: '$firstName',
            },
            lastName: {
                $first: '$lastName',
            },
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
            _id: 1,
            origin: 1,
            retailSegment: 1,
            outlet: 1,
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
        $project: aggregationHelper.getProjection({
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
        }),
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

    const aggregation = PersonnelModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse: true,
    };

    aggregation.exec((err, result) => {
        if (err) {
            return next(err);
        }

        result = result[0] || {};

        const respUniqueIterator = function (item) {
            return item && item._id && item._id.toString && item._id.toString();
        };

        const response = {
            country: (result.country && _.uniq(_.flatten(result.country), false, respUniqueIterator)) || [],
            region: (result.region && _.uniq(_.flatten(result.region), false, respUniqueIterator)) || [],
            subRegion: (result.subRegion && _.uniq(_.flatten(result.subRegion), false, respUniqueIterator)) || [],
            branch: (result.branch && _.uniq(_.flatten(result.branch), false, respUniqueIterator)) || [],
            retailSegment: (result.retailSegment && _.uniq(result.retailSegment, false, respUniqueIterator)) || [],
            outlet: (result.outlet && _.uniq(result.outlet, false, respUniqueIterator)) || [],
            personnel: result.personnel || [],
            position: (result.position && _.uniq(result.position, false, respUniqueIterator)) || [],
        };

        Object.keys(response).forEach((key) => {
            if (response[key]) {
                for (let i = response[key].length - 1; i >= 0; i--) {
                    if (!response[key][i] || !response[key][i]._id) {
                        response[key].splice(i, 1);
                    }
                }
            }
        });

        res.status(200).send(response);
    });
};
