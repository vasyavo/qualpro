module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: {
                subRegions: '$subRegion._id',
                category: '$items.category',
            },
            subRegion: { $first: '$subRegion' },
            region: { $first: '$region' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'categories',
            localField: '_id.category',
            foreignField: '_id',
            as: 'category',
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
        $project: {
            count: 1,
            subRegion: 1,
            region: 1,
            category: {
                $let: {
                    vars: {
                        category: { $arrayElemAt: ['$category', 0] },
                    },
                    in: {
                        _id: '$$category._id',
                        name: '$$category.name',
                    },
                },
            },
            country: {
                $let: {
                    vars: {
                        country: { $arrayElemAt: ['$country', 0] },
                    },
                    in: {
                        _id: '$$country._id',
                        name: '$$country.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $addFields: {
            location: {
                _id: '$subRegion._id',
                name: {
                    en: {
                        $concat: ['$country.name.en', ' / ', '$region.name.en', ' / ', '$subRegion.name.en'],
                    },
                    ar: {
                        $concat: ['$country.name.en', ' / ', '$region.name.ar', ' / ', '$subRegion.name.ar'],
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'location.name': 1,
            'category.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$category._id',
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$location' },
        },
    });

    pipeline.push({
        $project: {
            category: 1,
            labels: 1,
            datasets: [{ data: '$data' }],
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            charts: {
                $push: {
                    category: '$category',
                    datasets: '$datasets',
                    labels: '$labels',
                },
            },
        },
    });
};
