module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$_id',
            name: { $first: '$name' },
            rating: { $avg: '$rating' },
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
                $push: '$rating',
            },
            labels: {
                $push: {
                    _id: '$_id',
                    name: '$name',
                },
            },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
