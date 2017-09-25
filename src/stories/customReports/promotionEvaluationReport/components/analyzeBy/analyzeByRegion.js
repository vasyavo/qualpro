module.exports = (pipeline) => {
    pipeline.push(...[
        {
            $lookup: {
                from: 'domains',
                localField: 'subRegion.parent',
                foreignField: '_id',
                as: 'region',
            },
        },
        {
            $addFields: {
                region: {
                    $let: {
                        vars: {
                            region: { $arrayElemAt: ['$region', 0] },
                        },
                        in: {
                            _id: '$$region._id',
                            name: '$$region.name',
                            parent: '$$region.parent',
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 1,
                country: '$country',
                region: '$region',
            },
        },
        {
            $group: {
                _id: {
                    promotion: '$_id',
                    region: '$region._id',
                },
                country: { $first: '$country' },
                region: { $first: '$region' },
            },
        },
        {
            $project: {
                _id: false,
                country: 1,
                region: 1,
            },
        },
        {
            $group: {
                _id: {
                    region: '$region._id',
                },
                country: { $first: '$country' },
                region: { $first: '$region' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: false,
                country: 1,
                region: 1,
                count: 1,
            },
        },
        {
            $addFields: {
                location: {
                    _id: '$region._id',
                    name: {
                        en: {
                            $concat: [
                                '$country.name.en',
                                ' / ',
                                '$region.name.en',
                            ],
                        },
                        ar: {
                            $concat: [
                                '$country.name.ar',
                                ' / ',
                                '$region.name.ar',
                            ],
                        },
                    },
                },
            },
        },
        {
            $sort: {
                'location.name': 1,
            },
        },
        {
            $group: {
                _id: null,
                data: {
                    $push: {
                        _id: '$region._id',
                        name: '$region.name',
                        country: '$country',
                        count: '$count',
                    },
                },
                labels: {
                    $push: '$location.name',
                },
            },
        },
    ]);
};
