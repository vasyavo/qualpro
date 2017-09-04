const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PromotionModel = require('./../../../../types/promotion/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const moment = require('moment');
const currency = require('../../utils/currency');
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

    const query = req.body;
    const queryFilter = query.filter || {};
    const timeFilter = query.timeFilter;

    const queryRun = (personnel, callback) => {
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
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

        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY,
            'displayType',
            CONTENT_TYPES.POSITION,
            'publisher',
            'employee',
            CONTENT_TYPES.PROMOTIONS,
        ].forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.CATEGORY,
            'displayType',
            'status',
            CONTENT_TYPES.PROMOTIONS,
        ], queryFilter);

        if (queryFilter.publisher && queryFilter.publisher.length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter.publisher,
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.PROMOTIONS}.length`)) {
            $generalMatch.$and.push({
                _id: {
                    $in: queryFilter[CONTENT_TYPES.PROMOTIONS],
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

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    country: { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
                },
            });
        }

        pipeline.push({
            $project: {
                _id: 1,
                promotionType: 1,
                ppt: 1,
                comments: 1,
                dateStart: 1,
                dateEnd: 1,
                parentCountry: '$country',
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
                from: CONTENT_TYPES.PROMOTIONSITEMS,
                localField: '_id',
                foreignField: 'promotion',
                as: 'promotion',
            },
        });

        pipeline.push({
            $unwind: {
                path: '$promotion',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (queryFilter.employee && queryFilter.employee.length) {
            pipeline.push({
                $match: {
                    'promotion.createdBy.user': {
                        $in: queryFilter.employee,
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    $or: [
                        { 'promotion.branch': { $in: queryFilter[CONTENT_TYPES.BRANCH] } },
                        { 'promotion.branch': { $eq: null } },
                    ],
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'promotion.branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeline.push({
            $addFields: {
                branch: {
                    $let: {
                        vars: {
                            branch: { $arrayElemAt: ['$branch', 0] },
                        },
                        in: {
                            _id: '$$branch._id',
                            name: {
                                en: { $ifNull: ['$$branch.name.en', 'N/A'] },
                                ar: { $ifNull: ['$$branch.name.ar', 'N/A'] },
                            },
                            outlet: '$$branch.outlet',
                            retailSegment: '$$branch.retailSegment',
                            subRegion: '$$branch.subRegion',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    'branch.subRegion': { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.retailSegment': {
                            $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                        },
                    }, {
                        promotion: null,
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.outlet': {
                            $in: queryFilter[CONTENT_TYPES.OUTLET],
                        },
                    }, {
                        promotion: null,
                    }],
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'branch.subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeline.push({
            $addFields: {
                branch: {
                    _id: '$branch._id',
                    name: '$branch.name',
                },
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                        },
                        in: {
                            _id: '$$subRegion._id',
                            name: {
                                en: '$$subRegion.name.en',
                                ar: '$$subRegion.name.ar',
                            },
                            parent: '$$subRegion.parent',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    'subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.parent',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeline.push({
            $addFields: {
                subRegion: {
                    _id: '$subRegion._id',
                    name: '$subRegion.name',
                },
                region: {
                    $let: {
                        vars: {
                            region: { $arrayElemAt: ['$region', 0] },
                        },
                        in: {
                            _id: '$$region._id',
                            name: {
                                en: '$$region.name.en',
                                ar: '$$region.name.ar',
                            },
                            parent: '$$region.parent',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.parent',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeline.push({
            $addFields: {
                region: {
                    _id: '$region._id',
                    name: '$region.name',
                },
                country: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                        },
                        in: {
                            _id: '$$country._id',
                            name: {
                                en: '$$country.name.en',
                                ar: '$$country.name.ar',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push(...[
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'branch.outlet',
                    foreignField: '_id',
                    as: 'outlet',
                },
            },
            {
                $addFields: {
                    branch: {
                        _id: '$branch._id',
                        name: '$branch.name',
                        retailSegment: '$branch.retailSegment',
                        subRegion: '$branch.subRegion',
                    },
                    outlet: {
                        $let: {
                            vars: {
                                outlet: { $arrayElemAt: ['$outlet', 0] },
                            },
                            in: {
                                _id: '$$outlet._id',
                                name: {
                                    en: '$$outlet.name.en',
                                    ar: '$$outlet.name.ar',
                                },
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'retailSegments',
                    localField: 'branch.retailSegment',
                    foreignField: '_id',
                    as: 'retailSegment',
                },
            },
            {
                $addFields: {
                    branch: {
                        _id: '$branch._id',
                        name: '$branch.name',
                        subRegion: '$branch.subRegion',
                    },
                    retailSegment: {
                        $let: {
                            vars: {
                                retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                            },
                            in: {
                                _id: '$$retailSegment._id',
                                name: {
                                    en: '$$retailSegment.name.en',
                                    ar: '$$retailSegment.name.ar',
                                },
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $addFields: {
                location: {
                    $concat: [
                        '$country.name.en',
                        ' -> ',
                        '$region.name.en',
                        ' -> ',
                        '$subRegion.name.en',
                        ' -> ',
                        '$retailSegment.name.en',
                        ' -> ',
                        '$outlet.name.en',
                    ],
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
            $project: {
                _id: 1,
                location: { $ifNull: ['$location', 'N/A'] },
                country: { $ifNull: ['$country._id', '$parentCountry'] },
                branch: 1,
                promotionType: 1,
                ppt: 1,
                dateStart: 1,
                dateEnd: 1,
                createdBy: 1,
                promotion: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'promotion.createdBy.user',
                foreignField: '_id',
                as: 'assignee',
            },
        });


        pipeline.push({
            $addFields: {
                assignee: {
                    $let: {
                        vars: {
                            user: { $arrayElemAt: ['$assignee', 0] },
                        },
                        in: {
                            _id: '$$user._id',
                            name: {
                                en: { $ifNull: [{ $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] }, 'N/A'] },
                                ar: { $ifNull: [{ $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] }, 'N/A'] },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                records: { $push: '$$ROOT' },
                total: { $sum: 1 },
            },
        });

        pipeline.push({
            $unwind: {
                path: '$records',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline.push({
            $project: {
                _id: '$records._id',
                location: '$records.location',
                branch: '$records.branch',
                country: '$records.country',
                promotionType: '$records.promotionType',
                ppt: '$records.ppt',
                dateStart: '$records.dateStart',
                dateEnd: '$records.dateEnd',
                createdBy: '$records.createdBy',
                promotion: '$records.promotion',
                total: 1,
                assignee: '$records.assignee',
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
                from: 'comments',
                localField: 'promotion.comment',
                foreignField: '_id',
                as: 'promotionComment',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'displayTypes',
                localField: 'promotion.displayType',
                foreignField: '_id',
                as: 'displayType',
            },
        });

        pipeline.push({
            $project: {
                _id: '$promotion._id',
                location: 1,
                branch: 1,
                promotionType: 1,
                promotionComment: { $ifNull: [{ $arrayElemAt: ['$promotionComment', 0] }, 'N/A'] },
                ppt: 1,
                country: 1,
                dateStart: { $dateToString: { format: '%m/%d/%Y', date: '$dateStart' } },
                dateEnd: { $dateToString: { format: '%m/%d/%Y', date: '$dateEnd' } },
                createdBy: {
                    user: 1,
                    date: { $dateToString: { format: '%m/%d/%Y', date: '$createdBy.date' } },
                },
                displayType: { $cond: [{ $eq: [{ $size: '$displayType' }, 0] }, [{ name: { en: 'N/A', ar: 'N/A' } }], '$displayType'] },
                itemDateStart: { $ifNull: [{ $dateToString: { format: '%m/%d/%Y', date: '$promotion.dateStart' } }, 'N/A'] },
                itemDateEnd: { $ifNull: [{ $dateToString: { format: '%m/%d/%Y', date: '$promotion.dateEnd' } }, 'N/A'] },
                opening: { $ifNull: ['$promotion.opening', 0] },
                sellIn: { $ifNull: ['$promotion.sellIn', 0] },
                closingStock: { $ifNull: ['$promotion.closingStock', 0] },
                sellOut: { $ifNull: ['$promotion.sellOut', 0] },
                assignee: 1,
                total: 1,
            },
        });


        pipeline.push({
            $lookup: {
                from: 'files',
                localField: 'promotionComment.attachments',
                foreignField: '_id',
                as: 'promotionAttachments',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'promotionComment.createdBy.user',
                foreignField: '_id',
                as: 'promotionComment.createdBy.user',
            },
        });


        pipeline.push({
            $addFields: {
                'promotionComment.createdBy.user': {
                    $let: {
                        vars: {
                            user: { $arrayElemAt: ['$promotionComment.createdBy.user', 0] },
                        },
                        in: {
                            _id: '$$user._id',
                            name: {
                                en: { $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] },
                                ar: { $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] },
                            },
                            imageSrc: '$$user.imageSrc',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                promotionAttachments: {
                    $map: {
                        input: '$promotionAttachments',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            originalName: '$$item.originalName',
                            contentType: '$$item.contentType',
                            preview: '$$item.preview',
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

        PromotionModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_PROMO_EVALUATION, cb);
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
            if (!item.promotionComment._id) {
                item.promotionComment = null;
            }
            const currentCountry = currency.defaultData.find((country) => {
                return country._id.toString() === item.country.toString();
            });
            if (queryFilter[CONTENT_TYPES.COUNTRY].length > 1) {
                item.ppt = parseFloat(item.ppt * currentCountry.currencyInUsd).toFixed(2);
                item.ppt = `${item.ppt} $`;
            } else {
                item.ppt = `${item.ppt.toFixed(2)} ${currentCountry.currency}`;
            }


            item.promotionType = {
                en: sanitizeHtml(item.promotionType.en),
                ar: sanitizeHtml(item.promotionType.ar),
            };
        });

        res.status(200).send(response);
    });
};
