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
            $lookup: {
                from: 'domains',
                localField: 'region.parent',
                foreignField: '_id',
                as: 'country',
            },
        },
        {
            $addFields: {
                country: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                        },
                        in: {
                            _id: '$$country._id',
                            name: {
                                en: '$$country.name.en',
                                ar: '$$country.name.ar',
                            },
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'outlets',
                localField: 'branch.outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        },
        {
            $addFields: {
                branch: {
                    _id: '$branch._id',
                    name: '$branch.name',
                    retailSegment: '$branch.retailSegment',
                },
                outlet: {
                    $let: {
                        vars: {
                            outlet: { $arrayElemAt: ['$outlet', 0] },
                        },
                        in: {
                            _id: '$$outlet._id',
                            name: {
                                en: '$$outlet.name.en',
                                ar: '$$outlet.name.ar',
                            },
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'retailSegments',
                localField: 'branch.retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        },
        {
            $addFields: {
                branch: {
                    _id: '$branch._id',
                    name: '$branch.name',
                },
                retailSegment: {
                    $let: {
                        vars: {
                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                        },
                        in: {
                            _id: '$$retailSegment._id',
                            name: {
                                en: '$$retailSegment.name.en',
                                ar: '$$retailSegment.name.ar',
                            },
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
                branch: 1,
                retailSegment: 1,
                outlet: 1,
                count: 1,
            },
        },
        {
            $group: {
                _id: {
                    promotion: '$_id',
                    branch: '$branch._id',
                },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                branch: { $first: '$branch' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
            },
        },
        {
            $project: {
                _id: false,
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                retailSegment: 1,
                outlet: 1,
            },
        },
        {
            $group: {
                _id: {
                    branch: '$branch._id',
                },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                branch: { $first: '$branch' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: false,
                location: {
                    _id: '$branch._id',
                    name: {
                        en: [
                            {
                                $concat: [
                                    '$country.name.en',
                                    ' / ',
                                    '$region.name.en',
                                    ' / ',
                                    '$subRegion.name.en',
                                ],
                            },
                            {
                                $concat: [
                                    '$outlet.name.en',
                                    ' / ',
                                    '$retailSegment.name.en',
                                    ' / ',
                                    '$branch.name.en',
                                ],
                            },
                        ],
                        ar: [
                            {
                                $concat: [
                                    '$country.name.ar',
                                    ' / ',
                                    '$region.name.ar',
                                    ' / ',
                                    '$subRegion.name.ar',
                                ],
                            },
                            {
                                $concat: [
                                    '$outlet.name.ar',
                                    ' / ',
                                    '$retailSegment.name.ar',
                                    ' / ',
                                    '$branch.name.ar',
                                ],
                            },
                        ],
                    },
                },
                country: 1,
                branch: 1,
                count: 1,
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
                        _id: '$branch._id',
                        name: '$branch.name',
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
