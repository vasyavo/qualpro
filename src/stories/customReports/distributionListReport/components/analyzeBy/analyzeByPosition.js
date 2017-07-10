module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$executorPositions',
    });

    pipeline.push({
        $group: {
            _id: {
                executorPosition: '$executorPositions',
                category: '$items.category',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: '_id.executorPosition',
            foreignField: '_id',
            as: 'executorPosition',
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
            executorPosition: {
                $let: {
                    vars: {
                        executorPosition: { $arrayElemAt: ['$executorPosition', 0] },
                    },
                    in: {
                        _id: '$$executorPosition._id',
                        name: '$$executorPosition.name',
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
            'executorPosition._id': 1,
            'category._id': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$category._id',
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$executorPosition.name' },
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
