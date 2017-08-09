const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

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
                stocks: { $first: '$stocks' },
            },
        },
        {
            $project: {
                _id: '$_id.promotion', // tip: because one promotion analyzing
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                retailSegment: 1,
                outlet: 1,
            },
        },
        {
            $lookup: {
                from: CONTENT_TYPES.PROMOTIONSITEMS,
                localField: '_id',
                foreignField: 'promotion',
                as: 'reports',
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
                reports: {
                    $let: {
                        vars: {
                            reports: {
                                $filter: {
                                    input: '$reports',
                                    as: 'report',
                                    cond: {
                                        $eq: ['$$report.branch', '$branch._id'],
                                    },
                                },
                            },
                        },
                        in: {
                            $map: {
                                input: '$$reports',
                                as: 'report',
                                in: {
                                    openingStock: {
                                        $let: {
                                            vars: { openingStock: { $arrayElemAt: ['$$report.opening', 0] } },
                                            in: { $cond: { if: { $eq: ['$$openingStock', null] }, then: 0, else: '$$openingStock' } },
                                        },
                                    },
                                    sellIn: {
                                        $let: {
                                            vars: { sellIn: { $arrayElemAt: ['$$report.sellIn', 0] } },
                                            in: { $cond: { if: { $eq: ['$$sellIn', null] }, then: 0, else: '$$sellIn' } },
                                        },
                                    },
                                    closingStock: {
                                        $let: {
                                            vars: { closingStock: { $arrayElemAt: ['$$report.closingStock', 0] } },
                                            in: { $cond: { if: { $eq: ['$$closingStock', null] }, then: 0, else: '$$closingStock' } },
                                        },
                                    },
                                    sellOut: {
                                        $let: {
                                            vars: { sellOut: { $arrayElemAt: ['$$report.sellOut', 0] } },
                                            in: { $cond: { if: { $eq: ['$$sellOut', null] }, then: 0, else: '$$sellOut' } },
                                        },
                                    },
                                    filledAt: '$$report.createdBy.date',
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: '$reports',
            },
        },
        {
            $sort: {
                'branch.name': 1,
                'reports.filledAt': 1,
            },
        },
        {
            $group: {
                _id: '$branch._id',
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                branch: { $first: '$branch' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                openingStock: {
                    $first: '$reports.openingStock',
                },
                closingStock: {
                    $last: '$reports.closingStock',
                },
                sellIn: {
                    $sum: '$reports.sellIn',
                },
                sellOut: {
                    $sum: '$reports.sellOut',
                },
            },
        },
        {
            $project: {
                _id: false,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                openingStock: 1,
                closingStock: 1,
                sellIn: 1,
                sellOut: 1,
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
                                    '$retailSegment.name.en',
                                    ' / ',
                                    '$outlet.name.en',
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
                                    '$retailSegment.name.ar',
                                    ' / ',
                                    '$outlet.name.ar',
                                    ' / ',
                                    '$branch.name.ar',
                                ],
                            },
                        ],
                    },
                },
                branch: 1,
                openingStock: 1,
                sellIn: 1,
                closingStock: 1,
                sellOut: 1,
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
                        region: '$region',
                        subRegion: '$subRegion',
                        openingStock: '$openingStock',
                        sellIn: '$sellIn',
                        closingStock: '$closingStock',
                        sellOut: '$sellOut',
                    },
                },
                labels: {
                    $push: '$location.name',
                },
            },
        },
    ]);
};
