module.exports = (pipeline, queryFilter) => {
    pipeline.push({
        $group: {
            _id: '$publisher',
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
            from: 'personnels',
            localField: '_id',
            foreignField: '_id',
            as: 'publisher',
        },
    });

    pipeline.push({
        $addFields: {
            publisher: {
                $let: {
                    vars: {
                        publisher: { $arrayElemAt: ['$publisher', 0] },
                    },
                    in: {
                        _id: '$$publisher._id',
                        name: {
                            en: {
                                $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'],
                            },
                            ar: {
                                $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'],
                            },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'publisher.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$rating',
            },
            labels: { $push: '$publisher' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
