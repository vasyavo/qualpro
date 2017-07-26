module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$_id',
            rating: { $avg: '$rating' },
            country: { $first: '$country' },
        },
    });

    pipeline.push({
        $unwind: '$country',
    });

    pipeline.push({
        $group: {
            _id: '$country',
            rating: { $avg: '$rating' },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $project: {
            rating: 1,
            country: {
                $let: {
                    vars: {
                        domain: { $arrayElemAt: ['$country', 0] },
                    },
                    in: {
                        _id: '$$domain._id',
                        name: '$$domain.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'country.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: {
                    count: '$rating',
                    country: '$country',
                },
            },
            labels: { $push: '$country' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
