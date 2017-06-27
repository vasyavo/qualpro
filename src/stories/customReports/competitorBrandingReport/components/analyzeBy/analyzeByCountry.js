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
            category: 1,
            dataSets: [
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
                    category: '$category',
                    dataSets: '$dataSets',
                    labels: '$labels',
                },
            },
        },
    });
};
