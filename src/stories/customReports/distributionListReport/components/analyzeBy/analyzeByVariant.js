module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: {
                variant: '$items.variant',
                category: '$items.category',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'variants',
            localField: '_id.variant',
            foreignField: '_id',
            as: 'variant',
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
            variant: {
                $let: {
                    vars: {
                        variant: { $arrayElemAt: ['$variant', 0] },
                    },
                    in: {
                        _id: '$$variant._id',
                        name: '$$variant.name',
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
            'variant.name': 1,
            'category.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$category._id',
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$variant' },
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
