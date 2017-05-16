module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$branch',
            achievementCount: { $sum: 1 },
            label: { $first: '$branch' },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
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
