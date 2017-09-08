module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: {
                priority: '$priority',
                status: '$status',
            },
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
            _id: '$_id.priority',
            data: {
                $push: {
                    count: '$count',
                    status: '$_id.status',
                },
            },
        },
    });

    pipeline.push({
        $project: {
            priority: {
                _id: '$_id',
                name: {
                    en: '$_id',
                    ar: '$_id',
                },
            },
            data: 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$data' },
            labels: { $push: '$priority' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
