module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$createdBy.user._id',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: '_id',
            foreignField: '_id',
            as: 'personnel',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            personnel: {
                $let: {
                    vars: {
                        personnel: { $arrayElemAt: ['$personnel', 0] },
                    },
                    in: {
                        _id: '$$personnel._id',
                        name: {
                            en: { $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] },
                            ar: { $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'personnel.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: { $push: '$personnel' },
        },
    });
};
