module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$_id',
            rating: { $avg: '$rating' },
            subRegion: { $first: '$subRegion' },
        },
    });

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
        $project: {
            rating: 1,
            location: {
                en: {
                    $concat: [
                        {
                            $let: {
                                vars: {
                                    domain: { $arrayElemAt: ['$country', 0] },
                                },
                                in: '$$domain.name.en',
                            },
                        },
                        ' -> ',
                        '$region.name.en',
                        ' -> ',
                        '$subRegion.name.en',
                    ],
                },
                ar: {
                    $concat: [
                        {
                            $let: {
                                vars: {
                                    domain: { $arrayElemAt: ['$country', 0] },
                                },
                                in: '$$domain.name.ar',
                            },
                        },
                        ' -> ',
                        '$region.name.ar',
                        ' -> ',
                        '$subRegion.name.ar',
                    ],
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
                $push: '$rating',
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
