const async = require('async');
const ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');
const extractBody = require('./../../../utils/extractBody');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const SchedulerModel = require('./../../scheduler/model');
const CONTENT_TYPES = require('../../../public/js/constants/contentType');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const bodyValidator = require('../../../helpers/bodyValidator');
const access = require('../../../helpers/access')();
const aggregateById = require('../reusable-components/getByIdAggr');
const ActivityLog = require('./../../push-notifications/activityLog');
const AbstractScheduler = require('abstract-scheduler').api;

const onDueDateChange = (survey, cb) => {
    async.waterfall([

        (cb) => {
            SchedulerModel.find({
                documentId: survey._id,
                functionName: {
                    $in: ['setConsumerSurveyStatusCompleted'],
                },
            }, cb);
        },

        (setScheduled, cb) => {
            const setScheduledId = setScheduled.map(model => model.scheduleId);

            if (setScheduledId.length) {
                AbstractScheduler.deleteMany({
                    id: setScheduledId,
                }, () => {
                    SchedulerModel.remove({
                        scheduleId: {
                            $in: setScheduledId,
                        },
                    });
                });
            }

            AbstractScheduler.register({
                date: survey.dueDate,
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

            cb(null);
        },

    ], cb);
};

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;

    const queryRun = (body, callback) => {
        const requestedId = req.params.id;

        async.waterfall([

            (cb) => {
                if (body.title) {
                    body.title = {
                        en: _.escape(body.title.en),
                        ar: _.escape(body.title.ar),
                    };
                }

                if (body.questions && body.questions.length) {
                    body.questions = body.questions
                        .filter(question => question)
                        .map(question => {
                            if (question.title) {
                                question.title = {
                                    en: _.escape(question.title.en),
                                    ar: _.escape(question.title.ar),
                                };
                            }

                            if (question.options && question.options.length) {
                                question.options = question.options
                                    .filter(option => option)
                                    .map(option => ({
                                        en: _.escape(option.en),
                                        ar: _.escape(option.ar),
                                    }));
                            }

                            return question;
                        });
                }

                if (body.dueDate) {
                    body.dueDate = new Date(body.dueDate);
                }

                if (body.startDate) {
                    body.startDate = new Date(body.startDate);
                }

                body.editedBy = {
                    user: userId,
                    date: new Date(),
                };

                body.status = body.send ? 'active' : 'draft';

                ConsumersSurveyModel.findByIdAndUpdate(requestedId, { $set: body }, { new: true }, cb);
            },

            (survey, cb) => {
                const eventPayload = {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body: survey.toJSON(),
                };

                // if survey in draft and client want activate it
                if (body.send === 'active') {
                    ActivityLog.emit('marketing:consumer-survey:published', eventPayload);
                } else {
                    ActivityLog.emit('marketing:consumer-survey:updated', eventPayload);
                }

                cb(null, survey);
            },

            (survey, cb) => {
                // register new scheduled task and remove old one only if new due date was set
                if (body.dueDate) {
                    return onDueDateChange(survey, cb);
                }

                cb(null);
            },

            (cb) => {
                aggregateById({
                    id: ObjectId(requestedId),
                }, cb);
            },

        ], callback);
    };

    async.waterfall([

        (cb) => {
            access.getWriteAccess(req, ACL_MODULES.CONSUMER_SURVEY, cb);
        },

        (allowed, personnel, cb) => {
            const body = extractBody(req.body);

            bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.CONSUMER_SURVEY, 'create', cb);
        },

        queryRun,

    ], (err, result) => {
        if (err) {
            return next(err);
        }

        next({
            status: 200,
            body: result,
        });
    });
};
