module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$subRegion._id',
            region: { $first: '$region' },
            subRegion: { $first: '$subRegion' },
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
            subRegion: 1,
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
        $addFields: {
            location: {
                en: {
                    $concat: ['$country.name.en', ' / ', '$region.name.en', ' / ', '$subRegion.name.en'],
                },
                ar: {
                    $concat: ['$country.name.ar', ' / ', '$region.name.ar', ' / ', '$subRegion.name.ar'],
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $addToSet: {
                    _id: '$subRegion._id',
                    name: '$subRegion.name',
                    count: '$count',
                    country: '$country',
                    region: '$region',
                    location: '$location',
                },
            },
            labels: {
                $addToSet: '$location',
            },
        },
    });

    pipeline.push({
        $unwind: '$data',
    });


    pipeline.push({
        $sort: {
            'data.location.en': 1,
            'data.count': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: {
                labels: '$labels',
            },
            data: { $push: '$data' },
        },
    });

    pipeline.push({
        $project: {
            _id: 0,
            labels: '$_id.labels',
            data: 1,
        },
    });

    pipeline.push({
        $unwind: '$labels',
    });


    pipeline.push({
        $sort: {
            'labels.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: {
                data: '$data',
            },
            labels: { $push: '$labels' },
        },
    });

    pipeline.push({
        $project: {
            _id: 0,
            data: '$_id.data',
            labels: 1,
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
