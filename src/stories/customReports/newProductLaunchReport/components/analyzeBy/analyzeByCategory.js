module.exports = (pipeline) => {
    pipeline.push({
        $project: {
            category: 1,
            customCategory: {
                en: {
                    $toUpper: '$category_name.en',
                },
                ar: {
                    $toUpper: '$category_name.ar',
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category',
        },
    });

    pipeline.push({
        $project: {
            category: {
                $cond: {
                    if: {
                        $gt: [{
                            $size: '$category',
                        }, 0],
                    },
                    then: {
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
                    else: {
                        name: '$customCategory',
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'category.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$category',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: { $push: '$_id.name' },
        },
    });
};
