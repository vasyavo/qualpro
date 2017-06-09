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
        const query = req.query;
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
                _id: null,
                countries: { $addToSet: '$country' },
                regions: { $addToSet: '$region' },
                subRegions: { $addToSet: '$subRegion' },
                retailSegments: { $addToSet: '$retailSegment' },
                outlets: { $addToSet: '$outlet' },
                branches: { $addToSet: '$branch' },
                categories: { $addToSet: '$category' },
                sizes: { $addToSet: '$items.size' },
                variants: { $addToSet: '$variant' },
                brands: { $addToSet: '$items.brand' },
                positions: { $addToSet: '$createdBy.user.position' },
                personnels: { $addToSet: '$createdBy.user' },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'countries',
                foreignField: '_id',
                as: 'countries',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'regions',
                foreignField: '_id',
                as: 'regions',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegions',
                foreignField: '_id',
                as: 'subRegions',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegments',
                foreignField: '_id',
                as: 'retailSegments',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlets',
                foreignField: '_id',
                as: 'outlets',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branches',
                foreignField: '_id',
                as: 'branches',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'variants',
                localField: 'variants',
                foreignField: '_id',
                as: 'variants',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'brands',
                localField: 'brands',
                foreignField: '_id',
                as: 'brands',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'positions',
                foreignField: '_id',
                as: 'positions',
            },
        });

        pipeline.push({
            $project: {
                _id: 0,
                sizes: 1,
                personnels: 1,
                countries: {
                    _id: 1,
                    name: 1,
                },
                regions: {
                    _id: 1,
                    name: 1,
                },
                subRegions: {
                    _id: 1,
                    name: 1,
                },
                retailSegments: {
                    _id: 1,
                    name: 1,
                },
                outlets: {
                    _id: 1,
                    name: 1,
                },
                branches: {
                    _id: 1,
                    name: 1,
                },
                categories: {
                    _id: 1,
                    name: 1,
                },
                variants: {
                    _id: 1,
                    name: 1,
                },
                brands: {
                    _id: 1,
                    name: 1,
                },
                positions: {
                    _id: 1,
                    name: 1,
                },
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

        const response = result && result[0] ? result[0] : {
            sizes: [],
            personnels: [],
            countries: [],
            regions: [],
            subRegions: [],
            retailSegments: [],
            outlets: [],
            branches: [],
            categories: [],
            variants: [],
            brands: [],
            positions: [],
        };

        res.status(200).send(response);
    });
};
