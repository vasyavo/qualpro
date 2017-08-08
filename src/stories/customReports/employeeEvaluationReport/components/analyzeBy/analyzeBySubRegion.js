module.exports = (pipeline, queryFilter) => {
    pipeline.push({
        $group: {
            _id: '$_id',
            rating: { $avg: '$rating' },
            subRegion: { $first: '$subRegion' },
        },
    });

    if (queryFilter.rate) {
        pipeline.push({
            $match: {
                rating: {
                    $gte: parseInt(queryFilter.rate, 10),
                },
            },
        });
    }

    pipeline.push({
        $unwind: '$subRegion',
    });

    pipeline.push({
        $group: {
            _id: '$subRegion',
            rating: { $avg: '$rating' },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $addFields: {
            subRegion: {
                $let: {
                    vars: {
                        domain: { $arrayElemAt: ['$subRegion', 0] },
                    },
                    in: {
                        _id: '$$domain._id',
                        name: '$$domain.name',
                        parent: '$$domain.parent',
                    },
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion.parent',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $addFields: {
            region: {
                $let: {
                    vars: {
                        domain: { $arrayElemAt: ['$region', 0] },
                    },
                    in: {
                        _id: '$$domain._id',
                        name: '$$domain.name',
                        parent: '$$domain.parent',
                    },
                },
            },
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
        $addFields: {
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
        $project: {
            rating: 1,
            country: 1,
            location: {
                _id: '$subRegion._id',
                name: {
                    en: {
                        $concat: [
                            '$country.name.en',
                            ' / ',
                            '$region.name.en',
                            ' / ',
                            '$subRegion.name.en',
                        ],
                    },
                    ar: {
                        $concat: [
                            '$country.name.en',
                            ' / ',
                            '$region.name.ar',
                            ' / ',
                            '$subRegion.name.ar',
                        ],
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            location: 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: {
                    count: '$rating',
                    country: '$country',
                },
            },
            labels: { $push: '$location' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
