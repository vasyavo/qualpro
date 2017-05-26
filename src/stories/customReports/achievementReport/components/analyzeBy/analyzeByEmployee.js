module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$publisher',
            achievement: { $first: '$_id' },
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
            _id: 1,
            count: 1,
            domain: {
                $let: {
                    vars: {
                        publisher: { $arrayElemAt: ['$publisher', 0] },
                    },
                    in: {
                        _id: '$$publisher._id',
                        name: {
                            en: { $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'] },
                            ar: { $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'] },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $addToSet: {
                    _id: '$domain._id',
                    name: '$domain.name',
                    count: '$count',
                },
            },
            labels: { $addToSet: '$domain.name' },
        },
    });
};
