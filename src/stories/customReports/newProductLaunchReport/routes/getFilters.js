const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const NewProductLaunch = require('./../../../../types/newProductLaunch/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');

const ajv = new Ajv();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const timeFilterSchema = {
        type: 'object',
        properties: {
            from: {
                type: 'string',
            },
            to: {
                type: 'string',
            },
        },
        required: [
            'from',
            'to',
        ],
    };

    const queryRun = (personnel, callback) => { // TODO add shelfLife filter
        const query = req.query;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.BRAND,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT, CONTENT_TYPES.DISPLAY_TYPE,
        ];
        const pipeline = [];

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate(timeFilter);

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
                'brand._id': {
                    $in: queryFilter[CONTENT_TYPES.BRAND],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.VARIANT] && queryFilter[CONTENT_TYPES.VARIANT].length) {
            $generalMatch.$and.push({
                'variant._id': {
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

        if (timeFilter) {
            $generalMatch.$and = [
                {
                    'createdBy.date': { $gt: moment(timeFilter.from, 'MM/DD/YYYY')._d },
                },
                {
                    'createdBy.date': { $lt: moment(timeFilter.to, 'MM/DD/YYYY')._d },
                },
            ];
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
                brands: { $addToSet: '$brand' },
                categories: { $addToSet: '$category' },
                variants: { $addToSet: '$variant' },
                packings: { $addToSet: '$packing' },
                distributors: { $addToSet: '$distributor' },
                displayTypes: { $push: '$displayType' },
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
                brands: 1,
                categories: {
                    $filter: {
                        input: '$categories',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                variants: 1,
                packings: 1,
                distributors: 1,
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
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
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
                brands: 1,
                categories: {
                    _id: 1,
                    name: 1,
                },
                variants: 1,
                packings: 1,
                distributors: 1,
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

        res.status(200).send(result[0]);
    });
};
