module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$brand.name',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: { $push: { en: '$_id' } },
        },
    });
};
