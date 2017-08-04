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

    pipeline.push({
        $group: {
            _id: '$marketingCampaign.region.parent',
            marketingCampaign: { $first: '$_id' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            domain: {
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
        $group: {
            _id: null,
            data: {
                $addToSet: {
                    _id: '$domain._id',
                    name: '$domain.name',
                    count: '$count',
                },
            },
            labels: { $addToSet: '$domain.name' },
        },
    });
};
