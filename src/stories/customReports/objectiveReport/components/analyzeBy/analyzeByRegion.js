module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$region',
    });

    pipeline.push({
        $group: {
            _id: {
                region: '$region',
                status: '$status',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id.region',
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
        $sort: {
            '_id.status': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$region._id',
            region: { $first: '$region' },
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
            labels: { $push: '$region' },
        },
    });
};
