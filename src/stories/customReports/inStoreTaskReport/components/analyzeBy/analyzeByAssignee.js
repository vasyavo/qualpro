module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$assignedTo',
    });

    pipeline.push({
        $group: {
            _id: '$assignedTo',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: '_id',
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
        $group: {
            _id: null,
            data: { $push: '$count' },
            labels: { $push: '$assignee' },
        },
    });
};
