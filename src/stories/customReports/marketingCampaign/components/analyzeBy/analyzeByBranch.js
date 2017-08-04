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
        $unwind: '$marketingCampaign',
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
        $group: {
            _id: '$marketingCampaign.branch',
            marketingCampaign: { $first: '$_id' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            domain: {
                $let: {
                    vars: {
                        branch: { $arrayElemAt: ['$branch', 0] },
                    },
                    in: {
                        _id: '$$branch._id',
                        name: {
                            en: '$$branch.name.en',
                            ar: '$$branch.name.ar',
                        },
                        outlet: '$$branch.outlet',
                        retailSegment: '$$branch.retailSegment',
                        subRegion: '$$branch.subRegion',
                    },
                },
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
        pipeline.push({
            $match: {
                'domain.subRegion': { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
            },
        });
    }

    if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
        pipeline.push({
            $match: {
                'domain.retailSegment': { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'domain.subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $addFields: {
            subRegion: {
                $let: {
                    vars: {
                        subRegion: { $arrayElemAt: ['$subRegion', 0] },
                    },
                    in: {
                        _id: '$$subRegion._id',
                        name: {
                            en: '$$subRegion.name.en',
                            ar: '$$subRegion.name.ar',
                        },
                        parent: '$$subRegion.parent',
                    },
                },
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
        pipeline.push({
            $match: {
                'subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion.parent',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $addFields: {
            region: {
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
                'region.parent': { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region.parent',
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

    pipeline.push(...[
        {
            $lookup: {
                from: 'outlets',
                localField: 'domain.outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        },
        {
            $addFields: {
                branch: {
                    _id: '$domain._id',
                    name: '$domain.name',
                    retailSegment: '$domain.retailSegment',
                    subRegion: '$domain.subRegion',
                },
                outlet: {
                    $let: {
                        vars: {
                            outlet: { $arrayElemAt: ['$outlet', 0] },
                        },
                        in: {
                            _id: '$$outlet._id',
                            name: {
                                en: '$$outlet.name.en',
                                ar: '$$outlet.name.ar',
                            },
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'retailSegments',
                localField: 'domain.retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        },
        {
            $addFields: {
                branch: {
                    _id: '$branch._id',
                    name: '$branch.name',
                    subRegion: '$branch.subRegion',
                },
                retailSegment: {
                    $let: {
                        vars: {
                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                        },
                        in: {
                            _id: '$$retailSegment._id',
                            name: {
                                en: '$$retailSegment.name.en',
                                ar: '$$retailSegment.name.ar',
                            },
                        },
                    },
                },
            },
        },
    ]);

    pipeline.push({
        $addFields: {
            location: {
                _id: '$domain._id', // <-- important fix magical duplication
                en: {
                    $concat: ['$country.name.en', ' / ', '$region.name.en', ' / ', '$subRegion.name.en', ' / ', '$retailSegment.name.en', ' / ', '$outlet.name.en', ' -> ', '$domain.name.en'],
                },
                ar: {
                    $concat: ['$country.name.ar', ' / ', '$region.name.ar', ' / ', '$subRegion.name.ar', ' / ', '$retailSegment.name.ar', ' / ', '$outlet.name.ar', ' -> ', '$domain.name.ar'],
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
                    region: '$region',
                    subRegion: '$subRegion',
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
            labels: {
                en: 1,
                ar: 1,
            },
        },
    });
};
