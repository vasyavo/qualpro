module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$region',
    });

    pipeline.push({
        $group: {
            _id: '$region',
            promotion: { $first: '$_id' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'region',
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
                        region: { $arrayElemAt: ['$region', 0] },
                    },
                    in: {
                        en: '$$region.name.en',
                        ar: '$$region.name.ar',
                    },
                },
            },
        },
    });
};
