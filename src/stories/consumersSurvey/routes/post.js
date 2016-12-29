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
const TaskSchedulerModel = require('../../../types/taskScheduler/model');
const requestService = require('../../../services/request');
const config = require('../../../config');

const $defProjection = {
    _id: 1,
    title: 1,
    dueDate: 1,
    country: 1,
    region: 1,
    subRegion: 1,
    retailSegment: 1,
    outlet: 1,
    branch: 1,
    countAll: 1,
    countAnswered: 1,
    status: 1,
    questions: 1,
    location: 1,
    editedBy: 1,
    createdBy: 1,
    creationDate: 1,
    updateDate: 1,
    position: 1,
    personnels: 1
};

module.exports = (req, res, next) => {
    function queryRun(body) {
        var aggregateHelper = new AggregationHelper($defProjection);

        async.waterfall([
            function (waterfallCb) {
                var createdBy = {
                    user: req.session.uId,
                    date: new Date()
                };

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

                        if (question.type === 'NPS') {
                            const options = [];

                            for (let i = 1; i <= 10; i++) {
                                options.push({
                                    en : i,
                                    ar : i
                                });
                            }

                            question.options = options;
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

                body.status = 'draft';
                body.dueDate = new Date(body.dueDate);
                body.startDate = new Date(body.startDate);
                body.createdBy = createdBy;
                body.editedBy = createdBy;

                if (body.send) {
                    body.status = 'active';
                }

                ConsumersSurveyModel.create(body, function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    requestService.post({
                        url: `${config.schedulerHost}/tasks`,
                        date: body.startDate
                    }, (err, response) => { //todo set real scheduler url
                        if (!err) {
                            const taskSchedulerModel = new TaskSchedulerModel();
                            taskSchedulerModel.set({
                                scheduleId: response.id,
                                documentId: result._id,
                                functionName: 'changeStatusOfConsumerSurvey',
                                args : ['active']
                            });
                            taskSchedulerModel.create();
                        }
                    });

                    requestService.post({
                        url: `${config.schedulerHost}/tasks`,
                        date: body.dueDate
                    }, (err, response) => { //todo set real scheduler url
                        if (!err) {
                            const taskSchedulerModel = new TaskSchedulerModel();
                            taskSchedulerModel.set({
                                scheduleId: response.id,
                                documentId: result._id,
                                functionName: 'changeStatusOfConsumerSurvey',
                                args : ['draft']
                            });
                            taskSchedulerModel.create();
                        }
                    });

                    event.emit('activityChange', {
                        module    : ACL_MODULES.CONSUMER_SURVEY,
                        actionType: ACTIVITY_TYPES.CREATED,
                        createdBy : body.createdBy,
                        itemId    : result._id,
                        itemType  : CONTENT_TYPES.CONSUMER_SURVEY
                    });

                    waterfallCb(null, result._id);
                });
            },
            function (id, waterfallCb) {
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
