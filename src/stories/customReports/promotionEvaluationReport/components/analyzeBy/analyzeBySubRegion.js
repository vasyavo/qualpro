module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$subRegion',
    });

    pipeline.push({
        $group: {
            _id: '$subRegion',
            promotion: { $first: '$_id' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            domain: {
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

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'domain.parent',
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
                },
            },
            labels: {
                $addToSet: {
                    en: {
                        $concat: ['$country.name.en', ' / ', '$region.name.en', ' / ', '$domain.name.en'],
                    },
                    ar: {
                        $concat: ['$country.name.ar', ' / ', '$region.name.ar', ' / ', '$domain.name.ar'],
                    },
                },
            },
        },
    });
};
