module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$subRegion',
    });

    pipeline.push({
        $group: {
            _id: '$subRegion',
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
        $match: {
            subRegion: { $ne: [] },
        },
    });

    pipeline.push({
        $project: {
            count: 1,
            subRegion: {
                $let: {
                    vars: {
                        subRegion: { $arrayElemAt: ['$subRegion', 0] },
                    },
                    in: {
                        _id: '$$subRegion._id',
                        name: {
                            en: { $concat: ['$$subRegion.name.en', ' ', '$$subRegion.name.en'] },
                            ar: { $concat: ['$$subRegion.name.ar', ' ', '$$subRegion.name.ar'] },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$count' },
            labels: { $push: '$subRegion' },
        },
    });
};
