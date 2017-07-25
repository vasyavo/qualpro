module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$consumer.createdBy.user',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: '_id',
            foreignField: '_id',
            as: 'publisher',
        },
    });

    pipeline.push({
        $project: {
            count: 1,
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
            'publisher.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                data: {
                    $addToSet: {
                        _id: '$publisher._id',
                        name: '$publisher.name',
                        count: '$count',
                        country: '$country',
                    },
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
