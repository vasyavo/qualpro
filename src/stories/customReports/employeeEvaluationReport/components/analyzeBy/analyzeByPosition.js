module.exports = (pipeline, queryFilter) => {
    pipeline.push({
        $group: {
            _id: '$position',
            rating: { $avg: '$rating' },
        },
    });

    if (queryFilter.rate) {
        pipeline.push({
            $match: {
                rating: {
                    $gte: parseInt(queryFilter.rate, 10),
                },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: '_id',
            foreignField: '_id',
            as: 'position',
        },
    });

    pipeline.push({
        $addFields: {
            position: {
                $let: {
                    vars: {
                        position: { $arrayElemAt: ['$position', 0] },
                    },
                    in: {
                        _id: '$$position._id',
                        name: '$$position.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'position.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$rating',
            },
            labels: { $push: '$position' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
