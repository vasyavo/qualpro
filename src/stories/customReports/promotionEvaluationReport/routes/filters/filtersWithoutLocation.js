const moment = require('moment');
const generalFiler = require('./../../../utils/generalFilter');
const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

module.exports = (queryFilter, timeFilter, personnel) => {
    const pipeline = [];

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

    const $timeMatch = {};

    $timeMatch.$or = [];

    if (timeFilter) {
        timeFilter.map((frame) => {
            $timeMatch.$or.push({
                $and: [
                    {
                        'promotion.createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                    },
                    {
                        'promotion.createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
                    },
                ],
            });
            return frame;
        });
    }

    if ($timeMatch.$or.length) {
        pipeline.push({
            $match: $timeMatch,
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

    if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
        pipeline.push({
            $match: {
                'promotion.branch': { $in: queryFilter[CONTENT_TYPES.BRANCH] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: 'promotion.branch',
            foreignField: '_id',
            as: 'promotion.branch',
        },
    });

    pipeline.push({
        $addFields: {
            promotion: {
                branch: {
                    $let: {
                        vars: {
                            branch: { $arrayElemAt: ['$promotion.branch', 0] },
                        },
                        in: {
                            _id: '$$branch._id',
                            subRegion: '$$branch.subRegion',
                            retailSegment: '$$branch.retailSegment',
                        },
                    },
                },
                createdBy: '$promotion.createdBy',
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
        pipeline.push({
            $match: {
                'promotion.branch.subRegion': { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
            },
        });
    }

    if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
        pipeline.push({
            $match: {
                'promotion.branch.retailSegment': { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'promotion.branch.subRegion',
            foreignField: '_id',
            as: 'promotion.branch.subRegion',
        },
    });

    pipeline.push({
        $addFields: {
            promotion: {
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: { $arrayElemAt: ['$promotion.branch.subRegion', 0] },
                        },
                        in: {
                            _id: '$$subRegion._id',
                            parent: '$$subRegion.parent',
                        },
                    },
                },
                createdBy: '$promotion.createdBy',
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
        pipeline.push({
            $match: {
                'promotion.subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'promotion.subRegion.parent',
            foreignField: '_id',
            as: 'promotion.subRegion.parent',
        },
    });

    pipeline.push({
        $addFields: {
            promotion: {
                region: {
                    $let: {
                        vars: {
                            region: { $arrayElemAt: ['$promotion.subRegion.parent', 0] },
                        },
                        in: {
                            _id: '$$region._id',
                            parent: '$$region.parent',
                        },
                    },
                },
                createdBy: '$promotion.createdBy',
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
        pipeline.push({
            $match: {
                'promotion.region.parent': { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
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
