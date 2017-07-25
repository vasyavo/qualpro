module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$createdBy.user.position',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: '_id',
            foreignField: '_id',
            as: 'position',
        },
    });

    pipeline.push({
        $project: {
            _id: false,
            count: 1,
            position: {
                $let: {
                    vars: {
                        position: { $arrayElemAt: ['$position', 0] },
                    },
                    in: {
                        _id: '$$position._id',
                        name: '$$position.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'position.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: {
                    count: '$count',
                },
            },
            labels: {
                $push: {
                    _id: '$_id',
                    name: '$name',
                },
            },
        },
    });
};
