const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PriceSurveyModel = require('./../../../../types/priceSurvey/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const moment = require('moment');

const ajv = new Ajv();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const timeFilterSchema = {
        type: 'object',
        properties: {
            timeFrames: {
                type: 'array',
                items: {
                    from: {
                        type: 'string',
                    },
                    to: {
                        type: 'string',
                    },
                    required: ['from', 'to'],
                },
            },
        },
    };

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT, CONTENT_TYPES.ITEM,
            CONTENT_TYPES.BRAND, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];
        const pipeline = [];

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        const $timeMatch = {};

        $timeMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$or.push({
                    $and: [
                        {
                            'createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
                        },
                    ],
                });
                return frame;
            });
        }

        if ($timeMatch.$or.length) {
            pipeline.push({
                $match: $timeMatch,
            });
        }

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            });
        }

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeline.push({
            $addFields: {
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ['$createdBy.user', 0] },
                            },
                            in: {
                                _id: '$$user._id',
                                name: {
                                    en: { $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] },
                                    ar: { $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] },
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    date: '$createdBy.date',
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'createdBy.user.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push({
            $unwind: '$items',
        });

        if (queryFilter[CONTENT_TYPES.BRAND] && queryFilter[CONTENT_TYPES.BRAND].length) {
            pipeline.push({
                $match: {
                    'items.brand': {
                        $in: queryFilter[CONTENT_TYPES.BRAND],
                    },
                },
            });
        }

        if (queryFilter.size && queryFilter.size.length) {
            pipeline.push({
                $match: {
                    'items.size': {
                        $in: queryFilter.size,
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: {
                    country: '$country',
                    category: '$category',
                    brand: '$items.brand',
                },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                branch: { $addToSet: '$branch' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                price: { $avg: '$items.price' },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'brands',
                localField: '_id.brand',
                foreignField: '_id',
                as: 'brand',
            },
        });

        pipeline.push({
            $addFields: {
                brand: {
                    $let: {
                        vars: {
                            brand: { $arrayElemAt: ['$brand', 0] },
                        },
                        in: {
                            _id: '$$brand._id',
                            name: '$$brand.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: {
                    country: '$_id.country',
                    category: '$_id.category',
                },
                region: { $push: '$region' },
                subRegion: { $push: '$subRegion' },
                retailSegment: { $push: '$retailSegment' },
                outlet: { $push: '$outlet' },
                branch: { $push: '$branch' },
                data: { $push: '$price' },
                labels: { $push: '$brand' },
            },
        });

        pipeline.push({
            $project: {
                region: {
                    $reduce: {
                        input: '$region',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                subRegion: {
                    $reduce: {
                        input: '$subRegion',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                retailSegment: {
                    $reduce: {
                        input: '$retailSegment',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                outlet: {
                    $reduce: {
                        input: '$outlet',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                branch: {
                    $reduce: {
                        input: '$branch',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                data: 1,
                labels: 1,
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
                data: 1,
                labels: 1,
            },
        });

        pipeline.push({
            $project: {
                _id: 0,
                datasets: [
                    {
                        data: '$data',
                    },
                ],
                labels: 1,
                category: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                charts: { $push: '$$ROOT' },
            },
        });

        PriceSurveyModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.PRICE_SURVEY, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        let response = result[0];

        if (!response || !response.charts) {
            response = {
                charts: [],
            };
        }

        response.charts.forEach((chart) => {
            chart.datasets[0].data = chart.datasets[0].data.map(price => price.toFixed(2));
        });

        res.status(200).send(response);
    });
};
