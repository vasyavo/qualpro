module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$category',
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country',
                branch: '$branch',
                category: '$category',
            },
            region: { $addToSet: '$region' },
            subRegion: { $addToSet: '$subRegion' },
            retailSegment: { $addToSet: '$retailSegment' },
            outlet: { $addToSet: '$outlet' },
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
            from: 'branches',
            localField: '_id.branch',
            foreignField: '_id',
            as: 'branch',
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
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
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
            branch: {
                $let: {
                    vars: {
                        branch: { $arrayElemAt: ['$branch', 0] },
                    },
                    in: {
                        _id: '$$branch._id',
                        name: '$$branch.name',
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
            'branch._id': 1,
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
            subRegion: { $push: '$subRegion' },
            retailSegment: { $push: '$retailSegment' },
            outlet: { $push: '$outlet' },
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$branch.name' },
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
            subRegion: {
                $reduce: {
                    input: '$subRegion',
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
            category: 1,
            dataSets: [
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
            from: 'domains',
            localField: 'subRegion',
            foreignField: '_id',
            as: 'subRegion',
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
        $project: {
            region: {
                _id: 1,
                name: 1,
            },
            subRegion: {
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
            country: 1,
            category: 1,
            dataSets: 1,
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
                    subRegion: '$subRegion',
                    retailSegment: '$retailSegment',
                    outlet: '$outlet',
                    dataSets: '$dataSets',
                    labels: '$labels',
                },
            },
        },
    });
};
