const _ = require('lodash');
const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

module.exports = (pipeline, queryFilter) => {
    pipeline.push({
        $project: {
            _id: false,
            country: { $ifNull: ['$country', []] },
            region: {
                $cond: {
                    if: { $gt: [{ $size: { $ifNull: ['$region', []] } }, 0] },
                    then: { selected: '$region' },
                    else: { all: 'region' },
                },
            },
            subRegion: {
                $cond: {
                    if: { $gt: [{ $size: { $ifNull: ['$subRegion', []] } }, 0] },
                    then: { selected: '$subRegion' },
                    else: { all: 'subRegion' },
                },
            },
            branch: {
                $cond: {
                    if: { $gt: [{ $size: { $ifNull: ['$branch', []] } }, 0] },
                    then: { selected: '$branch' },
                    else: { all: 'branch' },
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region.selected',
            foreignField: '_id',
            as: 'region.selected',
        },
    });

    {
        const $addFields = {};

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            $addFields['region.selected'] = {
                $let: {
                    vars: {
                        filters: {
                            country: queryFilter[CONTENT_TYPES.COUNTRY],
                        },
                    },
                    in: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$region.selected',
                                    as: 'region',
                                    cond: {
                                        $and: [
                                            { $eq: ['$$region.archived', false] },
                                            { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                        ],
                                    },
                                },
                            },
                            as: 'region',
                            in: '$$region._id',
                        },
                    },
                },
            };
        } else {
            $addFields['region.selected'] = {
                $map: {
                    input: {
                        $filter: {
                            input: '$region.selected',
                            as: 'region',
                            cond: {
                                $eq: ['$$region.archived', false],
                            },
                        },
                    },
                    as: 'region',
                    in: '$$region._id',
                },
            };
        }

        pipeline.push({ $addFields });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region.all',
            foreignField: 'type',
            as: 'region.all',
        },
    });

    {
        const $addFields = {};

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            $addFields.region = {
                $let: {
                    vars: {
                        filters: {
                            country: queryFilter[CONTENT_TYPES.COUNTRY],
                        },
                    },
                    in: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: {
                                        $ifNull: ['$region.selected', []],
                                    },
                                }, 0],
                            },
                            then: '$region.selected',
                            else: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$region.all',
                                            as: 'region',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$region.archived', false] },
                                                    { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'region',
                                    in: '$$region._id',
                                },
                            },
                        },
                    },
                },
            };
        } else {
            $addFields.region = {
                $map: {
                    input: {
                        $filter: {
                            input: '$region.all',
                            as: 'region',
                            cond: {
                                $eq: ['$$region.archived', false],
                            },
                        },
                    },
                    as: 'region',
                    in: '$$region._id',
                },
            };
        }

        pipeline.push({ $addFields });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion.selected',
            foreignField: '_id',
            as: 'subRegion.selected',
        },
    });

    {
        const $addFields = {};

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            $addFields['subRegion.selected'] = {
                $let: {
                    vars: {
                        filters: {
                            region: queryFilter[CONTENT_TYPES.REGION],
                        },
                    },
                    in: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$subRegion.selected',
                                    as: 'subRegion',
                                    cond: {
                                        $and: [
                                            { $eq: ['$$subRegion.archived', false] },
                                            { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                        ],
                                    },
                                },
                            },
                            as: 'subRegion',
                            in: '$$subRegion._id',
                        },
                    },
                },
            };
        } else {
            $addFields['subRegion.selected'] = {
                $map: {
                    input: {
                        $filter: {
                            input: '$subRegion.selected',
                            as: 'subRegion',
                            cond: {
                                $and: [
                                    { $eq: ['$$subRegion.archived', false] },
                                    { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                ],
                            },
                        },
                    },
                    as: 'subRegion',
                    in: '$$subRegion._id',
                },
            };
        }

        pipeline.push({ $addFields });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion.all',
            foreignField: 'type',
            as: 'subRegion.all',
        },
    });

    {
        const $addFields = {};

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            $addFields.subRegion = {
                $let: {
                    vars: {
                        filters: {
                            region: queryFilter[CONTENT_TYPES.REGION],
                        },
                    },
                    in: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: {
                                        $ifNull: ['$subRegion.selected', []],
                                    },
                                }, 0],
                            },
                            then: '$subRegion.selected',
                            else: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$subRegion.all',
                                            as: 'subRegion',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$subRegion.archived', false] },
                                                    { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'subRegion',
                                    in: '$$subRegion._id',
                                },
                            },
                        },
                    },
                },
            };
        } else {
            $addFields.subRegion = {
                $map: {
                    input: {
                        $filter: {
                            input: '$subRegion.all',
                            as: 'subRegion',
                            cond: {
                                $and: [
                                    { $eq: ['$$subRegion.archived', false] },
                                    { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                ],
                            },
                        },
                    },
                    as: 'subRegion',
                    in: '$$subRegion._id',
                },
            };
        }

        pipeline.push({ $addFields });
    }

    pipeline.push({
        $project: {
            subRegion: 1,
            branch: 1,
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: 'branch.selected',
            foreignField: '_id',
            as: 'branch.selected',
        },
    });
    {
        const $addFields = {};

        if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
            $addFields['branch.selected'] = {
                $let: {
                    vars: {
                        filters: {
                            subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                        },
                    },
                    in: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$branch.selected',
                                    as: 'branch',
                                    cond: {
                                        $and: [
                                            { $eq: ['$$branch.archived', false] },
                                            { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                        ],
                                    },
                                },
                            },
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                                subRegion: '$$branch.subRegion',
                                retailSegment: '$$branch.retailSegment',
                                outlet: '$$branch.outlet',
                            },
                        },
                    },
                },
            };
        } else {
            $addFields['branch.selected'] = {
                $map: {
                    input: {
                        $filter: {
                            input: '$branch.selected',
                            as: 'branch',
                            cond: {
                                $and: [
                                    { $eq: ['$$branch.archived', false] },
                                    { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                ],
                            },
                        },
                    },
                    as: 'branch',
                    in: {
                        _id: '$$branch._id',
                        subRegion: '$$branch.subRegion',
                        retailSegment: '$$branch.retailSegment',
                        outlet: '$$branch.outlet',
                    },
                },
            };
        }

        pipeline.push({ $addFields });
    }

    if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
        pipeline.push({
            $addFields: {
                'branch.selected': {
                    $let: {
                        vars: {
                            filters: {
                                retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                            },
                        },
                        in: {
                            $filter: {
                                input: '$branch.selected',
                                as: 'branch',
                                cond: {
                                    $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
        pipeline.push({
            $addFields: {
                'branch.selected': {
                    $let: {
                        vars: {
                            filters: {
                                outlet: queryFilter[CONTENT_TYPES.OUTLET],
                            },
                        },
                        in: {
                            $filter: {
                                input: '$branch.selected',
                                as: 'branch',
                                cond: {
                                    $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: 'subRegion',
            foreignField: 'subRegion',
            as: 'branch.all',
        },
    });

    {
        const $addFields = {};

        if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
            $addFields.branch = {
                $let: {
                    vars: {
                        filters: {
                            subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                        },
                    },
                    in: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: {
                                        $ifNull: ['$branch.selected', []],
                                    },
                                }, 0],
                            },
                            then: '$branch.selected',
                            else: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.all',
                                            as: 'branch',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$branch.archived', false] },
                                                    { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        subRegion: '$$branch.subRegion',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            };
        } else {
            $addFields.branch = {
                $map: {
                    input: {
                        $filter: {
                            input: '$branch.all',
                            as: 'branch',
                            cond: {
                                $and: [
                                    { $eq: ['$$branch.archived', false] },
                                    { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                ],
                            },
                        },
                    },
                    as: 'branch',
                    in: {
                        _id: '$$branch._id',
                        subRegion: '$$branch.subRegion',
                        retailSegment: '$$branch.retailSegment',
                        outlet: '$$branch.outlet',
                    },
                },
            };
        }

        pipeline.push({ $addFields });
    }

    if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
        pipeline.push({
            $addFields: {
                branch: {
                    $let: {
                        vars: {
                            filters: {
                                retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                            },
                        },
                        in: {
                            $filter: {
                                input: '$branch',
                                as: 'branch',
                                cond: {
                                    $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
        pipeline.push({
            $addFields: {
                branch: {
                    $let: {
                        vars: {
                            filters: {
                                outlet: queryFilter[CONTENT_TYPES.OUTLET],
                            },
                        },
                        in: {
                            $filter: {
                                input: '$branch',
                                as: 'branch',
                                cond: {
                                    $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    pipeline.push({
        $project: {
            branch: 1,
        },
    });

    pipeline.push({
        $unwind: '$branch',
    });

    if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
        pipeline.push({
            $match: {
                'branch._id': { $in: queryFilter[CONTENT_TYPES.BRANCH] },
            },
        });
    }

    pipeline.push({
        $group: {
            _id: '$branch._id',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeline.push({
        $project: {
            _id: false,
            count: 1,
            branch: {
                $let: {
                    vars: {
                        branch: { $arrayElemAt: ['$branch', 0] },
                    },
                    in: {
                        _id: '$$branch._id',
                        name: '$$branch.name',
                        outlet: '$$branch.outlet',
                        retailSegment: '$$branch.retailSegment',
                        subRegion: '$$branch.subRegion',
                    },
                },
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
        pipeline.push({
            $match: {
                'branch.subRegion': { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'branch.subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $addFields: {
            subRegion: {
                $let: {
                    vars: {
                        subRegion: { $arrayElemAt: ['$subRegion', 0] },
                    },
                    in: {
                        _id: '$$subRegion._id',
                        name: '$$subRegion.name',
                        parent: '$$subRegion.parent',
                    },
                },
            },
        },
    });

    if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
        pipeline.push({
            $match: {
                'subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion.parent',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
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
    });

    if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
        pipeline.push({
            $match: {
                'region.parent': { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region.parent',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $addFields: {
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
        },
    });

    pipeline.push({
        $lookup: {
            from: 'outlets',
            localField: 'branch.outlet',
            foreignField: '_id',
            as: 'outlet',
        },
    });

    pipeline.push({
        $addFields: {
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
    });

    pipeline.push({
        $lookup: {
            from: 'retailSegments',
            localField: 'branch.retailSegment',
            foreignField: '_id',
            as: 'retailSegment',
        },
    });

    pipeline.push({
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
    });

    pipeline.push({
        $project: {
            _id: false,
            country: 1,
            count: 1,
            location: {
                _id: '$branch._id',
                name: {
                    en: [
                        {
                            $concat: ['$country.name.en', ' / ', '$region.name.en', ' / ', '$subRegion.name.en'],
                        },
                        {
                            $concat: ['$outlet.name.en', ' / ', '$retailSegment.name.en', ' / ', '$branch.name.en'],
                        },
                    ],
                    ar: [
                        {
                            $concat: ['$country.name.ar', ' / ', '$region.name.ar', ' / ', '$subRegion.name.ar'],
                        },
                        {
                            $concat: ['$outlet.name.ar', ' / ', '$retailSegment.name.ar', ' / ', '$branch.name.ar'],
                        },
                    ],
                },
            },
        },
    });

    pipeline.push({
        $sort: {
            'country.name': 1,
            'location.name': 1,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: {
                    country: '$country',
                    count: '$count',
                },
            },
            labels: { $push: '$location' },
        },
    });
};
