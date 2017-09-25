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
                country: 1,
                region: 1,
                subRegion: 1,
            },
        },
        {
            $group: {
                _id: {
                    promotion: '$_id',
                    subRegion: '$subRegion._id',
                },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
            },
        },
        {
            $project: {
                _id: false,
                country: 1,
                region: 1,
                subRegion: 1,
            },
        },
        {
            $group: {
                _id: {
                    subRegion: '$subRegion._id',
                },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: false,
                country: 1,
                region: 1,
                subRegion: 1,
                count: 1,
            },
        },
        {
            $addFields: {
                location: {
                    _id: '$subRegion._id',
                    name: {
                        en: {
                            $concat: [
                                '$country.name.en',
                                ' / ',
                                '$region.name.en',
                                ' / ',
                                '$subRegion.name.en',
                            ],
                        },
                        ar: {
                            $concat: [
                                '$country.name.ar',
                                ' / ',
                                '$region.name.ar',
                                ' / ',
                                '$subRegion.name.ar',
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
                        _id: '$subRegion._id',
                        name: '$subRegion.name',
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
