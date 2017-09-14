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
        $unwind: '$region',
    });

    if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
        pipeline.push({
            $match: {
                region: { $in: queryFilter[CONTENT_TYPES.REGION] },
            },
        });
    }

    pipeline.push({
        $group: {
            _id: '$region',
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: '_id',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $project: {
            _id: false,
            count: 1,
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
                _id: '$region._id',
                name: {
                    en: {
                        $concat: ['$country.name.en', ' / ', '$region.name.en'],
                    },
                    ar: {
                        $concat: ['$country.name.ar', ' / ', '$region.name.ar'],
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
