module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$category',
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country',
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
        $group: {
            _id: {
                country: '$_id.country',
                category: '$_id.category',
            },
            region: { $addToSet: '$region' },
            subRegion: { $addToSet: '$subRegion' },
            retailSegment: { $addToSet: '$retailSegment' },
            outlet: { $addToSet: '$outlet' },
            branch: { $addToSet: '$branch' },
            count: {
                $addToSet: {
                    timeFrame: '$_id.timeFrames',
                    data: '$count',
                    _id : '$_id.country'
                },
            },
        },
    });

    pipeline.push({
        $addFields: {
            region: {
                $reduce: {
                    input: '$region',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $ne: ['$$value', []],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$this',
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
                                $ne: ['$$value', []],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$this',
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
                                $ne: ['$$value', []],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$this',
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
                                $ne: ['$$value', []],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$this',
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
                                $ne: ['$$value', []],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$this',
                        },
                    },
                },
            },
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
        },
    });

    pipeline.push({
        $project: {
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
            category: 1,
            datasets: '$count',
            labels: ['$country'],
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            charts: {
                $push: {
                    country: '$country',
                    region: '$region',
                    subRegion: '$subRegion',
                    retailSegment: '$retailSegment',
                    outlet: '$outlet',
                    branch: '$branch',
                    category: '$category',
                    timeFrames: '$datasets',
                    labels: '$labels',
                },
            },
        },
    });
};
