module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$category',
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country',
                subRegion: '$subRegion',
                category: '$category',
            },
            region: { $addToSet: '$region' },
            retailSegment: { $addToSet: '$retailSegment' },
            outlet: { $addToSet: '$outlet' },
            branch: { $addToSet: '$branch' },
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
        $lookup: {
            from: 'domains',
            localField: '_id.subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'categories',
            localField: '_id.category',
            foreignField: '_id',
            as: 'category',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            count: 1,
            region: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
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
            subRegion: {
                $let: {
                    vars: {
                        subRegion: { $arrayElemAt: ['$subRegion', 0] },
                    },
                    in: {
                        _id: '$$subRegion._id',
                        name: '$$subRegion.name',
                    },
                },
            },
            category: {
                $let: {
                    vars: {
                        category: { $arrayElemAt: ['$category', 0] },
                    },
                    in: {
                        _id: '$$category._id',
                        name: '$$category.name',
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'country._id': 1,
            'category._id': 1,
            'subRegion._id': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country._id',
                category: '$category._id',
            },
            country: { $first: '$country' },
            region: { $push: '$region' },
            retailSegment: { $push: '$retailSegment' },
            outlet: { $push: '$outlet' },
            branch: { $push: '$branch' },
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$subRegion.name' },
        },
    });

    pipeline.push({
        $project: {
            country: 1,
            region: {
                $reduce: {
                    input: '$region',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $ne: ['$$this', []],
                                    },
                                    {
                                        $ne: ['$$this', null],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
            retailSegment: {
                $reduce: {
                    input: '$retailSegment',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $ne: ['$$this', []],
                                    },
                                    {
                                        $ne: ['$$this', null],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
            outlet: {
                $reduce: {
                    input: '$outlet',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $ne: ['$$this', []],
                                    },
                                    {
                                        $ne: ['$$this', null],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
            branch: {
                $reduce: {
                    input: '$branch',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $ne: ['$$this', []],
                                    },
                                    {
                                        $ne: ['$$this', null],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
            category: 1,
            datasets: [
                {
                    data: '$data',
                },
            ],
            labels: '$labels',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'retailSegments',
            localField: 'retailSegment',
            foreignField: '_id',
            as: 'retailSegment',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'outlets',
            localField: 'outlet',
            foreignField: '_id',
            as: 'outlet',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: 'branch',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeline.push({
        $project: {
            region: {
                _id: 1,
                name: 1,
            },
            retailSegment: {
                _id: 1,
                name: 1,
            },
            outlet: {
                _id: 1,
                name: 1,
            },
            branch: {
                _id: 1,
                name: 1,
            },
            country: 1,
            category: 1,
            datasets: 1,
            labels: 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            charts: {
                $push: {
                    category: '$category',
                    country: '$country',
                    region: '$region',
                    retailSegment: '$retailSegment',
                    outlet: '$outlet',
                    branch: '$branch',
                    datasets: '$datasets',
                    labels: '$labels',
                },
            },
        },
    });
};
