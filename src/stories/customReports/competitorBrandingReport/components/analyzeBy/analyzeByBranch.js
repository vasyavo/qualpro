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
                _id: '$branch._id',
                name: {
                    en: {
                        $concat: ['$region.name.en', ' / ', '$subRegion.name.en', ' / ', '$branch.name.en'],
                    },
                    ar: {
                        $concat: ['$region.name.en', ' / ', '$subRegion.name.ar', ' / ', '$branch.name.ar'],
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
            subRegion: { $push: '$subRegion' },
            retailSegment: { $push: '$retailSegment' },
            outlet: { $push: '$outlet' },
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$location' },
        },
    });

    pipeline.push({
        $addFields: {
            datasets: [{ data: '$data' }],
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
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: {
                _id: 1,
                name: 1,
            },
            outlet: {
                _id: 1,
                name: 1,
            },
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
                    subRegion: '$subRegion',
                    retailSegment: '$retailSegment',
                    outlet: '$outlet',
                    datasets: '$datasets',
                    labels: '$labels',
                },
            },
        },
    });
};
