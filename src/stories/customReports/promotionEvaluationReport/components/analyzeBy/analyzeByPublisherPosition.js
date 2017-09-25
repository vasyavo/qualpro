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
                    position: '$publisher.position._id',
                },
                position: { $first: '$publisher.position' },
            },
        },
        {
            $project: {
                _id: false,
                position: 1,
            },
        },
        {
            $group: {
                _id: {
                    position: '$position._id',
                },
                position: { $first: '$position' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: false,
                position: 1,
                count: 1,
            },
        },
        {
            $sort: {
                'position.name': 1,
            },
        },
        {
            $group: {
                _id: null,
                data: {
                    $push: {
                        _id: '$position._id',
                        name: '$position.name',
                        count: '$count',
                    },
                },
                labels: {
                    $push: '$position.name',
                },
            },
        },
    ]);
};
