const moment = require('moment');
const generalFiler = require('./../../../utils/generalFilter');
const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

module.exports = (queryFilter, timeFilter, personnel) => {
    const pipeline = [];

    const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.CATEGORY, 'displayType', 'status'], queryFilter, personnel);

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
            from: CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM,
            localField: '_id',
            foreignField: 'brandingAndDisplay',
            as: 'marketingCampaign',
        },
    });

    pipeline.push({
        $unwind: '$marketingCampaign',
    });

    const $timeMatch = {};

    $timeMatch.$or = [];

    if (timeFilter) {
        timeFilter.map((frame) => {
            $timeMatch.$or.push({
                $and: [
                    {
                        'marketingCampaign.createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                    },
                    {
                        'marketingCampaign.createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
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
                'marketingCampaign.createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: 'marketingCampaign.createdBy.user',
            foreignField: '_id',
            as: 'marketingCampaign.createdBy.user',
        },
    });

    pipeline.push({
        $addFields: {
            'marketingCampaign.createdBy': {
                user: {
                    $let: {
                        vars: {
                            user: { $arrayElemAt: ['$marketingCampaign.createdBy.user', 0] },
                        },
                        in: {
                            _id: '$$user._id',
                            position: '$$user.position',
                        },
                    },
                },
                date: '$marketingCampaign.createdBy.date',
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
        pipeline.push({
            $match: {
                'marketingCampaign.createdBy.user.position': {
                    $in: queryFilter[CONTENT_TYPES.POSITION],
                },
            },
        });
    }

    if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
        pipeline.push({
            $match: {
                'marketingCampaign.branch': { $in: queryFilter[CONTENT_TYPES.BRANCH] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: 'marketingCampaign.branch',
            foreignField: '_id',
            as: 'marketingCampaign.branch',
        },
    });

    pipeline.push({
        $addFields: {
            marketingCampaign: {
                branch: {
                    $let: {
                        vars: {
                            branch: { $arrayElemAt: ['$marketingCampaign.branch', 0] },
                        },
                        in: {
                            _id: '$$branch._id',
                            subRegion: '$$branch.subRegion',
                            retailSegment: '$$branch.retailSegment',
                        },
                    },
                },
                createdBy: '$marketingCampaign.createdBy',
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
        pipeline.push({
            $match: {
                'marketingCampaign.branch.subRegion': { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
            },
        });
    }

    if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
        pipeline.push({
            $match: {
                'marketingCampaign.branch.retailSegment': { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'marketingCampaign.branch.subRegion',
            foreignField: '_id',
            as: 'marketingCampaign.branch.subRegion',
        },
    });

    pipeline.push({
        $addFields: {
            marketingCampaign: {
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: { $arrayElemAt: ['$marketingCampaign.branch.subRegion', 0] },
                        },
                        in: {
                            _id: '$$subRegion._id',
                            parent: '$$subRegion.parent',
                        },
                    },
                },
                createdBy: '$marketingCampaign.createdBy',
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
        pipeline.push({
            $match: {
                'marketingCampaign.subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'marketingCampaign.subRegion.parent',
            foreignField: '_id',
            as: 'marketingCampaign.subRegion.parent',
        },
    });

    pipeline.push({
        $addFields: {
            marketingCampaign: {
                region: {
                    $let: {
                        vars: {
                            region: { $arrayElemAt: ['$marketingCampaign.subRegion.parent', 0] },
                        },
                        in: {
                            _id: '$$region._id',
                            parent: '$$region.parent',
                        },
                    },
                },
                createdBy: '$marketingCampaign.createdBy',
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
        pipeline.push({
            $match: {
                'marketingCampaign.region.parent': { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
            },
        });
    }

    pipeline.push({
        $group: {
            _id: null,
            categories: { $addToSet: { $arrayElemAt: ['$category', 0] } },
            displayTypes: { $addToSet: '$displayType' },
            statuses: { $addToSet: '$status' },
            publishers: { $addToSet: '$createdBy.user._id' },
            positions: { $addToSet: '$createdBy.user.position' },
            personnels: { $addToSet: '$marketingCampaign.createdBy.user' },
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
