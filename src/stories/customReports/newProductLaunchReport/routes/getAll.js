const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const _ = require('lodash');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const NewProductLaunch = require('./../../../../types/newProductLaunch/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
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
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
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

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE, 'packing'], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRAND] && queryFilter[CONTENT_TYPES.BRAND].length) {
            $generalMatch.$and.push({
                'brand.name': {
                    $in: queryFilter[CONTENT_TYPES.BRAND],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.VARIANT] && queryFilter[CONTENT_TYPES.VARIANT].length) {
            $generalMatch.$and.push({
                'variant.name': {
                    $in: queryFilter[CONTENT_TYPES.VARIANT],
                },
            });
        }

        if (queryFilter.distributor && queryFilter.distributor.length) {
            $generalMatch.$and.push({
                $or: [
                    {
                        'distributor.en': {
                            $in: queryFilter.distributor,
                        },
                    },
                    {
                        'distributor.ar': {
                            $in: queryFilter.distributor,
                        },
                    },
                ],
            });
        }

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

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        if (queryFilter.shelfLife) {
            queryFilter.shelfLife = parseInt(queryFilter.shelfLife, 10);

            pipeline.push({
                $addFields: {
                    shelfLifePeriod: {
                        $trunc: {
                            $divide: [
                                {
                                    $subtract: ['$shelfLifeEnd', '$shelfLifeStart'],
                                },
                                86400000,
                            ],
                        },
                    },
                },
            });

            pipeline.push({
                $match: {
                    shelfLifePeriod: queryFilter.shelfLife,
                },
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
            $project: {
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                brand: 1,
                category: 1,
                variant: 1,
                packing: 1,
                displayType: 1,
                price: 1,
                origin: 1,
                shelfLifeStart: 1,
                shelfLifeEnd: 1,
                distributor: 1,
                attachments: 1,
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
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'displayTypes',
                localField: 'displayType',
                foreignField: '_id',
                as: 'displayType',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'origins',
                localField: 'origin',
                foreignField: '_id',
                as: 'origin',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'files',
                localField: 'attachments',
                foreignField: '_id',
                as: 'attachments',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                _id: 1,
                location: {
                    $concat: [
                        {
                            $let: {
                                vars: {
                                    country: { $arrayElemAt: ['$country', 0] },
                                },
                                in: '$$country.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    region: { $arrayElemAt: ['$region', 0] },
                                },
                                in: '$$region.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    subRegion: { $arrayElemAt: ['$subRegion', 0] },
                                },
                                in: '$$subRegion.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                                },
                                in: '$$retailSegment.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    outlet: { $arrayElemAt: ['$outlet', 0] },
                                },
                                in: '$$outlet.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    branch: { $arrayElemAt: ['$branch', 0], },
                                },
                                in: '$$branch.name.en',
                            },
                        },
                    ],
                },
                createdBy: 1,
                brand: 1,
                category: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0], },
                        },
                        in: {
                            _id: '$$category._id',
                            name: '$$category.name',
                        },
                    },
                },
                variant: 1,
                packing: 1,
                displayType: {
                    _id: 1,
                    name: 1,
                },
                price: 1,
                origin: {
                    $let: {
                        vars: {
                            origin: { $arrayElemAt: ['$origin', 0] },
                        },
                        in: {
                            _id: '$$origin._id',
                            name: '$$origin.name',
                        },
                    },
                },
                shelfLifeStart: 1,
                shelfLifeEnd: 1,
                distributor: 1,
                attachments: 1,
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $sum: 1 },
                setProducts: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$setProducts',
        });

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
        });

        pipeline.push({
            $project: {
                total: 1,
                _id: '$setProducts._id',
                location: '$setProducts.location',
                createdBy: '$setProducts.createdBy',
                brand: '$setProducts.brand',
                category: '$setProducts.category',
                variant: '$setProducts.variant',
                packing: '$setProducts.packing',
                displayType: '$setProducts.displayType',
                price: '$setProducts.price',
                origin: '$setProducts.origin',
                shelfLifeStart: '$setProducts.shelfLifeStart',
                shelfLifeEnd: '$setProducts.shelfLifeEnd',
                distributor: '$setProducts.distributor',
                attachments: '$setProducts.attachments',
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: { $push: '$$ROOT' },
            },
        });

        NewProductLaunch.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, cb);
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

        res.status(200).send(response);
    });
};
