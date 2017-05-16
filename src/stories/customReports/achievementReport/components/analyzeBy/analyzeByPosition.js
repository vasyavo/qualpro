module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$createdBy.user.position',
            achievementCount: { $sum: 1 },
            label: { $first: '$createdBy.user.position' },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'positions',
            localField: 'label',
            foreignField: '_id',
            as: 'label',
        },
    });

    pipeline.push({
        $addFields: {
            label: {
                $let: {
                    vars: {
                        label: { $arrayElemAt: ['$label', 0] },
                    },
                    in: '$$label.name',
                },
            },
        },
    });
};
