module.exports = (pipeline) => {
    pipeline.push({
        $project: {
            _id: false,
            country: 1,
        },
    });

    pipeline.push({
        $unwind: '$country',
    });

    pipeline.push({
        $group: {
            _id: '$country',
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
            'country.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: {
                    country: '$country',
                    count: '$count',
                },
            },
            labels: { $push: '$country' },
        },
    });
};
