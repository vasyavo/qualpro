const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

module.exports = (pipeline, queryFilter) => {
    pipeline.push({
        $match: {
            'promotionType.en': queryFilter['promotionType.en'][0], // ID like matching
        },
    });

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

    pipeline.push(...[
        {
            $project: {
                branch: '$promotion.branch',
                promotion: {
                    openingStock: {
                        $let: {
                            vars: { openingStock: { $arrayElemAt: ['$promotion.opening', 0] } },
                            in: { $cond: { if: { $eq: ['$$openingStock', null] }, then: 0, else: '$$openingStock' } },
                        },
                    },
                    sellIn: {
                        $let: {
                            vars: { sellIn: { $arrayElemAt: ['$promotion.sellIn', 0] } },
                            in: { $cond: { if: { $eq: ['$$sellIn', null] }, then: 0, else: '$$sellIn' } },
                        },
                    },
                    closingStock: {
                        $let: {
                            vars: { closingStock: { $arrayElemAt: ['$promotion.closingStock', 0] } },
                            in: { $cond: { if: { $eq: ['$$closingStock', null] }, then: 0, else: '$$closingStock' } },
                        },
                    },
                    sellOut: {
                        $let: {
                            vars: { sellOut: { $arrayElemAt: ['$promotion.sellOut', 0] } },
                            in: { $cond: { if: { $eq: ['$$sellOut', null] }, then: 0, else: '$$sellOut' } },
                        },
                    },
                    filledAt: '$promotion.createdBy.date',
                },
            },
        },
        {
            $sort: {
                branch: 1,
                'promotion.filledAt': 1,
            },
        },
        {
            $group: {
                _id: {
                    branch: '$branch',
                },
                promotion: {
                    $push: '$promotion',
                },
                openingStock: {
                    $first: '$promotion.openingStock',
                },
                closingStock: {
                    $last: '$promotion.closingStock',
                },
                sellIn: {
                    $sum: '$promotion.sellIn',
                },
                sellOut: {
                    $sum: '$promotion.sellOut',
                },
            },
        },
        {
            $project: {
                _id: false,
                branch: '$_id.branch',
                openingStock: 1,
                closingStock: 1,
                sellIn: 1,
                sellOut: 1,
            },
        },
    ]);

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: 'branch',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            promotion: 1,
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
            openingStock: 1,
            closingStock: 1,
            sellIn: 1,
            sellOut: 1,
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
                $push: {
                    _id: '$domain._id',
                    name: '$domain.name',
                    openingStock: '$openingStock',
                    sellIn: '$sellIn',
                    closingStock: '$closingStock',
                    sellOut: '$sellOut',
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
