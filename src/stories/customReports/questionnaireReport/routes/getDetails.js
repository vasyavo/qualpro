const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const QuestionnaryModel = require('./../../../../types/questionnaries/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const CONSTANTS = require('./../../../../constants/mainConstants');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const sanitizeHtml = require('../../utils/sanitizeHtml');
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
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION, 'assignedTo', 'questionnaire',
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
                    $in: _.union(queryFilter[CONTENT_TYPES.PERSONNEL], personnel._id),
                },
            });
        }

        if (queryFilter.status && queryFilter.status.length) {
            $generalMatch.$and.push({
                status: {
                    $in: _.union(queryFilter.status, personnel._id),
                },
            });
        }

        if (queryFilter.questionnaire && queryFilter.questionnaire.length) {
            $generalMatch.$and.push({
                _id: { $in: queryFilter.questionnaire },
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
            $match: {
                status: { $ne: 'draft' },
            },
        });

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
                    date: '$createdBy.date',
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
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'questionnaryAnswer',
                localField: '_id',
                foreignField: 'questionnaryId',
                as: 'answers',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                title: 1,
                answer: {
                    $map: {
                        input: '$answers',
                        as: 'answer',
                        in: {
                            country: '$$answer.country',
                            region: '$$answer.region',
                            subRegion: '$$answer.subRegion',
                            retailSegment: '$$answer.retailSegment',
                            outlet: '$$answer.outlet',
                            branch: '$$answer.branch',
                            personnel: '$$answer.personnelId',
                            question: {
                                $let: {
                                    vars: {
                                        questionObject: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$questions',
                                                        as: 'question',
                                                        cond: {
                                                            $eq: ['$$question._id', '$$answer.questionId'],
                                                        },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    },
                                    in: '$$questionObject.title',
                                },
                            },
                            answerText: {
                                $cond: {
                                    if: { $gt: ['$$answer.text', ''] },
                                    then: ['$$answer.text'],
                                    else: {
                                        $map: {
                                            input: '$$answer.optionIndex',
                                            as: 'answerIndex',
                                            in: {
                                                $let: {
                                                    vars: {
                                                        questionObject: {
                                                            $arrayElemAt: [
                                                                {
                                                                    $filter: {
                                                                        input: '$questions',
                                                                        as: 'question',
                                                                        cond: {
                                                                            $eq: ['$$question._id', '$$answer.questionId'],
                                                                        },
                                                                    },
                                                                },
                                                                0,
                                                            ],
                                                        },
                                                    },
                                                    in: {
                                                        $arrayElemAt: ['$$questionObject.options', '$$answerIndex'],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $unwind: {
                path: '$answer',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (queryFilter.assignedTo && queryFilter.assignedTo.length) {
            pipeline.push({
                $match: { $or: [{
                    'answer.personnel': {
                        $in: _.union(queryFilter.assignedTo, personnel._id),
                    },
                }, {
                    answer: null,
                }],
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'answer.personnel',
                foreignField: '_id',
                as: 'personnel',
            },
        });

        pipeline.push({
            $addFields: {
                personnel: {
                    $let: {
                        vars: {
                            personnel: { $arrayElemAt: ['$personnel', 0] },
                        },
                        in: {
                            _id: '$$personnel._id',
                            name: {
                                en: { $ifNull: [{ $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] }, 'N/A Personnel'] },
                                ar: { $ifNull: [{ $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] }, 'N/A Personnel'] },
                            },
                            position: '$$personnel.position',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: { $or: [{
                    'personnel.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                }, {
                    answer: null,
                }],
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                total: { $sum: 1 },
                records: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$records'
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
                _id: '$records._id',
                title: '$records.title',
                country: '$records.answer.country',
                region: '$records.answer.region',
                subRegion: '$records.answer.subRegion',
                retailSegment: '$records.answer.retailSegment',
                outlet: '$records.answer.outlet',
                branch: '$records.answer.branch',
                personnel: '$records.personnel',
                question: { $ifNull: ['$records.answer.question', { en: 'N/A', ar: 'N/A' }] },
                answer: { $ifNull: [{ $arrayElemAt: ['$records.answer.answerText', 0] }, { en: 'N/A', ar: 'N/A' }] },
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
            $project: {
                total: 1,
                title: 1,
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
                            $ifNull: [{
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
                            }, 'N/A Location',
                            ],
                        },
                    },
                },
                personnel: 1,
                question: 1,
                answer: 1,
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'personnel.position',
                foreignField: '_id',
                as: 'position',
            },
        });

        pipeline.push({
            $addFields: {
                position: {
                    $let: {
                        vars: {
                            position: { $arrayElemAt: ['$position', 0] },
                        },
                        in: {
                            _id: { $ifNull: ['$$position._id', 'N/A'] },
                            name: { $ifNull: ['$$position.name', 'N/A Position'] },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: {
                    questionnaireId: '$_id',
                    location: '$location',
                    personnel: '$personnel._id',
                },
                total: { $first: '$total' },
                title: { $first: '$title' },
                personnel: { $first: '$personnel' },
                position: { $first: '$position' },
                items: {
                    $push: {
                        question: '$question',
                        answer: '$answer',
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: '$_id.questionnaireId',
                total: { $first: '$total' },
                title: { $first: '$title' },
                respondents: {
                    $push: {
                        personnel: '$personnel',
                        position: '$position',
                        location: '$_id.location',
                        items: '$items',
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

        QuestionnaryModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, cb);
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

        response.data.forEach(dataItem => {
            dataItem.respondents.forEach(respondent => {
                respondent.items.forEach(item => {
                    if (item.answer) {
                        item.answer = {
                            en: sanitizeHtml(item.answer.en),
                            ar: sanitizeHtml(item.answer.ar),
                        };
                    }
                });
            });
        });

        res.status(200).send(response);
    });
};
