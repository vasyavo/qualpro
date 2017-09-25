const mongoose = require('mongoose');
const moment = require('moment');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ShelfShareModel = require('./../../../../types/shelfShare/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFilter = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');

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
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.BRAND, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFilter(pipeline, personnel, queryFilter, true);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.CATEGORY], queryFilter, personnel);

        if (queryFilter.brand && queryFilter.brand.length) {
            $generalMatch.$and.push({
                'brands.brand': {
                    $in: queryFilter.brand,
                },
            });
        }

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
            $project: {
                _id: 1,
                category: 1,
                brands: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ['$createdBy.user', 0] },
                            },
                            in: {
                                _id: '$$user._id',
                                position: '$$user.position',
                                name: {
                                    en: { $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] },
                                    ar: { $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] },
                                },
                            },
                        },
                    },
                    date: 1,
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
            $unwind: '$brands',
        });

        if (queryFilter.brand && queryFilter.brand.length) {
            pipeline.push({
                $match: {
                    'brands.brand': {
                        $in: queryFilter.brand,
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
                brands: { $addToSet: '$brands.brand' },
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
            $project: {
                countries: {
                    _id: 1,
                    name: 1,
                },
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: 1,
                categories: 1,
                brands: 1,
                positions: 1,
                personnels: 1,
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
            $project: {
                countries: 1,
                regions: {
                    _id: 1,
                    name: 1,
                },
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: 1,
                categories: 1,
                brands: 1,
                positions: 1,
                personnels: 1,
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
            $project: {
                countries: 1,
                regions: 1,
                subRegions: {
                    _id: 1,
                    name: 1,
                },
                retailSegments: 1,
                outlets: 1,
                branches: 1,
                categories: 1,
                brands: 1,
                positions: 1,
                personnels: 1,
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
            $project: {
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: {
                    _id: 1,
                    name: 1,
                },
                outlets: 1,
                branches: 1,
                categories: 1,
                brands: 1,
                positions: 1,
                personnels: 1,
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
            $project: {
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: {
                    _id: 1,
                    name: 1,
                },
                branches: 1,
                categories: 1,
                brands: 1,
                positions: 1,
                personnels: 1,
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
            $project: {
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: {
                    _id: 1,
                    name: 1,
                },
                categories: 1,
                brands: 1,
                positions: 1,
                personnels: 1,
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
            $project: {
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: 1,
                categories: {
                    _id: 1,
                    name: 1,
                },
                brands: 1,
                positions: 1,
                personnels: 1,
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
            $project: {
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: 1,
                categories: 1,
                brands: {
                    _id: 1,
                    name: 1,
                },
                positions: 1,
                personnels: 1,
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
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: 1,
                categories: 1,
                brands: 1,
                positions: {
                    _id: 1,
                    name: 1,
                },
                personnels: 1,
            },
        });

        ShelfShareModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.SHELF_SHARES, cb);
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
