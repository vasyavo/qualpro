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
                timeFrames: '$timeFrames',
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
            localField: 'region',
            foreignField: '_id',
            as: 'region',
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
                $let: {
                    vars: {
                        region: { $arrayElemAt: ['$region', 0] },
                    },
                    in: {
                        _id: '$$region._id',
                        name: '$$region.name',
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
            branch: 1,
            retailSegment: 1,
            outlet: 1,
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
            count: 1,
        },
    });

    pipeline.push({
        $addFields: {
            location: {
                _id: '$subRegion._id',
                name: {
                    en: {
                        $concat: ['$region.name.en', ' / ', '$subRegion.name.en'],
                    },
                    ar: {
                        $concat: ['$region.name.ar', ' / ', '$subRegion.name.ar'],
                    },
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'country.name': 1,
            'location.name': 1,
            'category.name': 1,
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
            timeFrames: {
                $push: {
                    timeFrame: '$_id.timeFrames',
                    data: '$count',
                    _id: '$_id.subRegion',
                },
            },
            labels: { $push: '$location' },
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
            country: 1,
            region: 1,
            branch: {
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
