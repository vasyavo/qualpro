const async = require('async');
const _ = require('underscore');
const event = require('../../../utils/eventEmitter');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const bodyValidator = require('../../../helpers/bodyValidator');
const access = require('../../../helpers/access')();
const ACL_MODULES = require('../../../constants/aclModulesNames');
const getByIdAggr = require('../reusable-components/getByIdAggr');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const ACTIVITY_TYPES = require('../../../constants/activityTypes');
const SchedulerModel = require('./../../scheduler/model');
const requestService = require('../../scheduler/request');
const config = require('../../../config');
const ActivityLog = require('./../../push-notifications/activityLog');

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;

    function queryRun(body) {
        async.waterfall([

            (cb) => {
                const createdBy = {
                    user: userId,
                    date: new Date(),
                };

                if (body.title) {
                    body.title = {
                        en: _.escape(body.title.en),
                        ar: _.escape(body.title.ar),
                    };
                }

                if (body.questions && body.questions.length) {
                    body.questions = _.map(body.questions, (question) => {
                        if (question.title) {
                            question.title = {
                                en: _.escape(question.title.en),
                                ar: _.escape(question.title.ar),
                            };
                        }

                        if (question.type === 'NPS') {
                            const options = [];

                            for (let i = 1; i <= 10; i++) {
                                options.push({
                                    en: i,
                                    ar: i,
                                });
                            }

                            question.options = options;
                        }

                        if (question.options && question.options.length) {
                            question.options = _.map(question.options, (option) => {
                                if (option) {
                                    return {
                                        en: _.escape(option.en),
                                        ar: _.escape(option.ar),
                                    };
                                }
                            });
                        }
                        return question;
                    });
                }

                body.status = 'draft';
                body.dueDate = new Date(body.dueDate);
                body.startDate = new Date(body.startDate);
                body.createdBy = createdBy;
                body.editedBy = createdBy;

                if (body.send) {
                    body.status = 'active';
                }

                ConsumersSurveyModel.create(body, (err, survey) => {
                    cb(err, survey);
                });
            },

            (survey, cb) => {
                if (body.status === 'draft') {
                    requestService.post({
                        json: {
                            date: body.startDate,
                        },
                    }, (err, response) => {
                        if (!err) {
                            const taskSchedulerModel = new SchedulerModel();
                            taskSchedulerModel.set({
                                scheduleId: response.id,
                                documentId: survey._id,
                                functionName: 'setConsumerSurveyStatusActive',
                            });
                            taskSchedulerModel.save();
                        }
                    });
                } else {
                    ActivityLog.emit('marketing:consumer-survey:published', {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body: survey.toJSON(),
                    });
                }

                requestService.post({
                    json: {
                        date: body.dueDate,
                    },
                }, (err, response) => {
                    if (!err) {
                        const taskSchedulerModel = new SchedulerModel();
                        taskSchedulerModel.set({
                            scheduleId: response.id,
                            documentId: survey._id,
                            functionName: 'setConsumerSurveyStatusCompleted',
                        });
                        taskSchedulerModel.save();
                    }
                });

                cb(null, survey._id);
            },

            (id, cb) => {
                getByIdAggr({ id }, cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            next({
                status: 200,
                body: result,
            });
        });
    }

    access.getWriteAccess(req, ACL_MODULES.CONSUMER_SURVEY, function (err) {
        if (err) {
            return next(err);
        }

        let body;

        try {
            if (req.body.data) {
                body = JSON.parse(req.body.data);
            } else {
                body = req.body;
            }
        } catch (err) {
            return next(err);
        }

        bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.CONSUMER_SURVEY, 'create', function (err, saveData) {
            if (err) {
                return next(err);
            }

            queryRun(saveData);
        });
    });

};
