module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$category',
            promotion: { $first: '$_id' },
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
            domain: {
                $let: {
                    vars: {
                        category: { $arrayElemAt: ['$category', 0] },
                    },
                    in: {
                        _id: '$$category._id',
                        name: {
                            en: '$$category.name.en',
                            ar: '$$category.name.ar',
                        },
                    },
                },
            },
        },
    });
};
