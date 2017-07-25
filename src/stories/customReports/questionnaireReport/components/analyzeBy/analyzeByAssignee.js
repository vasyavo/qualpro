module.exports = (pipeline) => {
    pipeline.push({
        $project: {
            _id: false,
            assignee: 1,
        },
    });

    pipeline.push({
        $unwind: {
            path: '$assignee',
        },
    });

    pipeline.push({
        $group: {
            _id: '$assignee._id',
            name: { $first: '$assignee.name' },
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
