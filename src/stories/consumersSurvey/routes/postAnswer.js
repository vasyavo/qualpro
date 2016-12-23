const async = require('async');
const _ = require('underscore');
const ConsumersSurveyAnswersModel = require('../../../types/consumersSurveyAnswers/model');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const ACTIVITY_TYPES = require('../../../constants/activityTypes');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const access = require('../../../helpers/access')();
const bodyValidator = require('../../../helpers/bodyValidator');

module.exports = (req, res, next) => {
    function queryRun(body) {
        var personnelId = ObjectId(req.session.uId);
        var update;
        var updater = {};
        var personnelAnswerExists = true;
        async.waterfall([
            function (waterfallCB) {
                if (body && !body.answers) {
                    body.answers = [];
                }
                async.each(body.answers, function (answer, eachCallback) {
                    var newAnswer = {
                        personnelId   : personnelId,
                        questionnaryId: body.questionnaryId,
                        questionId    : answer.questionId,
                        country       : body.country,
                        region        : body.region,
                        subRegion     : body.subRegion,
                        retailSegment : body.retailSegment,
                        outlet        : body.outlet,
                        branch        : body.branch
                    };
                    if (answer.optionIndex && answer.optionIndex.length) {
                        newAnswer.optionIndex = answer.optionIndex;
                    }
                    if (answer.text && Object.keys(answer.text).length) {
                        newAnswer.text = {
                            en: _.escape(answer.text.en),
                            ar: _.escape(answer.text.ar)
                        }
                    }

                    async.waterfall([
                        function (waterfallCb) {
                            var query = {
                                personnelId   : personnelId,
                                questionnaryId: newAnswer.questionnaryId
                            };
                            ConsumersSurveyAnswersModel.findOne(query, function (err, result) {
                                if (err) {
                                    return waterfallCb(err);
                                }
                                if (!result) {
                                    personnelAnswerExists = false;
                                }
                                waterfallCb(null);
                            });
                        },
                        function (waterfallCb) {
                            var query = {
                                personnelId   : personnelId,
                                questionnaryId: newAnswer.questionnaryId,
                                questionId    : newAnswer.questionId,
                                branch        : newAnswer.branch
                            };
                            ConsumersSurveyAnswersModel.findOne(query, function (err, result) {
                                if (err) {
                                    return waterfallCb(err);
                                }
                                if (!result) {
                                    return waterfallCb(null, false);
                                }
                                waterfallCb(null, result._id.toString());
                            });
                        },
                        function (questionAnswerIdToUpdate, waterfallCb) {
                            var createdBy = {
                                user: personnelId,
                                date: new Date()
                            };
                            if (questionAnswerIdToUpdate) {
                                newAnswer.editedBy = createdBy;

                                ConsumersSurveyAnswersModel.update({_id: questionAnswerIdToUpdate}, {$set: newAnswer}, function (err) {
                                    if (err) {
                                        return waterfallCb(err);
                                    }
                                    update = true;
                                    waterfallCb(null);
                                });
                            } else {
                                newAnswer.createdBy = createdBy;
                                newAnswer.editedBy = createdBy;

                                ConsumersSurveyAnswersModel.create(newAnswer, function (err) {
                                    if (err) {
                                        return waterfallCb(err);
                                    }
                                    waterfallCb(null);
                                });
                            }
                        }
                    ], function (err, result) {
                        if (err) {
                            return eachCallback(err);
                        }
                        eachCallback(null);
                    });
                }, function (err) {
                    if (err) {
                        return waterfallCB(err);
                    }
                    waterfallCB(null);
                });
            },
            function (waterfallCB) {
                ConsumersSurveyModel.findById(body.questionnaryId, function (err, questionnary) {
                    var error;

                    if (err) {
                        return waterfallCB(err);
                    }

                    if (!questionnary) {
                        error = new Error('Questionnary not found');
                        error.status = 404;

                        return waterfallCB(error);
                    }

                    waterfallCB(null, questionnary);
                });
            },
            function (questionnary, waterfallCB) {
                if (update) {
                    return waterfallCB(null);
                }

                updater.$inc = personnelAnswerExists ? {countBranches: -1} : {countAnswered: 1, countBranches: -1};

                if (questionnary.countBranches * 1 - 1 <= 0) {
                    updater.status = 'completed';
                }

                updater.editedBy = {
                    user: personnelId,
                    date: new Date()
                };
                ConsumersSurveyModel.findByIdAndUpdate(body.questionnaryId, updater, function (err) {
                    if (err) {
                        return waterfallCB(err);
                    }
                    waterfallCB(null);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }

            event.emit('activityChange', {
                module    : ACL_MODULES.CONSUMER_SURVEY,
                actionType: ACTIVITY_TYPES.UPDATED,
                createdBy : updater.editedBy,
                itemId    : body.questionnaryId,
                itemType  : CONTENT_TYPES.CONSUMER_SURVEY
            });

            next({status: 200, body: {}});
        });
    }

    access.getEditAccess(req, ACL_MODULES.CONSUMER_SURVEY, function (err, allowed) {
        var updateObject;

        if (err) {
            return next(err);
        }
        if (!allowed) {
            err = new Error();
            err.status = 403;

            return next(err);
        }

        try {
            if (req.body.data) {
                updateObject = JSON.parse(req.body.data);
            } else {
                updateObject = req.body;
            }
        } catch (err) {
            return next(err);
        }

        bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.CONSUMER_SURVEY, 'update', function (err, saveData) {
            if (err) {
                return next(err);
            }

            queryRun(saveData);
        });
    });
};
