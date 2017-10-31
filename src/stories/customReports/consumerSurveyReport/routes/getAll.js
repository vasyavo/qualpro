const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ConsumersSurveyModel = require('./../../../../types/consumersSurvey/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const CONSTANTS = require('./../../../../constants/mainConstants');
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
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION, 'title',
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

        if (queryFilter.title && queryFilter.title.length) {
            pipeline.push({
                $match: {
                    _id: { $in: queryFilter.title },
                },
            });
        }

        pipeline.push({
            $match: {
                status: { $ne: 'draft' },
            },
        });

        if (queryFilter.status && queryFilter.status.length) {
            pipeline.push({
                $match: {
                    status: { $in: queryFilter.status },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            country: { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
                        },
                        {
                            country: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            region: { $in: queryFilter[CONTENT_TYPES.REGION] },
                        },
                        {
                            region: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            subRegion: { $in: queryFilter[CONTENT_TYPES.subRegion] },
                        },
                        {
                            subRegion: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            retailSegment: { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
                        },
                        {
                            retailSegment: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            outlet: { $in: queryFilter[CONTENT_TYPES.OUTLET] },
                        },
                        {
                            outlet: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            branch: { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                        },
                        {
                            branch: { $in: [] },
                        },
                    ],
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
            $unwind: '$questions',
        });

        pipeline.push({
            $lookup: {
                from: 'consumersSurveyAnswers',
                localField: 'questions._id',
                foreignField: 'questionId',
                as: 'answers',
            },
        });

        pipeline.push({
            $unwind: {
                path: '$answers',
                preserveNullAndEmptyArrays: true,
            },
        });


        if (queryFilter.gender && queryFilter.gender.length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            'answers.customer.gender': {
                                $in: queryFilter.gender,
                            },
                        },
                        {
                            answers: {
                                $eq: null,
                            },
                        },
                    ],
                },
            });
        }

        if (queryFilter.nationality && queryFilter.nationality.length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            'answers.customer.nationality.name.en': {
                                $in: queryFilter.nationality,
                            },
                        },
                        {
                            'answers.customer.nationality.name.ar': {
                                $in: queryFilter.nationality,
                            },
                        },
                        {
                            answers: {
                                $eq: null,
                            },
                        },
                    ],
                },
            });
        }

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
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
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

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    'createdBy.user': {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
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
                                user: {
                                    $arrayElemAt: [
                                        '$createdBy.user',
                                        0,
                                    ],
                                },
                            },
                            in: {
                                _id: '$$user._id',
                                name: {
                                    en: {
                                        $concat: [
                                            '$$user.firstName.en',
                                            ' ',
                                            '$$user.lastName.en',
                                        ],
                                    },
                                    ar: {
                                        $concat: [
                                            '$$user.firstName.ar',
                                            ' ',
                                            '$$user.lastName.ar',
                                        ],
                                    },
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    date: '$consumer.createdBy.date',
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
            $lookup: {
                from: 'positions',
                localField: 'createdBy.user.position',
                foreignField: '_id',
                as: 'createdBy.user.position',
            },
        });

        pipeline.push({
            $addFields: {
                publisherPosition: {
                    $let: {
                        vars: {
                            position: {
                                $arrayElemAt: [
                                    '$createdBy.user.position',
                                    0,
                                ],
                            },
                        },
                        in: {
                            _id: '$$position._id',
                            name: '$$position.name',
                        },
                    },
                },
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
            $project: {
                _id: 1,
                status: 1,
                createdBy: 1,
                questions: 1,
                countAnswered: 1,
                branch: '$branch.name',
                outlet: '$outlet.name',
                retailSegment: '$retailSegment.name',
                subRegion: '$subRegion.name',
                region: '$region.name',
                country: '$country.name',
                startDate: '$startDate',
                dueDate: '$dueDate',
                title: 1,
                publisherPosition: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: '$_id',
                countAnswered: { $first: '$countAnswered' },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                branch: { $first: '$branch' },
                startDate: { $first: '$startDate' },
                dueDate: { $first: '$dueDate' },
                status: { $first: '$status' },
                publisherPosition: { $first: '$publisherPosition' },
                createdBy: { $first: '$createdBy' },
                title: { $first: '$title' },
            },
        });

        pipeline.push({
            $addFields: {
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
                                    '$$country.en',
                                    {
                                        $let: {
                                            vars: {
                                                region: '$$region.en',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$region.en'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$region.en',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $let: {
                                            vars: {
                                                subRegion: '$$subRegion.en',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$subRegion.en'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$subRegion.en',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $let: {
                                            vars: {
                                                retailSegment: '$$retailSegment.en',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$retailSegment.en'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$retailSegment.en',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $let: {
                                            vars: {
                                                outlet: '$$outlet.en',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$outlet.en'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$outlet.en',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $let: {
                                            vars: {
                                                branch: '$$branch.en',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$branch.en'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$branch.en',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                            ar: {
                                $concat: [
                                    '$$country.ar',
                                    {
                                        $let: {
                                            vars: {
                                                region: '$$region.ar',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$region.ar'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$region.ar',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $let: {
                                            vars: {
                                                subRegion: '$$subRegion.ar',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$subRegion.ar'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$subRegion.ar',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $let: {
                                            vars: {
                                                retailSegment: '$$retailSegment.ar',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$retailSegment.ar'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$retailSegment.ar',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $let: {
                                            vars: {
                                                outlet: '$$outlet.ar',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$outlet.ar'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$outlet.ar',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $let: {
                                            vars: {
                                                branch: '$$branch.ar',
                                            },
                                            in: {
                                                $cond: {
                                                    if: { $not: ['$$branch.ar'] },
                                                    then: '',
                                                    else: {
                                                        $concat: [
                                                            '->',
                                                            '$$branch.ar',
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                ],
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
            $group: {
                _id: null,
                setItems: {
                    $push: '$$ROOT',
                },
                total: {
                    $sum: 1,
                },
            },
        });

        pipeline.push({
            $unwind: '$setItems',
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
                location: '$setItems.location',
                status: '$setItems.status',
                title: '$setItems.title',
                publisherName: '$setItems.createdBy.user.name',
                publisherPosition: '$setItems.publisherPosition.name',
                countAnswered: '$setItems.countAnswered',
                startDate: {
                    $dateToString: {
                        format: '%m/%d/%Y',
                        date: '$setItems.startDate',
                    },
                },
                dueDate: {
                    $dateToString: {
                        format: '%m/%d/%Y',
                        date: '$setItems.dueDate',
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: {
                    $first: '$total',
                },
                data: {
                    $push: '$$ROOT',
                },
            },
        });

        ConsumersSurveyModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVES_AND_TASKS_FORM, cb);
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

        const statuses = [{
            _id: 'toBeDiscussed',
            name: {
                en: 'To be discussed',
                ar: '',
            },
        }, {
            _id: 'inProgress',
            name: {
                en: 'In progress',
                ar: 'في تَقَدم',
            },
        }, {
            _id: 'reOpened',
            name: {
                en: 'Reopened',
                ar: 'ضعيف',
            },
        }, {
            _id: 'closed',
            name: {
                en: 'Closed',
                ar: 'مغلق',
            },
        }, {
            _id: 'overDue',
            name: {
                en: 'Overdue',
                ar: 'متأخر',
            },
        }, {
            _id: 'fail',
            name: {
                en: 'Fail',
                ar: 'اخفاق',
            },
        }, {
            _id: 'completed',
            name: {
                en: 'Completed',
                ar: 'منجز',
            },
        }];

        response.data.forEach(item => {
            item.title = {
                en: sanitizeHtml(item.title.en),
                ar: sanitizeHtml(item.title.ar),
            };
            item.status = statuses.filter((subItem) => {
                return item.status.indexOf(subItem._id) > -1;
            })[0];
        });

        res.status(200).send(response);
    });
};
