module.exports = (pipeline) => {
    pipeline.push(...[
        {
            $project: {
                _id: 1,
                publisher: 1,
            },
        },
        {
            $group: {
                _id: {
                    promotion: '$_id',
                    publisher: '$publisher._id',
                },
                publisher: { $first: '$publisher' },
            },
        },
        {
            $project: {
                _id: false,
                publisher: 1,
            },
        },
        {
            $group: {
                _id: {
                    publisher: '$publisher._id',
                },
                publisher: { $first: '$publisher' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: false,
                publisher: 1,
                count: 1,
            },
        },
        {
            $sort: {
                'publisher.name': 1,
            },
        },
        {
            $group: {
                _id: null,
                data: {
                    $push: {
                        _id: '$publisher._id',
                        name: '$publisher.name',
                        count: '$count',
                    },
                },
                labels: {
                    $push: '$publisher.name',
                },
            },
        },
    ]);
};
