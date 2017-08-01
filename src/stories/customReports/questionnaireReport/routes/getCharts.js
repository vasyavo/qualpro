const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const generalFiler = require('./../../utils/generalFilter');
const QuestionnaryModel = require('./../../../../types/questionnaries/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const applyAnalyzeBy = require('./../components/analyzeBy/index');
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
        const analyzeByParam = query.analyzeBy;
        const queryFilter = query.filter || {};

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        const filters = [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.PERSONNEL,
            CONTENT_TYPES.POSITION,
            'assignedTo',
            'questionnaire',
        ];

        // map set String ID to set ObjectID
        filters.forEach(filterName => {
            if (queryFilter[filterName] && queryFilter[filterName].length) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        const pipeline = [];

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
                countAnswered: { $gt: 0 },
            },
        });

        const $generalMatch = generalFiler([
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            'assignedTo',
            'questionnaire',
        ], queryFilter);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: [
                        ...queryFilter[CONTENT_TYPES.PERSONNEL],
                        personnel._id,
                    ],
                },
            });
        }

        if (queryFilter.assignedTo && queryFilter.assignedTo.length) {
            $generalMatch.$and.push({
                personnels: {
                    $in: [
                        ...queryFilter.assignedTo,
                        personnel._id,
                    ],
                },
            });
        }

        if (queryFilter.status && queryFilter.status.length) {
            $generalMatch.$and.push({
                status: {
                    $in: queryFilter.status,
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
            $addFields: {
                assignee: {
                    $map: {
                        input: '$answers',
                        as: 'item',
                        in: '$$item.personnelId',
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'assignee',
                foreignField: '_id',
                as: 'assignee',
            },
        });

        pipeline.push({
            $addFields: {
                assignee: {
                    $map: {
                        input: '$assignee',
                        as: 'user',
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
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'assignee.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        applyAnalyzeBy(pipeline, analyzeByParam, queryFilter);

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

        let response = result[0];

        if (response) {
            response = {
                labels: response.labels,
                datasets: [{ data: response.data }],
            };
        } else {
            response = {
                labels: [],
                datasets: [],
            };
        }

        res.status(200).send(response);
    });
};
