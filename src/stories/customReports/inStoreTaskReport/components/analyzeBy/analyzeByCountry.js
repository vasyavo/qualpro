module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$country',
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country',
                status: '$status',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id.country',
            foreignField: '_id',
            as: 'country',
        },
    });


    pipeline.push({
        $match: {
            country: { $ne: [] },
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
                        name: {
                            en: { $concat: ['$$country.name.en', ' ', '$$country.name.en'] },
                            ar: { $concat: ['$$country.name.ar', ' ', '$$country.name.ar'] },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            '_id.status': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: '$country._id',
            country: { $first: '$country' },
            data: {
                $push: {
                    count: '$count',
                    status: '$_id.status',
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            datasets: { $push: { data: '$data' } },
            labels: { $push: '$country' },
        },
    });
};
