module.exports = (pipeline) => {

    pipeline.push({
        $group: {
            _id: {
                country: '$region.parent',
                category: '$items.category',
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
            from: 'categories',
            localField: '_id.category',
            foreignField: '_id',
            as: 'category',
        },
    });

    pipeline.push({
        $project: {
            count: 1,
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
        },
    });

    pipeline.push({
        $sort: {
            'country.name': 1,
            'category.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$category._id',
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$country' },
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
