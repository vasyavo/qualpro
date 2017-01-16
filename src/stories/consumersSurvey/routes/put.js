const async = require('async');
const _ = require('underscore');
const event = require('../../../utils/eventEmitter');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const SchedulerModel = require('./../../scheduler/model');
const ACTIVITY_TYPES = require('../../../constants/activityTypes');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const bodyValidator = require('../../../helpers/bodyValidator');
const access = require('../../../helpers/access')();
const getByIdAggr = require('../reusable-components/getByIdAggr');
const requestService = require('../../scheduler/request');
const config = require('../../../config');

module.exports = (req, res, next) => {
    function queryRun(body) {
        var id = req.params.id;
        var fullUpdate = {
            $set: body
        };

        async.waterfall([
            function (waterfallCb) {
                if (body.title) {
                    body.title = {
                        en: _.escape(body.title.en),
                        ar: _.escape(body.title.ar)
                    };
                }

                if (body.questions && body.questions.length) {
                    body.questions = _.map(body.questions, function (question) {
                        if (question.title) {
                            question.title = {
                                en: _.escape(question.title.en),
                                ar: _.escape(question.title.ar)
                            };
                        }
                        if (question.options && question.options.length) {
                            question.options = _.map(question.options, function (option) {
                                if (option) {
                                    return {
                                        en: _.escape(option.en),
                                        ar: _.escape(option.ar)
                                    };
                                }
                            });
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
                    user: req.session.uId,
                    date: new Date()
                };

                body.status = body.send ? 'active' : 'draft';

                ConsumersSurveyModel.findByIdAndUpdate(id, fullUpdate, {new: true}, waterfallCb);
            },

            (updateModel, cb) => {
                event.emit('activityChange', {
                    module    : ACL_MODULES.CONSUMER_SURVEY,
                    actionType: ACTIVITY_TYPES.UPDATED,
                    createdBy : updateModel.editedBy,
                    itemId    : id,
                    itemType  : CONTENT_TYPES.CONSUMER_SURVEY
                });

                cb(null, updateModel);
            },

            (consumersSurveyModel, cb) => {
                SchedulerModel.find({
                    documentId : consumersSurveyModel._id,
                    functionName : {
                        $in : ['setConsumerSurveyStatusActive', 'setConsumerSurveyStatusCompleted']
                    }
                }, (err, schedulerModels, numAffected) => {
                    //tip: do not remove numAffected
                    cb(err, schedulerModels, consumersSurveyModel);
                });
            },

            (schedulerModels, consumerSurveyModel, cb) => {
                const arrayOfSchedulesId = [];

                schedulerModels.map((model) => {
                    arrayOfSchedulesId.push(model.scheduleId);
                });

                if (arrayOfSchedulesId.length) {
                    requestService.del({
                        json : {
                            data : arrayOfSchedulesId
                        }
                    }, () => {
                        SchedulerModel.remove({
                            scheduleId : {
                                $in : arrayOfSchedulesId
                            }
                        }, () => {
                            return cb(null, consumerSurveyModel);
                        });
                    });
                } else {
                    cb(null, consumerSurveyModel);
                }
            },

            (consumerSurveyModel, cb) => {
                if (consumerSurveyModel.status !== 'active') {
                    requestService.post({
                        json : {
                            date: consumerSurveyModel.startDate
                        }
                    }, (err, response) => {
                        if (!err) {
                            const taskSchedulerModel = new SchedulerModel();
                            taskSchedulerModel.set({
                                scheduleId: response.id,
                                documentId: consumerSurveyModel._id,
                                functionName: 'setConsumerSurveyStatusActive'
                            });
                            taskSchedulerModel.save();
                        }
                    });
                }

                requestService.post({
                    json : {
                        date: consumerSurveyModel.dueDate
                    }
                }, (err, response) => {
                    if (!err) {
                        const taskSchedulerModel = new SchedulerModel();
                        taskSchedulerModel.set({
                            scheduleId: response.id,
                            documentId: consumerSurveyModel._id,
                            functionName: 'setConsumerSurveyStatusCompleted'
                        });
                        taskSchedulerModel.save();
                    }
                });

                cb(null, consumerSurveyModel._id);
            },

            (id, waterfallCb) => {
                getByIdAggr({id: id}, waterfallCb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }

            next({status: 200, body: result});
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
