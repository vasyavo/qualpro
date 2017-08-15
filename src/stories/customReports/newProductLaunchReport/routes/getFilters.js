const ObjectId = require('bson-objectid');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const generalFiler = require('./../../utils/generalFilter');
const NewProductLaunch = require('./../../../../types/newProductLaunch/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const locationFilter = require('./../../utils/locationFilter');
const sanitizeHtml = require('../../utils/sanitizeHtml');

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
    let currentLanguage;

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};

        currentLanguage = personnel.currentLanguage || 'en';

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        // map set String ID to set ObjectID
        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.DISPLAY_TYPE,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION,
            CONTENT_TYPES.PERSONNEL,
        ].forEach(filterName => {
            if (queryFilter[filterName] && queryFilter[filterName].length) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });




        const pipeline = [{
            $project: {
                createdBy: 1,
                shelfLifeStart: 1,
                shelfLifeEnd: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                category: 1,
                category_name: 1,
                brand: 1,
                variant: 1,
                packing: 1,
                packingType: 1,
                displayType: 1,
                distributor: 1,
            },
        }];

        locationFilter(pipeline, personnel, queryFilter, true);

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
                category: '$category',
                customCategory: {
                    en: '$category_name.en',
                    ar: '$category_name.ar',
                },
                variant: '$variant._id',
                competitorVariant: '$variant._id',
                customVariant: {
                    en: '$variant.name',
                    ar: '$variant.name',
                },
                brand: '$brand._id',
                customBrand: {
                    en: '$brand.name',
                    ar: '$brand.name',
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
            $lookup: {
                from: 'variants',
                localField: 'variant',
                foreignField: '_id',
                as: 'variant',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'competitorVariants',
                localField: 'competitorVariant',
                foreignField: '_id',
                as: 'competitorVariant',
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
                                        en: {
                                            $toUpper: '$$variant.name.en',
                                        },
                                        ar: {
                                            $toUpper: '$$variant.name.ar',
                                        },
                                    },
                                },
                            },
                        },
                        else: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$competitorVariant',
                                    }, 0],
                                },
                                then: {
                                    $let: {
                                        vars: {
                                            competitorVariant: { $arrayElemAt: ['$competitorVariant', 0] },
                                        },
                                        in: {
                                            _id: '$$competitorVariant._id',
                                            name: {
                                                en: {
                                                    $toUpper: '$$competitorVariant.name.en',
                                                },
                                                ar: {
                                                    $toUpper: '$$competitorVariant.name.ar',
                                                },
                                            },
                                        },
                                    },
                                },
                                else: {
                                    _id: '$customVariant.en', // tip: the same as ar
                                    name: {
                                        en: {
                                            $toUpper: '$customVariant.en',
                                        },
                                        ar: {
                                            $toUpper: '$customVariant.ar',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
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
                                        en: {
                                            $toUpper: '$$brand.name.en',
                                        },
                                        ar: {
                                            $toUpper: '$$brand.name.ar',
                                        },
                                    },
                                },
                            },
                        },
                        else: {
                            _id: '$customBrand.en', // tip: same as ar
                            name: {
                                en: {
                                    $toUpper: '$customBrand.en',
                                },
                                ar: {
                                    $toUpper: '$customBrand.ar',
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $project: {
                createdBy: 1,
                shelfLifeStart: 1,
                shelfLifeEnd: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                category: 1,
                brand: 1,
                variant: 1,
                packing: 1,
                packingType: 1,
                displayType: 1,
                distributor: 1,
                shelfLifePeriod: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                countries: { $addToSet: '$country' },
                regions: { $addToSet: '$region' },
                subRegions: { $addToSet: '$subRegion' },
                retailSegments: { $addToSet: '$retailSegment' },
                outlets: { $addToSet: '$outlet' },
                branches: { $addToSet: '$branch' },
                positions: { $addToSet: '$createdBy.user.position' },
                personnels: { $addToSet: '$createdBy.user' },
                categories: { $addToSet: '$category' },
                brands: { $addToSet: '$brand' },
                variants: { $addToSet: '$variant' },
                packings: { $addToSet: '$packing' },
                distributors: { $addToSet: '$distributor' },
                displayTypes: { $push: '$displayType' },
                shelfLifePeriods: { $addToSet: '$shelfLifePeriod' },
            },
        });

        pipeline.push({
            $project: {
                countries: {
                    $filter: {
                        input: '$countries',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                regions: {
                    $filter: {
                        input: '$regions',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                subRegions: {
                    $filter: {
                        input: '$subRegions',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                retailSegments: {
                    $filter: {
                        input: '$retailSegments',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                outlets: {
                    $filter: {
                        input: '$outlets',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                branches: {
                    $filter: {
                        input: '$branches',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                positions: {
                    $filter: {
                        input: '$positions',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                personnels: 1,
                categories: {
                    $filter: {
                        input: '$categories',
                        as: 'category',
                        cond: { $ne: ['$$category._id', null] },
                    },
                },
                brands: {
                    $filter: {
                        input: '$brands',
                        as: 'brand',
                        cond: { $ne: ['$$brand._id', null] },
                    },
                },
                variants: {
                    $filter: {
                        input: '$variants',
                        as: 'variant',
                        cond: { $ne: ['$$variant._id', null] },
                    },
                },
                packings: 1,
                distributors: {
                    $map: {
                        input: '$distributors',
                        as: 'item',
                        in: {
                            // id doesn't required for distributors as they're absolutely custom
                            name: {
                                en: '$$item.en',
                                ar: '$$item.ar',
                            },
                        },
                    },
                },
                shelfLifePeriods: 1,
                displayTypes: {
                    $reduce: {
                        input: '$displayTypes',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
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
                from: 'positions',
                localField: 'positions',
                foreignField: '_id',
                as: 'positions',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'displayTypes',
                localField: 'displayTypes',
                foreignField: '_id',
                as: 'displayTypes',
            },
        });

        pipeline.push({
            $project: {
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
                positions: {
                    _id: 1,
                    name: 1,
                },
                personnels: 1,
                brands: {
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
                packings: 1,
                distributors: {
                    _id: 1,
                    name: 1,
                },
                shelfLifePeriods: 1,
                displayTypes: {
                    _id: 1,
                    name: 1,
                },
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

        const response = result && result[0] ? result[0] : {
            countries: [],
            regions: [],
            subRegions: [],
            retailSegments: [],
            outlets: [],
            branches: [],
            positions: [],
            personnels: [],
            brands: [],
            categories: [],
            variants: [],
            packings: [],
            distributors: [],
            shelfLifePeriods: [],
            displayTypes: [],
        };

        // sanitize and filter custom values
        [
            'categories',
            'variants',
            'brands',
            'distributors',
        ].forEach(field => {
            response[field] = response[field]
                .map(item => {
                    const newItem = {
                        _id: item.name.en,
                        name: {
                            en: sanitizeHtml(item.name.en.trim()),
                            ar: sanitizeHtml(item.name.ar.trim()),
                        },
                    };

                    if (item._id) newItem._id = item._id;

                    return newItem;
                })
                .filter(item => item.name[currentLanguage]);
        });

        response.analyzeBy = [
            {
                name: {
                    en: 'Country',
                    ar: '',
                },
                value: 'country',
            },
            {
                name: {
                    en: 'Region',
                    ar: '',
                },
                value: 'region',
            },
            {
                name: {
                    en: 'Sub Region',
                    ar: '',
                },
                value: 'subRegion',
            },
            {
                name: {
                    en: 'Branch',
                    ar: '',
                },
                value: 'branch',
            },
            {
                name: {
                    en: 'Brand',
                    ar: '',
                },
                value: 'brand',
            },
            {
                name: {
                    en: 'Product',
                    ar: '',
                },
                value: 'product',
            },
            {
                name: {
                    en: 'Publisher Position',
                    ar: '',
                },
                value: 'publisherPosition',
            },
            {
                name: {
                    en: 'Publisher',
                    ar: '',
                },
                value: 'publisher',
            },
        ];

        res.status(200).send(response);
    });
};
