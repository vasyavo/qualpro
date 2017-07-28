module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$questionnaryId',
            country: { $addToSet: '$region.parent' },
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
            'country.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $addToSet: {
                    _id: '$country._id',
                    name: '$country.name',
                    count: '$count',
                    country: '$country',
                },
            },
            labels: { $push: '$country.name' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
