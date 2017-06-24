const locationFiler = require('./../../../utils/locationFilter');
const generalFiler = require('./../../../utils/generalFilter');
const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

module.exports = (queryFilter, timeFilter, personnel) => {
    const pipeline = [];

    locationFiler(pipeline, personnel, queryFilter);

    const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.CATEGORY, 'displayType', 'status', 'promotionType.en'], queryFilter, personnel);

    if (queryFilter.publisher && queryFilter.publisher.length) {
        $generalMatch.$and.push({
            'createdBy.user': {
                $in: queryFilter.publisher,
            },
        });
    }

    if ($generalMatch.$and.length) {
        pipeline.push({
            $match: $generalMatch,
        });
    }

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: 'createdBy.user',
            foreignField: '_id',
            as: 'createdBy.user',
        },
    });

    pipeline.push({
        $addFields: {
            createdBy: {
                user: {
                    $let: {
                        vars: {
                            user: { $arrayElemAt: ['$createdBy.user', 0] },
                        },
                        in: {
                            _id: '$$user._id',
                            position: '$$user.position',
                        },
                    },
                },
                date: '$createdBy.date',
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
        pipeline.push({
            $match: {
                'createdBy.user.position': {
                    $in: queryFilter[CONTENT_TYPES.POSITION],
                },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: CONTENT_TYPES.PROMOTIONSITEMS,
            localField: '_id',
            foreignField: 'promotion',
            as: 'promotion',
        },
    });

    pipeline.push({
        $unwind: '$promotion',
    });

    if (timeFilter) {
        pipeline.push({
            $match: {
                $and: [
                    {
                        'promotion.createdBy.date': { $gt: new Date(timeFilter.from) },
                    },
                    {
                        'promotion.createdBy.date': { $lt: new Date(timeFilter.to) },
                    },
                ],
            },
        });
    }

    if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
        pipeline.push({
            $match: {
                'promotion.createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            },
        });
    }

    pipeline.push({
        $group: {
            _id: null,
            categories: { $addToSet: '$category' },
            displayTypes: { $addToSet: '$displayType' },
            statuses: { $addToSet: '$status' },
            publishers: { $addToSet: '$createdBy.user._id' },
            positions: { $addToSet: '$createdBy.user.position' },
            personnels: { $addToSet: '$promotion.createdBy.user' },
            promotionTypes: { $addToSet: '$promotionType' },
        },
    });

    pipeline.push({
        $project: {
            displayTypes: {
                $filter: {
                    input: {
                        $reduce: {
                            input: '$displayTypes',
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
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
            categories: {
                $filter: {
                    input: '$categories',
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
            statuses: {
                $filter: {
                    input: '$statuses',
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
            publishers: {
                $filter: {
                    input: '$publishers',
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
            positions: {
                $filter: {
                    input: '$positions',
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
            personnels: {
                $filter: {
                    input: '$personnels',
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
            promotionTypes: {
                $filter: {
                    input: '$promotionTypes',
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'displayTypes',
            localField: 'displayTypes',
            foreignField: '_id',
            as: 'displayTypes',
        },
    });

    pipeline.push({
        $addFields: {
            displayTypes: {
                $map: {
                    input: '$displayTypes',
                    as: 'displayType',
                    in: {
                        _id: '$$displayType._id',
                        name: '$$displayType.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories',
        },
    });

    pipeline.push({
        $addFields: {
            categories: {
                $map: {
                    input: '$categories',
                    as: 'category',
                    in: {
                        _id: '$$category._id',
                        name: '$$category.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: 'publishers',
            foreignField: '_id',
            as: 'publishers',
        },
    });

    pipeline.push({
        $addFields: {
            publishers: {
                $map: {
                    input: '$publishers',
                    as: 'publisher',
                    in: {
                        _id: '$$publisher._id',
                        name: {
                            en: { $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'] },
                            ar: { $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'] },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: 'positions',
            foreignField: '_id',
            as: 'positions',
        },
    });

    pipeline.push({
        $addFields: {
            positions: {
                $map: {
                    input: '$positions',
                    as: 'position',
                    in: {
                        _id: '$$position._id',
                        name: '$$position.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: 'personnels',
            foreignField: '_id',
            as: 'personnels',
        },
    });

    pipeline.push({
        $addFields: {
            personnels: {
                $map: {
                    input: '$personnels',
                    as: 'personnel',
                    in: {
                        _id: '$$personnel._id',
                        name: {
                            en: { $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] },
                            ar: { $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] },
                        },
                    },
                },
            },
        },
    });

    return pipeline;
};
