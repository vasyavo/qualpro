module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$subRegion',
    });

    pipeline.push({
        $group: {
            _id: '$subRegion',
            promotion: { $first: '$_id' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            domain: {
                vars: {
                    subRegion: { $arrayElemAt: ['$subRegion', 0] },
                },
                in: {
                    _id: '$$subRegion._id',
                    name: {
                        en: '$$subRegion.name.en',
                        ar: '$$subRegion.name.ar',
                    },
                },
            },
        },
    });
};
