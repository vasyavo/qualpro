module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$createdBy.user._id',
            employeeName: { $first: '$createdBy.user.name' },
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
            labels: { $push: '$employeeName' },
        },
    });
};
