module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$questionnaryId',
            position: { $first: '$createdBy.user.position' },
        },
    });

    pipeline.push({
        $group: {
            _id: '$position',
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
            'position.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $addToSet: {
                    _id: '$position._id',
                    name: '$position.name',
                    count: '$count',
                    country: '$country',
                },
            },
            labels: { $push: '$position.name' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
