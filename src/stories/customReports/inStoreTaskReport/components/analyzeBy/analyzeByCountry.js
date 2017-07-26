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
                            en: '$$country.name.en',
                            ar: '$$country.name.ar',
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
            total: { $sum: '$count' },
        },
    });

    pipeline.push({
        $addFields: {
            data: {
                $concatArrays: [
                    '$data',
                    [{
                        count: '$total',
                        status: 'total',
                    }],
                ],
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$data' },
            labels: { $push: '$country' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
