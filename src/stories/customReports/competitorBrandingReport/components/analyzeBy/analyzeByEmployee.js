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
            'country._id': 1,
            'category._id': 1,
            'employee._id': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: {
                country: '$country._id',
                category: '$category._id',
            },
            country: { $first: '$country' },
            category: { $first: '$category' },
            data: { $push: '$count' },
            labels: { $push: '$employee.name' },
        },
    });

    pipeline.push({
        $project: {
            country: 1,
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
        $group: {
            _id: null,
            charts: {
                $push: {
                    category: '$category',
                    country: '$country',
                    dataSets: '$dataSets',
                    labels: '$labels',
                },
            },
        },
    });
};
