module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: {
                originator: '$createdBy.user._id',
                status: '$status',
            },
            personnel: { $first: '$createdBy.user' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $sort: {
            '_id.status': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$personnel._id',
            personnel: { $first: '$personnel' },
            data: {
                $push: {
                    count: '$count',
                    status: '$_id.status',
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            datasets: { $push: { data: '$data' } },
            labels: { $push: '$personnel' },
        },
    });
};
