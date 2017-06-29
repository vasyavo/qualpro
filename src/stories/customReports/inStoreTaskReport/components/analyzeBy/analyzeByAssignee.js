module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$assignedTo',
    });

    pipeline.push({
        $group: {
            _id: {
                assignedTo: '$assignedTo',
                status: '$status',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: '_id.assignedTo',
            foreignField: '_id',
            as: 'assignee',
        },
    });

    pipeline.push({
        $project: {
            count: 1,
            assignee: {
                $let: {
                    vars: {
                        assignee: { $arrayElemAt: ['$assignee', 0] },
                    },
                    in: {
                        _id: '$$assignee._id',
                        name: {
                            en: { $concat: ['$$assignee.firstName.en', ' ', '$$assignee.lastName.en'] },
                            ar: { $concat: ['$$assignee.firstName.ar', ' ', '$$assignee.lastName.ar'] },
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
            _id: '$assignee._id',
            assignee: { $first: '$assignee' },
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
            data: { $push: '$data' },
            labels: { $push: '$assignee' },
        },
    });

    pipeline.push({
        $project: {
            datasets: ['$data'],
            labels: 1,
        },
    });
};
