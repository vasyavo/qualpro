module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$region',
    });

    pipeline.push({
        $group: {
            _id: '$region',
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
        $match: {
            region: { $ne: [] },
        },
    });

    pipeline.push({
        $project: {
            count: 1,
            region: {
                $let: {
                    vars: {
                        region: { $arrayElemAt: ['$region', 0] },
                    },
                    in: {
                        _id: '$$region._id',
                        name: {
                            en: { $concat: ['$$region.name.en', ' ', '$$region.name.en'] },
                            ar: { $concat: ['$$region.name.ar', ' ', '$$region.name.ar'] },
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
            labels: { $push: '$region' },
        },
    });
};
