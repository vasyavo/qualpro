const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const CompetitorPromotionModel = require('./../../../../types/competitorPromotion/model');
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
            CONTENT_TYPES.BRAND, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
            CONTENT_TYPES.ORIGIN, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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

        const $generalMatch = generalFiler([
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRAND,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE, CONTENT_TYPES.ORIGIN,
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
                packing: { $concat: ['$packing', ' ', '$packingType'] },
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
                setPromotion: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$setPromotion',
        });

        pipeline.push({
            $project: {
                _id: '$setPromotion._id',
                category: '$setPromotion.category',
                description: '$setPromotion.description',
                packing: '$setPromotion.packing',
                expiry: '$setPromotion.expiry',
                dateStart: '$setPromotion.dateStart',
                dateEnd: '$setPromotion.dateEnd',
                origin: '$setPromotion.origin',
                price: '$setPromotion.price',
                displayType: '$setPromotion.displayType',
                comments: '$setPromotion.comments',
                country: '$setPromotion.country',
                region: '$setPromotion.region',
                subRegion: '$setPromotion.subRegion',
                branch: '$setPromotion.branch',
                retailSegment: '$setPromotion.retailSegment',
                outlet: '$setPromotion.outlet',
                createdBy: '$setPromotion.createdBy',
                total: 1,
            },
        });

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
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
                from: 'origins',
                localField: 'origin',
                foreignField: '_id',
                as: 'origin',
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
        });

        pipeline.push({
            $lookup: {
                from: 'comments',
                localField: 'comments',
                foreignField: '_id',
                as: 'comments',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                description: 1,
                packing: 1,
                expiry: 1,
                dateStart: 1,
                dateEnd: 1,
                price: 1,
                comments: 1,
                total: 1,
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
                displayType: {
                    $reduce: {
                        input: '$displayType',
                        initialValue: { en: '', ar: '' },
                        in: {
                            en: {
                                $concat: ['$$this.name.en', ' ', '$$value.en'],
                            },
                            ar: {
                                $concat: ['$$this.name.en', ' ', '$$value.en'],
                            },
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
                            branch: { $arrayElemAt: ['$branch', 0] },
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
                                ' -> ',
                                '$$branch.name.en',
                            ],
                        },
                    },
                },
                createdBy: {
                    user: {
                        _id: 1,
                        name: 1,
                        position: {
                            $let: {
                                vars: {
                                    position: { $arrayElemAt: ['$createdBy.user.position', 0] },
                                },
                                in: {
                                    _id: '$$position._id',
                                    name: '$$position.name',
                                },
                            },
                        },
                    },
                    date: 1,
                },
                attachments: {
                    $reduce: {
                        input: '$comments',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$this.attachments', []],
                                },
                                then: {
                                    $setUnion: ['$$this.attachments', '$$value'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
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
                description: 1,
                packing: 1,
                expiry: 1,
                dateStart: 1,
                dateEnd: 1,
                price: 1,
                category: 1,
                origin: 1,
                displayType: 1,
                createdBy: 1,
                total: 1,
                publisher: {
                    $concat: [
                        '$createdBy.user.name.en',
                        ' -> ',
                        '$createdBy.user.position.name.en',
                    ],
                },
                comments: {
                    $map: {
                        input: '$comments',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            body: '$$item.body',
                            attachments: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$attachments',
                                            as: 'attachment',
                                            cond: {
                                                $ne: [
                                                    {
                                                        $setIntersection: [['$attachment._id'], '$item.attachments'],
                                                    },
                                                    [],
                                                ],
                                            },
                                        },
                                    },
                                    as: 'attachment',
                                    in: {
                                        _id: '$$attachment._id',
                                        originalName: '$$attachment.originalName',
                                        contentType: '$$attachment.contentType',
                                        preview: '$$attachment.preview',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $sort: {
                publisher: 1,
            },
        });

        pipeline.push({
            $addFields: {
                publisher: null,
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

        CompetitorPromotionModel.aggregate(pipeline)
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

        res.status(200).send(response);
    });
};
