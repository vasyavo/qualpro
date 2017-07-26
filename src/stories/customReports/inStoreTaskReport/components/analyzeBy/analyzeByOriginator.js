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
            total: { $sum: '$count' },
        },
    });

    pipeline.push({
        $addFields: {
            data: {
                $concatArrays: [
                    '$data',
                    [{
                        count: '$total',
                        status: 'total',
                    }],
                ],
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$data' },
            labels: { $push: '$personnel' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
