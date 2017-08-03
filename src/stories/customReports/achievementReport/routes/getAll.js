const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const AchievementFormModel = require('./../../../../types/achievementForm/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
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

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET], queryFilter, personnel);

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

        pipeline.push(...[
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                branch: { $arrayElemAt: ['$branch', 0] },
                            },
                            in: {
                                _id: '$$branch._id',
                                name: {
                                    en: '$$branch.name.en',
                                    ar: '$$branch.name.ar',
                                },
                                outlet: '$$branch.outlet',
                                retailSegment: '$$branch.retailSegment',
                                subRegion: '$$branch.subRegion',
                            },
                        },
                    },
                },
            },
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
            {
                $lookup: {
                    from: 'domains',
                    localField: 'branch.subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
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
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion.parent',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
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
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region.parent',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
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
            },
            {
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
            },
            {
                $sort: {
                    location: 1,
                    'branch.name.en': 1,
                },
            },
            {
                $sort: {
                    'createdBy.user.name.en': 1,
                    'createdBy.user.position.name.en': 1,
                },
            },
            {
                $project: {
                    _id: 1,
                    location: 1,
                    branch: 1,
                    description: 1,
                    additionalComment: 1,
                    attachments: 1,
                    createdBy: 1,
                    total: 1,
                },
            },
        ]);

        pipeline.push({
            $group: {
                _id: null,
                total: { $sum: 1 },
                records: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$records',
        });

        pipeline.push({
            $project: {
                _id: '$records._id',
                location: '$records.location',
                branch: '$records.branch',
                description: '$records.description',
                additionalComment: '$records.additionalComment',
                attachments: '$records.attachments',
                createdBy: '$records.createdBy',
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
                from: 'files',
                localField: 'attachments',
                foreignField: '_id',
                as: 'attachments',
            },
        });

        pipeline.push({
            $addFields: {
                attachments: {
                    $map: {
                        input: '$attachments',
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

        AchievementFormModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.ACHIEVEMENT_FORM, cb);
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
            item.additionalComment = {
                en: sanitizeHtml(item.additionalComment.en),
                ar: sanitizeHtml(item.additionalComment.ar),
            };
        });

        res.status(200).send(response);
    });
};
