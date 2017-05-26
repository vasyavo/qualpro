module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$publisherPosition',
            achievement: { $first: '$_id' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: '_id',
            foreignField: '_id',
            as: 'publisherPosition',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            domain: {
                $let: {
                    vars: {
                        publisherPosition: { $arrayElemAt: ['$publisherPosition', 0] },
                    },
                    in: {
                        _id: '$$publisherPosition._id',
                        name: {
                            en: '$$publisherPosition.name.en',
                            ar: '$$publisherPosition.name.ar',
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
