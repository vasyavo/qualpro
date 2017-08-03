module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$branch',
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country',
                region: '$region',
                subRegion: '$subRegion',
                branch: '$branch',
                retailSegment: '$retailSegment',
                outlet: '$outlet',
                status: '$status',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'outlets',
            localField: '_id.outlet',
            foreignField: '_id',
            as: 'outlet',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'retailSegments',
            localField: '_id.retailSegment',
            foreignField: '_id',
            as: 'retailSegment',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: '_id.branch',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id.subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id.region',
            foreignField: '_id',
            as: 'region',
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
            branch: { $ne: [] },
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
            region: {
                $let: {
                    vars: {
                        region: { $arrayElemAt: ['$region', 0] },
                    },
                    in: {
                        _id: '$$region._id',
                        name: {
                            en: '$$region.name.en',
                            ar: '$$region.name.ar',
                        },
                    },
                },
            },
            subRegion: {
                $let: {
                    vars: {
                        subRegion: { $arrayElemAt: ['$subRegion', 0] },
                    },
                    in: {
                        _id: '$$subRegion._id',
                        name: {
                            en: '$$subRegion.name.en',
                            ar: '$$subRegion.name.ar',
                        },
                    },
                },
            },
            retailSegment: {
                $let: {
                    vars: {
                        retailSegment: {
                            $arrayElemAt: [
                                '$retailSegment',
                                0,
                            ],
                        },
                    },
                    in: {
                        _id: '$$retailSegment._id',
                        name: {
                            en: '$$retailSegment.name.en',
                            ar: '$$retailSegment.name.ar',
                        },
                    },
                },
            },
            outlet: {
                $let: {
                    vars: {
                        outlet: {
                            $arrayElemAt: [
                                '$outlet',
                                0,
                            ],
                        },
                    },
                    in: {
                        _id: '$$outlet._id',
                        name: {
                            en: '$$outlet.name.en',
                            ar: '$$outlet.name.ar',
                        },
                    },
                },
            },
            branch: {
                $let: {
                    vars: {
                        branch: { $arrayElemAt: ['$branch', 0] },
                    },
                    in: {
                        _id: '$$branch._id',
                        name: {
                            en: '$$branch.name.en',
                            ar: '$$branch.name.ar',
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $addFields: {
            location: {
                _id: '$branch._id',
                name: {
                    en: [
                        {
                            $concat: [
                                '$country.name.en',
                                ' / ',
                                '$region.name.en',
                                ' / ',
                                '$subRegion.name.en',

                            ],
                        },
                        {
                            $concat: [
                                '$retailSegment.name.en',
                                ' / ',
                                '$outlet.name.en',
                                ' / ',
                                '$branch.name.en',
                            ],
                        },
                    ],
                    ar: [
                        {
                            $concat: [
                                '$country.name.ar',
                                ' / ',
                                '$region.name.ar',
                                ' / ',
                                '$subRegion.name.ar',

                            ],
                        },
                        {
                            $concat: [
                                '$retailSegment.name.ar',
                                ' / ',
                                '$outlet.name.ar',
                                ' / ',
                                '$branch.name.ar',
                            ],
                        },
                    ],
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: '$branch._id',
            data: {
                $addToSet: {
                    _id: '$branch._id',
                    name: '$branch.name',
                    count: '$count',
                    status: '$_id.status',
                    country: '$country',
                    location: '$location',
                },
            },
            labels: {
                $addToSet: '$location',
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
        $unwind: '$data',
    });

    pipeline.push({
        $sort: {
            'data.location.name.en': 1,
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
            'labels.name.en': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: {
                data: '$data',
                labels: '$labels',
            },
        },
    });

    pipeline.push({
        $project: {
            _id: 0,
            data: '$_id.data',
            labels: '$_id.labels',
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$data' },
            labels: { $push: '$labels' },
        },
    });

    pipeline.push({
        $project: {
            datasets: [{ data: '$data' }],
            labels: 1,
        },
    });
};
