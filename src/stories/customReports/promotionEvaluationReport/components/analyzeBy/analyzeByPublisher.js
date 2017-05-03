module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$publisher',
            promotion: { $first: '$_id' },
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
            promotion: 1,
            name: {
                $let: {
                    vars: {
                        publisher: { $arrayElemAt: ['$publisher', 0] },
                    },
                    in: {
                        en: { $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'] },
                        ar: { $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'] },
                    },
                },
            },
        },
    });
};
