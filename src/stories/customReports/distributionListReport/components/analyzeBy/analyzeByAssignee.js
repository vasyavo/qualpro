module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: {
                executor: '$executors',
                category: '$items.category',
            },
            executor: { $first: '$executors' },
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
        $project: {
            count: 1,
            executor: 1,
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
            'executor.name': 1,
            'category.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$category._id',
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$executor' },
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
