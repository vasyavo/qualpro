const ObjectId = require('bson-objectid');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const generalFiler = require('./../../utils/generalFilter');
const NewProductLaunch = require('./../../../../types/newProductLaunch/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const currency = require('../../utils/currency');
const sanitizeHtml = require('../../utils/sanitizeHtml');
const moment = require('moment');

const ajv = new Ajv();

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
    const timeFilter = query.timeFilter;
    const queryFilter = query.filter || {};
    const queryRun = (personnel, callback) => {
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        if (queryFilter.brands) {
            queryFilter.brand = queryFilter.brands;
            delete queryFilter.brands;
        }

        // map set String ID to set ObjectID
        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION,
            CONTENT_TYPES.DISPLAY_TYPE,
            CONTENT_TYPES.PERSONNEL,
        ].forEach(filterName => {
            if (queryFilter[filterName] && queryFilter[filterName].length) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        const pipeline = [];

        const $locationMatch = generalFiler([
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
        ], queryFilter);

        if ($locationMatch.$and.length) {
            pipeline.push({ $match: $locationMatch });
        }

        const $generalMatch = generalFiler([
            CONTENT_TYPES.DISPLAY_TYPE,
            'packing',
        ], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.CATEGORY] && queryFilter[CONTENT_TYPES.CATEGORY].length) {
            const setObjectId = [];
            const setString = [];

            queryFilter[CONTENT_TYPES.CATEGORY].forEach(id => {
                if (ObjectId.isValid(id)) {
                    setObjectId.push(ObjectId(id));
                } else {
                    setString.push(id);
                }
            });

            const $or = [];

            if (setObjectId.length) {
                $or.push({ category: { $in: setObjectId } });
            }

            if (setString.length) {
                $or.push({
                    $or: [
                        { 'category_name.en': { $in: setString } },
                        { 'category_name.ar': { $in: setString } },
                    ],
                });
            }

            if ($or.length) {
                $generalMatch.$and.push({ $or });
            }
        }

        if (queryFilter[CONTENT_TYPES.BRAND] && queryFilter[CONTENT_TYPES.BRAND].length) {
            const setObjectId = [];
            const setString = [];

            queryFilter[CONTENT_TYPES.BRAND].forEach(id => {
                if (ObjectId.isValid(id)) {
                    setObjectId.push(ObjectId(id));
                } else {
                    setString.push(id);
                }
            });

            const $or = [];

            if (setObjectId.length) {
                $or.push({ 'brand._id': { $in: setObjectId } });
            }

            if (setString.length) {
                $or.push({ 'brand.name': { $in: setString } });
            }

            if ($or.length) {
                $generalMatch.$and.push({ $or });
            }
        }

        if (queryFilter[CONTENT_TYPES.VARIANT] && queryFilter[CONTENT_TYPES.VARIANT].length) {
            const setObjectId = [];
            const setString = [];

            queryFilter[CONTENT_TYPES.VARIANT].forEach(id => {
                if (ObjectId.isValid(id)) {
                    setObjectId.push(ObjectId(id));
                } else {
                    setString.push(id);
                }
            });

            const $or = [];

            if (setObjectId.length) {
                $or.push({ 'variant._id': { $in: setObjectId } });
            }

            if (setString.length) {
                $or.push({ 'variant.name': { $in: setString } });
            }

            if ($or.length) {
                $generalMatch.$and.push({ $or });
            }
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

        const $timeMatch = {
            $or: timeFilter.map((frame) => {
                return {
                    $and: [
                        { 'createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d } },
                        { 'createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d } },
                    ],
                };
            }),
        };

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

        if (queryFilter.shelfLife) {
            queryFilter.shelfLife = parseInt(queryFilter.shelfLife, 10);

            pipeline.push({
                $match: {
                    shelfLifePeriod: { $gte: queryFilter.shelfLife },
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
                                imageSrc: '$$user.imageSrc',
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
            $addFields: {
                customCategory: {
                    en: '$category_name.en',
                    ar: '$category_name.ar',
                },
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
            $addFields: {
                category: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$category',
                            }, 0],
                        },
                        then: {
                            $let: {
                                vars: {
                                    category: { $arrayElemAt: ['$category', 0] },
                                },
                                in: {
                                    _id: '$$category._id',
                                    name: {
                                        en: {
                                            $toUpper: '$$category.name.en',
                                        },
                                        ar: {
                                            $toUpper: '$$category.name.ar',
                                        },
                                    },
                                },
                            },
                        },
                        else: {
                            _id: '$customCategory.en', // tip: the same as ar
                            custom: true,
                            name: {
                                en: {
                                    $toUpper: '$customCategory.en',
                                },
                                ar: {
                                    $toUpper: '$customCategory.ar',
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                brand: '$brand._id',
                customBrand: {
                    en: '$brand.name',
                    ar: '$brand.name',
                },
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
            $addFields: {
                brand: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$brand',
                            }, 0],
                        },
                        then: {
                            $let: {
                                vars: {
                                    brand: { $arrayElemAt: ['$brand', 0] },
                                },
                                in: {
                                    _id: '$$brand._id',
                                    name: {
                                        $toUpper: '$$brand.name.en',
                                    },
                                },
                            },
                        },
                        else: {
                            _id: '$customBrand.en', // tip: same as ar
                            custom: true,
                            name: {
                                $toUpper: '$customBrand.en',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                variant: '$variant._id',
                customVariant: {
                    en: '$variant.name',
                    ar: '$variant.name',
                },
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
            $addFields: {
                variant: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$variant',
                            }, 0],
                        },
                        then: {
                            $let: {
                                vars: {
                                    variant: { $arrayElemAt: ['$variant', 0] },
                                },
                                in: {
                                    _id: '$$variant._id',
                                    name: {
                                        $toUpper: '$$variant.name.en',
                                    },
                                },
                            },
                        },
                        else: {
                            _id: '$customVariant.en', // tip: same as ar
                            custom: true,
                            name: {
                                $toUpper: '$customVariant.en',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                country: 1,
                additionalComment: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                brand: 1,
                category: 1,
                variant: 1,
                packing: { $concat: ['$packing', ' ', '$packingType'] },
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
                additionalComment: 1,
                location: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                            region: { $arrayElemAt: ['$region', 0] },
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                            outlet: { $arrayElemAt: ['$outlet', 0] },
                            branch: { $arrayElemAt: ['$branch', 0] },
                        },
                        in: {
                            en: {
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
                                    ' -> ',
                                    '$$branch.name.en',
                                ],
                            },
                            ar: {
                                $concat: [
                                    '$$country.name.ar',
                                    ' -> ',
                                    '$$region.name.ar',
                                    ' -> ',
                                    '$$subRegion.name.ar',
                                    ' -> ',
                                    '$$retailSegment.name.ar',
                                    ' -> ',
                                    '$$outlet.name.ar',
                                    ' -> ',
                                    '$$branch.name.ar',
                                ],
                            },
                        },
                    },
                },
                createdBy: 1,
                brand: 1,
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
                variant: 1,
                category: 1,
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
                additionalComment: '$setProducts.additionalComment',
                createdBy: '$setProducts.createdBy',
                brand: '$setProducts.brand',
                country: '$setProducts.country',
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

        response.data.forEach(item => {
            const currentCountry = currency.defaultData.find((country) => {
                return country._id.toString() === item.country._id.toString();
            });

            item.price = Number(item.price);

            if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length > 1) {
                item.price = parseFloat(item.price * currentCountry.currencyInUsd).toFixed(2);
                item.price = `${item.price} $`;
            } else {
                item.price = `${item.price.toFixed(2)} ${currentCountry.currency}`;
            }

            item.additionalComment = {
                en: sanitizeHtml(item.additionalComment.en),
                ar: sanitizeHtml(item.additionalComment.ar),
            };
            item.distributor = {
                en: sanitizeHtml(item.distributor.en),
                ar: sanitizeHtml(item.distributor.ar),
            };
        });

        res.status(200).send(response);
    });
};
