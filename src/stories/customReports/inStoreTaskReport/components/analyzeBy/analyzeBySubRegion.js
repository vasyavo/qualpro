module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$subRegion',
    });

    pipeline.push({
        $group: {
            _id: {
                subRegion: '$subRegion',
                status: '$status',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id.subRegion',
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
        $sort: {
            '_id.status': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$subRegion._id',
            subRegion: { $first: '$subRegion' },
            data: {
                $push: {
                    count: '$count',
                    status: '$_id.status',
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            datasets: { $push: { data: '$data' } },
            labels: { $push: '$subRegion' },
        },
    });
};
