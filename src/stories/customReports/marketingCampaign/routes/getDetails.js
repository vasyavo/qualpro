const ObjectId = require('bson-objectid');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const generalFiler = require('./../../utils/generalFilter');
const locationFiler = require('./../../utils/locationFilter');
const MarketingCampaignModel = require('./../../../../types/marketingCampaign/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
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

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;

        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, 'displayType',
            'status', 'publisher', CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.MARKETING_CAMPAIGN,
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
            if (queryFilter[filterName] && queryFilter[filterName][0] && filterName !== 'status') {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.CATEGORY, 'displayType', 'status'], queryFilter, personnel);

        if (queryFilter.publisher && queryFilter.publisher.length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter.publisher,
                },
            });
        }

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        if (queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN] && queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN].length) {
            pipeline.push({
                $match: {
                    _id: { $in: queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN] },
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
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                status: 1,
                description: 1,
                category: 1,
                displayType: 1,
                dateStart: 1,
                dateEnd: 1,
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
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        });

        pipeline.push({
            $addFields: {
                category: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0] },
                        },
                        in: {
                            _id: '$$category._id',
                            name: {
                                en: '$$category.name.en',
                                ar: '$$category.name.ar',
                            },
                        },
                    },
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

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'createdBy.user.position',
                    foreignField: '_id',
                    as: 'createdBy.user.position',
                },
            },
            {
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
            },
        ]);

        pipeline.push({
            $lookup: {
                from: CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM,
                localField: '_id',
                foreignField: 'brandingAndDisplay',
                as: 'marketingCampaign',
            },
        });

        pipeline.push({
            $unwind: {
                path: '$marketingCampaign',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    'marketingCampaign.createdBy.user': {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'marketingCampaign.branch': {
                            $in: queryFilter[CONTENT_TYPES.BRANCH],
                        },
                    }],
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'marketingCampaign.branch',
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
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'branch.subRegion': {
                            $in: queryFilter[CONTENT_TYPES.SUBREGION],
                        },
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'branch.retailSegment': {
                            $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                        },
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
                                en: { $ifNull: ['$$subRegion.name.en', 'N/A'] },
                                ar: { $ifNull: ['$$subRegion.name.ar', 'N/A'] },
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
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'subRegion.parent': {
                            $in: queryFilter[CONTENT_TYPES.REGION],
                        },
                    }],
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
                                en: { $ifNull: ['$$region.name.en', 'N/A'] },
                                ar: { $ifNull: ['$$region.name.ar', 'N/A'] },
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
                                en: { $ifNull: ['$$country.name.en', 'N/A'] },
                                ar: { $ifNull: ['$$country.name.ar', 'N/A'] },
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
                                    en: { $ifNull: ['$$outlet.name.en', 'N/A'] },
                                    ar: { $ifNull: ['$$outlet.name.ar', 'N/A'] },
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
                                    en: { $ifNull: ['$$retailSegment.name.en', 'N/A'] },
                                    ar: { $ifNull: ['$$retailSegment.name.ar', 'N/A'] },
                                },
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $sort: {
                location: 1,
                'branch.name.en': 1,
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                status: 1,
                displayType: {
                    _id: 1,
                    name: 1,
                },
                category: 1,
                description: 1,
                dateStart: 1,
                dateEnd: 1,
                createdBy: 1,
                marketingCampaign: 1,
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
                branch: '$records.branch',
                country: '$records.country',
                region: '$records.region',
                subRegion: '$records.subRegion',
                retailSegment: '$records.retailSegment',
                outlet: '$records.outlet',
                status: '$records.status',
                displayType: '$records.displayType',
                category: '$records.category',
                description: '$records.description',
                dateStart: '$records.dateStart',
                dateEnd: '$records.dateEnd',
                createdBy: '$records.createdBy',
                marketingCampaign: '$records.marketingCampaign',
                total: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'comments',
                localField: 'marketingCampaign.comments',
                foreignField: '_id',
                as: 'marketingCampaignComment',
            },
        });

        pipeline.push({
            $project: {
                _id: '$marketingCampaign._id',
                employee: '$marketingCampaign.createdBy.user',
                location: 1,
                branch: 1,
                status: 1,
                marketingCampaignComment: 1,
                attachments: {
                    $reduce: {
                        input: '$marketingCampaignComment',
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
                description: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                category: 1,
                displayType: 1,
                commentsUser: {
                    $reduce: {
                        input: '$marketingCampaignComment',
                        initialValue: [],
                        in: {
                            $setUnion: [
                                ['$$this.createdBy.user'],
                                '$$value',
                            ],
                        },
                    },
                },
                dateStart: { $dateToString: { format: '%m/%d/%Y', date: '$dateStart' } },
                dateEnd: { $dateToString: { format: '%m/%d/%Y', date: '$dateEnd' } },
                createdBy: {
                    user: 1,
                    date: { $dateToString: { format: '%m/%d/%Y', date: '$createdBy.date' } },
                },
                total: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'commentsUser',
                foreignField: '_id',
                as: 'commentsUser',
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
            $lookup: {
                from: 'personnels',
                localField: 'employee',
                foreignField: '_id',
                as: 'employee',
            },
        });

        pipeline.push({
            $addFields: {
                employee: {
                    $let: {
                        vars: {
                            user: { $arrayElemAt: ['$employee', 0] },
                        },
                        in: {
                            _id: '$$user._id',
                            position: '$$user.position',
                            name: {
                                en: { $ifNull: [{ $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] }, 'N/A'] },
                                ar: { $ifNull: [{ $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] }, 'N/A'] },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'employee.position',
                    foreignField: '_id',
                    as: 'employee.position',
                },
            },
            {
                $addFields: {
                    'employee.position': {
                        $let: {
                            vars: {
                                position: { $arrayElemAt: ['$employee.position', 0] },
                            },
                            in: {
                                _id: '$$position._id',
                                name: {
                                    en: { $ifNull: ['$$position.name.en', 'N/A'] },
                                    ar: { $ifNull: ['$$position.name.ar', 'N/A'] },
                                },
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $project: {
                _id: 1,
                employee: 1,
                branch: 1,
                status: 1,
                description: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                category: 1,
                displayType: {
                    _id: 1,
                    name: 1,
                },
                dateStart: 1,
                dateEnd: 1,
                total: 1,
                createdBy: 1,
                marketingCampaignComment: {
                    $map: {
                        input: '$marketingCampaignComment',
                        as: 'comment',
                        in: {
                            _id: '$$comment._id',
                            body: '$$comment.body',
                            createdBy: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$commentsUser',
                                                    as: 'user',
                                                    cond: {
                                                        $setIsSubset: [
                                                            [
                                                                '$$user._id',
                                                            ],
                                                            ['$$comment.createdBy.user'],
                                                        ],
                                                    },
                                                },
                                            },
                                            as: 'user',
                                            in: {
                                                _id: '$$user._id',
                                                firstName: '$$user.firstName',
                                                lastName: '$$user.lastName',
                                                imageSrc: '$$user.imageSrc',
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                            attachments: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$attachments',
                                            as: 'attachment',
                                            cond: {
                                                $setIsSubset: [['$$attachment._id'], '$$comment.attachments'],
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
                dateStart: '$records.dateStart',
                dateEnd: '$records.dateEnd',
                status: '$records.status',
                createdBy: '$records.createdBy',
                description: '$records.description',
                displayType: '$records.displayType',
                country: '$records.country',
                category: '$records.category',
                employee: '$records.employee',
                branch: '$records.branch',
                region: '$records.region',
                subRegion: '$records.subRegion',
                retailSegment: '$records.retailSegment',
                outlet: '$records.outlet',
                marketingCampaignComment: '$records.marketingCampaignComment',
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
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: {
                    $push: '$$ROOT',
                },
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                data: {
                    _id: 1,
                    dateStart: 1,
                    dateEnd: 1,
                    status: 1,
                    createdBy: 1,
                    description: 1,
                    displayType: 1,
                    country: 1,
                    category: 1,
                    employee: 1,
                    branch: 1,
                    region: 1,
                    subRegion: 1,
                    retailSegment: 1,
                    outlet: 1,
                    marketingCampaignComment: 1,
                },
            },
        });
        MarketingCampaignModel.aggregate(pipeline)
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
            item.description = {
                en: sanitizeHtml(item.description.en),
                ar: sanitizeHtml(item.description.ar),
            };
            item.marketingCampaignComment.map(comment => {
                return {
                    _id: comment._id,
                    body: sanitizeHtml(comment.body),
                    createdBy: comment.createdBy,
                };
            });
        });

        res.status(200).send(response);
    });
};
