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
        },
    });

    pipeline.push({
        $unwind: '$subRegion',
    });

    if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
        pipeline.push({
            $match: {
                subRegion: { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
            },
        });
    }

    pipeline.push({
        $group: {
            _id: '$subRegion',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $project: {
            _id: false,
            count: 1,
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
        $project: {
            _id: false,
            country: 1,
            count: 1,
            location: {
                _id: '$subRegion._id',
                name: {
                    en: {
                        $concat: ['$country.name.en', ' / ', '$region.name.en', ' / ', '$subRegion.name.en'],
                    },
                    ar: {
                        $concat: ['$country.name.ar', ' / ', '$region.name.ar', ' / ', '$subRegion.name.ar'],
                    },
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
