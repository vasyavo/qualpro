const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PriceSurveyModel = require('./../../../../types/priceSurvey/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const getMedian = require('./../../../../utils/getMedian');
const generalFiler = require('./../../utils/generalFilter');
const moment = require('moment');
const currency = require('../../utils/currency');

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

    const query = req.body;
    const queryFilter = query.filter || {};
    const timeFilter = query.timeFilter;

    const queryRun = (personnel, callback) => {
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
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
                    outlet: '$outlet',
                    branch: '$branch',
                    brand: '$items.brand',
                    size: '$items.size',
                    variant: '$variant',
                    category: '$category',
                },
                min: { $min: '$items.price' },
                max: { $max: '$items.price' },
                avg: { $avg: '$items.price' },
                arrayOfPrice: { $push: '$items.price' },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $sum: 1 },
                setData: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$setData',
        });

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
        });

        pipeline.push({
            $project: {
                outlet: '$setData._id.outlet',
                branch: '$setData._id.branch',
                brand: '$setData._id.brand',
                size: '$setData._id.size',
                variant: '$setData._id.variant',
                category: '$setData._id.category',
                min: '$setData.min',
                max: '$setData.max',
                avg: '$setData.avg',
                arrayOfPrice: '$setData.arrayOfPrice',
                country: '$setData.country',
                region: '$setData.region',
                subRegion: '$setData.subRegion',
                retailSegment: '$setData.retailSegment',
                total: 1,
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
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'variants',
                localField: 'variant',
                foreignField: '_id',
                as: 'variant',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
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
            $project: {
                _id: 0,
                min: 1,
                max: 1,
                avg: 1,
                arrayOfPrice: 1,
                total: 1,
                size: '$size',
                country: { $arrayElemAt: ['$country', 0] },
                branch: {
                    $let: {
                        vars: {
                            branch: { $arrayElemAt: ['$branch', 0] },
                        },
                        in: {
                            _id: '$$branch._id',
                            name: '$$branch.name',
                        },
                    },
                },
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
                variant: {
                    $let: {
                        vars: {
                            variant: { $arrayElemAt: ['$variant', 0] },
                        },
                        in: {
                            _id: '$$variant._id',
                            name: '$$variant.name',
                        },
                    },
                },
                location: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                            region: { $arrayElemAt: ['$region', 0] },
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                            outlet: { $arrayElemAt: ['$outlet', 0] },
                        },
                        in: {
                            $concat: [
                                '$$country.name.en',
                                ' -> ',
                                '$$region.name.en',
                                ' -> ',
                                '$$subRegion.name.en',
                                ' -> ',
                                '$$retailSegment.name.en',
                                ' -> ',
                                '$$outlet.name.en',
                            ],
                        },
                    },
                },
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
                'branch.name.en': 1,
            },
        });

        pipeline.push({
            $sort: {
                'category.name.en': 1,
                'brand.name.en': 1,
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: { $push: '$$ROOT' },
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

        const response = result.length ?
            result[0] : { data: [], total: 0 };

        response.data.forEach((item) => {
            const currentCountry = currency.defaultData.find((country) => {
                return country._id.toString() === item.country._id.toString();
            });
            item.med = getMedian(item.arrayOfPrice);
            if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length > 1) {
                item.min = parseFloat(item.min * currentCountry.currencyInUsd).toFixed(2);
                item.avg = parseFloat(item.avg * currentCountry.currencyInUsd).toFixed(2);
                item.max = parseFloat(item.max * currentCountry.currencyInUsd).toFixed(2);
                item.med = parseFloat(item.med * currentCountry.currencyInUsd).toFixed(2);
                item.min = `${item.min} $`;
                item.avg = `${item.avg} $`;
                item.max = `${item.max} $`;
                item.med = `${item.med} $`;
            } else {
                item.min = `${item.min.toFixed(2)} ${currentCountry.currency}`;
                item.avg = `${item.avg.toFixed(2)} ${currentCountry.currency}`;
                item.max = `${item.max.toFixed(2)} ${currentCountry.currency}`;
                item.med = `${item.med.toFixed(2)} ${currentCountry.currency}`;
            }
        });

        res.status(200).send(response);
    });
};
