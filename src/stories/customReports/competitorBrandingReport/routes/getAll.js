const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const moment = require('moment');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const CompetitorBrandingModel = require('./../../../../types/competitorBranding/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const sanitizeHtml = require('../../utils/sanitizeHtml');

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
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
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

        if (queryFilter.brands) {
            queryFilter.brand = queryFilter.brands;
            delete queryFilter.brands;
        }

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRAND,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
        ], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            });
        }
        /*
                pipeline.push({
                    $match: { category: { $ne: [] } },
                });*/

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

        pipeline.push({
            $group: {
                _id: null,
                total: { $sum: 1 },
                setBranding: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$setBranding',
        });

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
        });

        pipeline.push({
            $project: {
                _id: '$setBranding._id',
                country: '$setBranding.country',
                region: '$setBranding.region',
                subRegion: '$setBranding.subRegion',
                retailSegment: '$setBranding.retailSegment',
                outlet: '$setBranding.outlet',
                branch: '$setBranding.branch',
                category: '$setBranding.category',
                brand: '$setBranding.brand',
                displayType: '$setBranding.displayType',
                dateStart: '$setBranding.dateStart',
                dateEnd: '$setBranding.dateEnd',
                description: '$setBranding.description',
                createdBy: '$setBranding.createdBy',
                attachments: '$setBranding.attachments',
                total: 1,
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
                from: 'positions',
                localField: 'createdBy.user.position',
                foreignField: '_id',
                as: 'createdBy.user.position',
            },
        }, {
            $addFields: {
                'createdBy.user.position': {
                    $let: {
                        vars: {
                            position: { $arrayElemAt: ['$createdBy.user.position', 0] },
                        },
                        in: {
                            _id: '$$position._id',
                            name: {
                                en: '$$position.name.en',
                                ar: '$$position.name.ar',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                branch: 1,
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
                                ],
                            },
                        },
                    },
                },
                category: 1,
                brand: 1,
                displayType: 1,
                dateStart: 1,
                dateEnd: 1,
                description: 1,
                createdBy: 1,
                attachments: 1,
                total: 1,
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
                'branch.name': 1,
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
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
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
                from: 'files',
                localField: 'attachments',
                foreignField: '_id',
                as: 'attachments',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                total: 1,
                location: 1,
                attachments: 1,
                dateStart: { $dateToString: { format: '%m/%d/%Y', date: '$dateStart' } },
                dateEnd: { $dateToString: { format: '%m/%d/%Y', date: '$dateEnd' } },
                description: 1,
                createdBy: 1,
                category: {
                    $reduce: {
                        input: '$category',
                        initialValue: {
                            $let: {
                                vars: {
                                    category: {
                                        $arrayElemAt: ['$category', 0],
                                    },
                                },
                                in: {
                                    en: '$$category.name.en',
                                    ar: '$$category.name.ar',
                                },
                            },
                        },
                        in: {
                            en: {
                                $cond: {
                                    if: {
                                        $eq: ['$$this.name.en', '$$value.en'],
                                    },
                                    then: '$$value.en',
                                    else: {
                                        $concat: ['$$value.en', ', ', '$$this.name.en'],
                                    },
                                },
                            },
                            ar: {
                                $cond: {
                                    if: {
                                        $eq: ['$$this.name.ar', '$$value.ar'],
                                    },
                                    then: '$$value.ar',
                                    else: {
                                        $concat: ['$$value.ar', ', ', '$$this.name.ar'],
                                    },
                                },
                            },
                        },
                    },
                },
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
                displayType: {
                    $reduce: {
                        input: '$displayType',
                        initialValue: {
                            $let: {
                                vars: {
                                    displayType: {
                                        $arrayElemAt: ['$displayType', 0],
                                    },
                                },
                                in: {
                                    en: '$$displayType.name.en',
                                    ar: '$$displayType.name.ar',
                                },
                            },
                        },
                        in: {
                            en: {
                                $cond: {
                                    if: {
                                        $eq: ['$$this.name.en', '$$value.en'],
                                    },
                                    then: '$$value.en',
                                    else: {
                                        $concat: ['$$value.en', ', ', '$$this.name.en'],
                                    },
                                },
                            },
                            ar: {
                                $cond: {
                                    if: {
                                        $eq: ['$$this.name.ar', '$$value.ar'],
                                    },
                                    then: '$$value.ar',
                                    else: {
                                        $concat: ['$$value.ar', ', ', '$$this.name.ar'],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: {
                    $push: '$$ROOT',
                },
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

        const response = result.length ?
            result[0] : { data: [], total: 0 };

        response.data.forEach(item => {
            item.description = {
                en: sanitizeHtml(item.description.en),
                ar: sanitizeHtml(item.description.ar),
            };
        });

        response.data.forEach(item => {
            item.category = item.category ? item.category : 'N/A';
            item.dateStart = item.dateStart ? item.dateStart : 'N/A';
            item.dateEnd = item.dateEnd ? item.dateEnd : 'N/A';
        });

        res.status(200).send(response);
    });
};
