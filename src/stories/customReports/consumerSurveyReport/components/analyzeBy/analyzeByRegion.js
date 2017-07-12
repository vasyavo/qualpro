module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$region._id',
            region: { $first: '$region' },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region.parent',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $project: {
            count: 1,
            region: 1,
            country: {
                $let: {
                    vars: {
                        country: { $arrayElemAt: ['$country', 0] },
                    },
                    in: {
                        _id: '$$country._id',
                        name: '$$country.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'country.name.en': 1,
            'region.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$count',
            },
            labels: {
                $push: {
                    en: {
                        $concat: [
                            '$country.name.en',
                            ' / ',
                            '$region.name.en',
                        ],
                    },
                    ar: {
                        $concat: [
                            '$country.name.ar',
                            ' / ',
                            '$region.name.ar',
                        ],
                    },
                },
            },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
