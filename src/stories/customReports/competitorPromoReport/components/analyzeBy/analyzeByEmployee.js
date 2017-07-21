module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$createdBy.user._id',
            employee: { $first: '$createdBy.user' },
            count: { $sum: 1 },
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
            labels: { $push: '$employee' },
        },
    });
};
