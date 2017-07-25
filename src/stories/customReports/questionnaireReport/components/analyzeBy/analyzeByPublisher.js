module.exports = (pipeline) => {
    pipeline.push({
        $project: {
            _id: false,
            publisher: '$createdBy.user',
        },
    });

    pipeline.push({
        $group: {
            _id: '$publisher._id',
            name: { $first: '$publisher.name' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $sort: {
            name: 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: {
                    count: '$count',
                },
            },
            labels: {
                $push: {
                    _id: '$_id',
                    name: '$name',
                },
            },
        },
    });
};
