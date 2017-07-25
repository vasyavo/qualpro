module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$_id',
            rating: { $avg: '$rating' },
            branch: { $first: '$branch' },
        },
    });

    pipeline.push({
        $unwind: '$branch',
    });

    pipeline.push({
        $group: {
            _id: '$branch._id',
            branch: { $first: '$branch' },
            rating: { $avg: '$rating' },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'branch.subRegion',
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
            country: { $arrayElemAt: ['$country', 0] },
            location: {
                _id: {
                    $let: {
                        vars: {
                            domain: { $arrayElemAt: ['$country', 0] },
                        },
                        in: '$$domain._id',
                    },
                },
                name: {
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
                            ' -> ',
                            '$branch.name.en',
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
                            ' -> ',
                            '$branch.name.ar',
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
