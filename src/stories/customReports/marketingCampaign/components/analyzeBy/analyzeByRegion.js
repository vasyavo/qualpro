const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

module.exports = (pipeline, queryFilter) => {
    pipeline.push({
        $lookup: {
            from: CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM,
            localField: '_id',
            foreignField: 'brandingAndDisplay',
            as: 'marketingCampaign',
        },
    });

    pipeline.push({
        $unwind: {
            path: '$marketingCampaign',
            preserveNullAndEmptyArrays: true,
        },
    });

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
            marketingCampaign: {
                createdBy: {
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
                },
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
                $or: [
                    {
                        'marketingCampaign.subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
                    },
                    {
                        'marketingCampaign.subRegion.parent': { $eq: null },
                    },
                ],
            },
        });
    }

    pipeline.push({
        $group: {
            _id: '$_id',
            region: { $first: '$region' },
        },
    });

    pipeline.push({
        $unwind: {
            path: '$region',
            preserveNullAndEmptyArrays: true,
        },
    });

    pipeline.push({
        $group: {
            _id: '$region',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            domain: {
                $let: {
                    vars: {
                        region: { $arrayElemAt: ['$region', 0] },
                    },
                    in: {
                        _id: '$$region._id',
                        name: {
                            en: '$$region.name.en',
                            ar: '$$region.name.ar',
                        },
                        parent: '$$region.parent',
                    },
                },
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
        pipeline.push({
            $match: {
                'domain.parent': { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'domain.parent',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $addFields: {
            country: {
                $let: {
                    vars: {
                        country: { $arrayElemAt: ['$country', 0] },
                    },
                    in: {
                        _id: '$$country._id',
                        name: {
                            en: '$$country.name.en',
                            ar: '$$country.name.ar',
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $addFields: {
            location: {
                en: {
                    $concat: ['$country.name.en', ' / ', '$domain.name.en'],
                },
                ar: {
                    $concat: ['$country.name.ar', ' / ', '$domain.name.ar'],
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $addToSet: {
                    _id: '$domain._id',
                    name: '$domain.name',
                    count: '$count',
                    country: '$country',
                    location: '$location',
                },
            },
            labels: {
                $addToSet: '$location',
            },
        },
    });

    pipeline.push({
        $unwind: '$data',
    });


    pipeline.push({
        $sort: {
            'data.location.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: {
                labels: '$labels',
            },
            data: { $push: '$data' },
        },
    });

    pipeline.push({
        $project: {
            _id: 0,
            labels: '$_id.labels',
            data: 1,
        },
    });

    pipeline.push({
        $unwind: '$labels',
    });


    pipeline.push({
        $sort: {
            'labels.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: {
                data: '$data',
            },
            labels: { $push: '$labels' },
        },
    });

    pipeline.push({
        $project: {
            _id: 0,
            data: '$_id.data',
            labels: 1,
        },
    });
};
