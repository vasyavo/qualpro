module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$category',
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country',
                employee: '$createdBy.user._id',
                category: '$category',
                timeFrames: '$timeFrames',
            },
            region: { $addToSet: '$region' },
            subRegion: { $addToSet: '$subRegion' },
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
            from: 'personnels',
            localField: '_id.employee',
            foreignField: '_id',
            as: 'employee',
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
            employee: {
                $let: {
                    vars: {
                        employee: { $arrayElemAt: ['$employee', 0] },
                    },
                    in: {
                        _id: '$$employee._id',
                        name: {
                            en: { $concat: ['$$employee.firstName.en', ' ', '$$employee.lastName.en'] },
                            ar: { $concat: ['$$employee.firstName.ar', ' ', '$$employee.lastName.ar'] },
                        },
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
            'country.name': 1,
            'category.name': 1,
            'employee.name': 1,
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
            branch: { $push: '$branch' },
            category: { $first: '$category' },
            timeFrames: {
                $push: {
                    timeFrame: '$_id.timeFrames',
                    data: '$count',
                    _id: '$_id.employee',
                },
            },
            labels: { $push: '$employee' },
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
            timeFrames: 1,
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
            branch: {
                _id: 1,
                name: 1,
            },
            country: 1,
            category: 1,
            timeFrames: 1,
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
                    branch: '$branch',
                    timeFrames: '$timeFrames',
                    labels: '$labels',
                },
            },
        },
    });
};
