module.exports = (pipeline) => {
    pipeline.push({
        $addFields: {
            category: { $arrayElemAt: ['$category', 0] },
        },
    });

    pipeline.push({
        $group: {
            _id: '$category',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            category: {
                $let: {
                    vars: {
                        category: { $arrayElemAt: ['$category', 0] },
                    },
                    in: {
                        name: {
                            en: '$$category.name.en',
                            ar: '$$category.name.ar',
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            count: 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: { $push: '$category.name' },
        },
    });
};
