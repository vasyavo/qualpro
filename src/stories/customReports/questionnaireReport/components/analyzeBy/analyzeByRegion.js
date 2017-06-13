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
        $project: {
            _id: 1,
            count: 1,
            region: {
                $let: {
                    vars: {
                        region: { $arrayElemAt: ['$region', 0] },
                    },
                    in: {
                        _id: '$$region._id',
                        name: '$$region.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: { $push: '$region.name' },
        },
    });
};
