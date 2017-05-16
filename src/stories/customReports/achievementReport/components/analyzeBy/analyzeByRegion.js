module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$region',
            achievementCount: { $sum: 1 },
            label: { $first: '$region' },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
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
