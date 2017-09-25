module.exports = (pipeline) => {
    pipeline.push(...[
        {
            $project: {
                _id: 1,
                product: 1,
            },
        },
        {
            $group: {
                _id: {
                    promotion: '$_id',
                    product: '$product._id',
                },
                product: { $first: '$product' },
            },
        },
        {
            $project: {
                _id: false,
                product: 1,
            },
        },
        {
            $group: {
                _id: {
                    product: '$product._id',
                },
                product: { $first: '$product' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: false,
                product: 1,
                count: 1,
            },
        },
        {
            $sort: {
                'product.name': 1,
            },
        },
        {
            $group: {
                _id: null,
                data: {
                    $push: {
                        _id: '$product._id',
                        name: '$product.name',
                        count: '$count',
                    },
                },
                labels: {
                    $push: '$product.name',
                },
            },
        },
    ]);
};
