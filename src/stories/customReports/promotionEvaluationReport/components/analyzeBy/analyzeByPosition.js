module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$publisherPosition',
            promotion: { $first: '$_id' },
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
};
