const async = require('async');
const _ = require('lodash');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const bodyValidator = require('../../../helpers/bodyValidator');
const access = require('../../../helpers/access')();
const ACL_MODULES = require('../../../constants/aclModulesNames');
const getByIdAggr = require('../reusable-components/getByIdAggr');
const CONTENT_TYPES = require('../../../public/js/constants/contentType');
const SchedulerModel = require('./../../scheduler/model');
const ActivityLog = require('./../../push-notifications/activityLog');
const extractBody = require('./../../../utils/extractBody');
const AbstractScheduler = require('abstract-scheduler').api;

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;

    const queryRun = (body, callback) => {
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
                    body.questions = body.questions
                        .filter(question => question)
                        .map(question => {
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

                body.status = body.send ? 'active' : 'draft';
                body.dueDate = new Date(body.dueDate);
                body.startDate = new Date(body.startDate);
                body.createdBy = createdBy;
                body.editedBy = createdBy;

                const survey = new ConsumersSurveyModel();

                survey.set(body);
                survey.save((err, survey) => {
                    cb(err, survey);
                });
            },

            (survey, cb) => {
                const eventPayload = {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body: survey.toJSON(),
                };

                if (body.status === 'draft') {
                    ActivityLog.emit('marketing:consumer-survey:draft-created', eventPayload);
                } else {
                    ActivityLog.emit('marketing:consumer-survey:published', eventPayload);

                    AbstractScheduler.register({
                        date: body.dueDate,
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
                }

                cb(null, survey._id);
            },

            (id, cb) => {
                getByIdAggr({ id }, cb);
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
