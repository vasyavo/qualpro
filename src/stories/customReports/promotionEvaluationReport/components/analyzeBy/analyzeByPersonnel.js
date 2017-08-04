const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

module.exports = (pipeline, queryFilter) => {
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

    if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
        pipeline.push({
            $match: {
                'promotion.branch.outlet': { $in: queryFilter[CONTENT_TYPES.OUTLET] },
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
        $project: {
            _id: 1,
            personnel: '$promotion.createdBy.user',
        },
    });

    pipeline.push({
        $group: {
            _id: {
                personnel: '$personnel',
                promotion: '$_id',
            },
        },
    });

    pipeline.push({
        $group: {
            _id: '$_id.personnel',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: '_id',
            foreignField: '_id',
            as: 'personnel',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            domain: {
                $let: {
                    vars: {
                        personnel: { $arrayElemAt: ['$personnel', 0] },
                    },
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

    pipeline.push({
        $unwind: '$data',
    });


    pipeline.push({
        $sort: {
            'data.name.en': 1,
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
