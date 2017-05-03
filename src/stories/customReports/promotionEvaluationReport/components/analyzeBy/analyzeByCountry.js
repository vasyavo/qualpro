module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$country',
            promotion: { $first: '$_id' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            promotion: 1,
            name: {
                $let: {
                    vars: {
                        country: { $arrayElemAt: ['$country', 0] },
                    },
                    in: {
                        en: '$$country.name.en',
                        ar: '$$country.name.ar',
                    },
                },
            },
        },
    });
};
