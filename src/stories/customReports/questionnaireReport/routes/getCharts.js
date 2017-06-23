const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
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
        const query = req.query;
        const timeFilter = query.timeFilter;
        const analyzeByParam = query.analyzeBy;
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

        pipeline.push({
            $match: {
                countAnswered: { $gt: 0 },
            },
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

        if (queryFilter.assignedTo && queryFilter.assignedTo.length) {
            $generalMatch.$and.push({
                personnels: {
                    $in: _.union(queryFilter.assignedTo, personnel._id),
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
                answeredPersonnels: {
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
                localField: 'answeredPersonnels',
                foreignField: '_id',
                as: 'answeredPersonnels',
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'answeredPersonnels.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                answeredPersonnels: null,
                answers: null,
            },
        });

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
                barChart: {
                    labels: response.labels,
                    datasets: [{
                        data: response.data,
                    }],
                },
            };
        } else {
            response = {
                barChart: {
                    labels: [],
                    datasets: [],
                },
            };
        }

        res.status(200).send(response);
    });
};
