module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$promoType',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            promoType: 1,
        },
    });

    pipeline.push({
        $sort: {
            count: 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: { $push: '$promoType' },
        },
    });
};
