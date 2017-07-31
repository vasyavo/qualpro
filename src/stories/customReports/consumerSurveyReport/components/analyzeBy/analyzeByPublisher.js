module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$questionnaryId',
            createdBy: { $first: '$createdBy' },
        },
    });

    pipeline.push({
        $group: {
            _id: '$createdBy.user._id',
            publisher: { $first: '$createdBy.user' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $sort: {
            'publisher.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: {
                    _id: '$publisher._id',
                    name: '$publisher.name',
                    count: '$count',
                    country: '$country',
                },
            },
            labels: { $push: '$publisher.name' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
