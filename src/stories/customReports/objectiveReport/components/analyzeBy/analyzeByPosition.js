module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: {
                originatorPosition: '$createdBy.user.position',
                status: '$status',
            },
            personnel: { $first: '$createdBy.user' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $sort: {
            '_id.status': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$personnel.position',
            data: {
                $push: {
                    count: '$count',
                    status: '$_id.status',
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: '_id',
            foreignField: '_id',
            as: 'publisherPosition',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            data: 1,
            domain: {
                $let: {
                    vars: {
                        publisherPosition: { $arrayElemAt: ['$publisherPosition', 0] },
                    },
                    in: {
                        _id: '$$publisherPosition._id',
                        name: {
                            en: '$$publisherPosition.name.en',
                            ar: '$$publisherPosition.name.ar',
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$data' },
            labels: { $push: '$domain' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
