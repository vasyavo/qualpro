const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFilter = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const CompetitorBrandingModel = require('./../../../../types/competitorBranding/model');
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
        const query = req.body;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.BRAND, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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

        locationFilter(pipeline, personnel, queryFilter, true);

        const $generalMatch = generalFiler([
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRAND, CONTENT_TYPES.DISPLAY_TYPE,
        ], queryFilter, personnel);

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

        if (queryFilter[CONTENT_TYPES.CATEGORY] && queryFilter[CONTENT_TYPES.CATEGORY].length) {
            pipeline.push({
                $match: {
                    category: {
                        $in: queryFilter[CONTENT_TYPES.CATEGORY],
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
                brands: { $addToSet: '$brand' },
                categories: { $push: '$category' },
                displayTypes: { $push: '$displayType' },
                positions: { $addToSet: '$createdBy.user.position' },
                personnels: { $addToSet: '$createdBy.user' },
            },
        });

        pipeline.push({
            $project: {
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: 1,
                brands: 1,
                categories: {
                    $reduce: {
                        input: '$categories',
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
                displayTypes: {
                    $reduce: {
                        input: '$displayTypes',
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
                positions: 1,
                personnels: 1,
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
                from: 'brands',
                localField: 'brands',
                foreignField: '_id',
                as: 'brands',
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
            $lookup: {
                from: 'positions',
                localField: 'positions',
                foreignField: '_id',
                as: 'positions',
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
                brands: {
                    _id: 1,
                    name: 1,
                },
                categories: {
                    _id: 1,
                    name: 1,
                },
                displayTypes: {
                    _id: 1,
                    name: 1,
                },
                positions: {
                    _id: 1,
                    name: 1,
                },
                personnels: 1,
            },
        });

        CompetitorBrandingModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, cb);
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
            brands: [],
            categories: [],
            displayTypes: [],
            positions: [],
            personnels: [],
        };

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
                    en: 'Publisher',
                    ar: '',
                },
                value: 'publisher',
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
                    en: 'Category',
                    ar: '',
                },
                value: 'category',
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
                    en: 'Display Type',
                    ar: '',
                },
                value: 'displayType',
            },
        ];

        res.status(200).send(response);
    });
};
