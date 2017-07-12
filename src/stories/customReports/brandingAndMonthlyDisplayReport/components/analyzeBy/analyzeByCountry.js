module.exports = (pipeline) => {
    pipeline.push({
        $unwind: '$category',
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country',
                category: '$category',
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
            'country._id': 1,
            'category._id': 1,
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
            datasets: [
                {
                    data: ['$count'],
                },
            ],
            labels: ['$country.name'],
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
                    datasets: '$datasets',
                    labels: '$labels',
                },
            },
        },
    });
};
