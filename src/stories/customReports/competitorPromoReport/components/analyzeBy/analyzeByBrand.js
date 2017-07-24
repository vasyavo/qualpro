module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$brand',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'brands',
            localField: '_id',
            foreignField: '_id',
            as: 'brand',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            brand: {
                $let: {
                    vars: {
                        brand: { $arrayElemAt: ['$brand', 0] },
                    },
                    in: {
                        _id: '$$brand._id',
                        name: {
                            en: '$$brand.name.en',
                            ar: '$$brand.name.ar',
                        },
                    },
                },
            },
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
            labels: { $push: '$brand' },
        },
    });
};
