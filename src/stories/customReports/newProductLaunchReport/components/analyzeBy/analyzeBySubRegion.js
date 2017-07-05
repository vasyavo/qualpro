module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: {
                country: '$country',
                region: '$region',
                subRegion: '$subRegion',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id.country',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id.region',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id.subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
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
                    },
                },
            },
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
                    },
                },
            },
        },
    });

    pipeline.push({
        $addFields: {
            location: {
                en: {
                    $concat: ['$country.name.en', ' / ', '$region.name.en', ' / ', '$domain.name.en'],
                },
                ar: {
                    $concat: ['$country.name.ar', ' / ', '$region.name.ar', ' / ', '$domain.name.ar'],
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
            'data.count': 1,
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
