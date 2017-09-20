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
        type      : 'object',
        properties: {
            timeFrames: {
                type : 'array',
                items: {
                    from    : {
                        type: 'string',
                    },
                    to      : {
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
        const pipeline = [{
            $match: {
                status: {
                    $ne: 'draft',
                },
            },
        }];

        if (queryFilter.status && queryFilter.status.length) {
            pipeline.push({
                $match: {
                    status: {$in: queryFilter.status},
                },
            });
        }

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({timeFrames: timeFilter});

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

        const $timeMatch = {};
        $timeMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$or.push({
                    $and: [
                        {
                            'createdBy.date': {$gt: moment(frame.from, 'MM/DD/YYYY')._d},
                        },
                        {
                            'createdBy.date': {$lt: moment(frame.to, 'MM/DD/YYYY')._d},
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

        if (queryFilter.title && queryFilter.title.length) {
            pipeline.push({
                $match: {
                    _id: {$in: queryFilter.title},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    branch: {
                        $in: queryFilter[CONTENT_TYPES.BRANCH],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    subRegion: {$in: queryFilter[CONTENT_TYPES.SUBREGION]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    retailSegment: {$in: queryFilter[CONTENT_TYPES.RETAILSEGMENT]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    outlet: {$in: queryFilter[CONTENT_TYPES.OUTLET]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    region: {$in: queryFilter[CONTENT_TYPES.REGION]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    country: {$in: queryFilter[CONTENT_TYPES.COUNTRY]},
                },
            });
        }

        pipeline.push(...[{
            $unwind: {
                path                      : '$questions',
            },
        }, {
            $lookup: {
                from        : 'consumersSurveyAnswers',
                localField  : 'questions._id',
                foreignField: 'questionId',
                as          : 'answers',
            },
        }, {
            $unwind: {
                path                      : '$answers',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'branches',
                localField  : 'answers.branch',
                foreignField: '_id',
                as          : 'branch',
            },
        }, {
            $addFields: {
                branch: {
                    $let: {
                        vars: {
                            branch: {
                                $arrayElemAt: [
                                    '$branch',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id          : '$$branch._id',
                            name         : '$$branch.name',
                            retailSegment: '$$branch.retailSegment',
                            outlet       : '$$branch.outlet',
                            subRegion    : '$$branch.subRegion',
                        },
                    },
                },
            },
        }]);

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        branch: {$in: queryFilter[CONTENT_TYPES.BRANCH]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        if (queryFilter.gender && queryFilter.gender.length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'answers.customer.gender': {
                            $in: queryFilter.gender,
                        },
                    }, {
                        answers: null,
                    }],
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
                        }, {
                            'answers.customer.nationality.name.ar': {
                                $in: queryFilter.nationality,
                            },
                        }, {
                            answers: null,
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.subRegion': {$in: queryFilter[CONTENT_TYPES.SUBREGION]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.retailSegment': {$in: queryFilter[CONTENT_TYPES.RETAILSEGMENT]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.outlet': {$in: queryFilter[CONTENT_TYPES.OUTLET]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        pipeline.push(...[{
            $lookup: {
                from        : 'retailSegments',
                localField  : 'branch.retailSegment',
                foreignField: '_id',
                as          : 'retailSegment',
            },
        }, {
            $addFields: {
                retailSegment: {
                    $let: {
                        vars: {
                            retailSegment: {
                                $arrayElemAt: [
                                    '$retailSegment',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id : '$$retailSegment._id',
                            name: '$$retailSegment.name',
                        },
                    },
                },
            },
        }, {
            $lookup: {
                from        : 'outlets',
                localField  : 'branch.outlet',
                foreignField: '_id',
                as          : 'outlet',
            },
        }, {
            $addFields: {
                outlet: {
                    $let: {
                        vars: {
                            outlet: {
                                $arrayElemAt: [
                                    '$outlet',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id : '$$outlet._id',
                            name: '$$outlet.name',
                        },
                    },
                },
            },
        }, {
            $lookup: {
                from        : 'domains',
                localField  : 'branch.subRegion',
                foreignField: '_id',
                as          : 'subRegion',
            },
        }, {
            $addFields: {
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: {
                                $arrayElemAt: [
                                    '$subRegion',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id   : '$$subRegion._id',
                            name  : '$$subRegion.name',
                            parent: '$$subRegion.parent',
                        },
                    },
                },
            },
        }]);

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'subRegion.parent': {$in: queryFilter[CONTENT_TYPES.REGION]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        pipeline.push(...[{
            $lookup: {
                from        : 'domains',
                localField  : 'subRegion.parent',
                foreignField: '_id',
                as          : 'region',
            },
        }, {
            $addFields: {
                region: {
                    $let: {
                        vars: {
                            region: {
                                $arrayElemAt: [
                                    '$region',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id   : '$$region._id',
                            name  : '$$region.name',
                            parent: '$$region.parent',
                        },
                    },
                },
            },
        }]);

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'region.parent': {$in: queryFilter[CONTENT_TYPES.COUNTRY]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        pipeline.push(...[{
            $lookup: {
                from        : 'personnels',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user',
            },
        }, {
            $addFields: {
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: {$arrayElemAt: ['$createdBy.user', 0]},
                            },
                            in  : {
                                _id     : '$$user._id',
                                name    : {
                                    en: {$concat: ['$$user.firstName.en', ' ', '$$user.lastName.en']},
                                    ar: {$concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar']},
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    date: '$createdBy.date',
                },
            },
        }]);

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'createdBy.user.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push(...[{
            $project: {
                title   : 1,
                question: {
                    text  : '$questions.title',
                    answer: {
                        $cond: {
                            if  : {
                                $eq: [
                                    '$answers.type',
                                    'fullAnswer',
                                ],
                            },
                            then: [
                                '$answers.text',
                            ],
                            else: {
                                $map: {
                                    input: '$answers.optionIndex',
                                    as   : 'index',
                                    in   : {
                                        $arrayElemAt: [
                                            '$questions.options',
                                            {
                                                $subtract: [
                                                    '$$index',
                                                    1,
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                customer: {
                    en: {
                        $concat: [
                            '$answers.customer.name',
                            ' -> ',
                            '$answers.customer.nationality.name.en',
                            ' -> ',
                            '$answers.customer.gender',
                        ],
                    },
                    ar: {
                        $concat: [
                            '$answers.customer.name',
                            ' -> ',
                            '$answers.customer.nationality.name.ar',
                            ' -> ',
                            '$answers.customer.gender',
                        ],
                    },
                },
            },
        }, {
            $addFields: {
                'question.answer': {
                    $ifNull: ['$question.answer', [{
                        en: 'N/A',
                        ar: 'N/A',
                    }]],
                },

                customer: {
                    $cond: [{$eq: ['$customer.en', null]}, {
                        en: 'N/A',
                        ar: 'N/A',
                    }, '$customer'],
                },
            },
        }, {
            $sort: {
                'title.en'        : 1,
                'customer.en'     : 1,
                'question.text.en': 1,
            },
        }, {
            $group: {
                _id     : null,
                setItems: {
                    $push: '$$ROOT',
                },
                total   : {
                    $sum: 1,
                },
            },
        }, {
            $unwind: '$setItems',
        }]);

        pipeline.push(...[{
            $skip: skip,
        }, {
            $limit: limit,
        }, {
            $project: {
                customer: '$setItems.customer',
                title   : '$setItems.title',
                question: '$setItems.question',
                total   : 1,
            },
        }, {
            $group: {
                _id  : null,
                total: {$first: '$total'},
                data : {
                    $push: '$$ROOT',
                },
            },
        }]);

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
            result[0] : {data: [], total: 0};

        response.data.forEach(item => {
            item.title = {
                en: sanitizeHtml(item.title.en),
                ar: sanitizeHtml(item.title.ar),
            };
        });

        res.status(200).send(response);
    });
};
