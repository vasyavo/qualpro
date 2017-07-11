module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: {
                region: '$region._id',
                category: '$items.category',
            },
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
        $sort: {
            'region._id': 1,
            'category._id': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$category._id',
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: {
                $push: {
                    en: {
                        $concat: [
                            '$country.name.en',
                            ' / ',
                            '$region.name.en',
                        ],
                    },
                    ar: {
                        $concat: [
                            '$country.name.ar',
                            ' / ',
                            '$region.name.ar',
                        ],
                    },
                },
            },
        },
    });

    pipeline.push({
        $project: {
            category: 1,
            labels: 1,
            datasets: [
                {
                    data: '$data',
                },
            ],
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
