const async = require('async');
const _ = require('underscore');
const mongoose = require('mongoose');
const event = require('../../../utils/eventEmitter');
const ConsumersSurveyAnswersModel = require('../../../types/consumersSurveyAnswers/model');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const ACTIVITY_TYPES = require('../../../constants/activityTypes');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const access = require('../../../helpers/access')();
const bodyValidator = require('../../../helpers/bodyValidator');
const ObjectId = mongoose.Types.ObjectId;
const ActivityLog = require('./../../push-notifications/activityLog');

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;

    function queryRun(body) {
        const personnelId = ObjectId(userId);
        let isItUpdateOperation;

        async.waterfall([

            (cb) => {
                if (body && !body.answers) {
                    body.answers = [];
                }

                async.each(body.answers, (answer, eachCb) => {
                    const newAnswer = {
                        country: body.country,
                        region: body.region,
                        subRegion: body.subRegion,
                        retailSegment: body.retailSegment,
                        customer: body.customer,
                        outlet: body.outlet,
                        branch: body.branch,
                        questionnaryId: body.consumerSurveyId,
                        questionId: answer.questionId,
                        type: answer.type,
                    };

                    if (answer.optionIndex && answer.optionIndex.length) {
                        newAnswer.optionIndex = answer.optionIndex;
                    }

                    if (answer.text && Object.keys(answer.text).length) {
                        newAnswer.text = {
                            en: _.escape(answer.text.en),
                            ar: _.escape(answer.text.ar),
                        };
                    }

                    async.waterfall([

                        (cb) => {
                            const query = {
                                questionnaryId: newAnswer.consumerSurveyId,
                                questionId: newAnswer.questionId,
                                branch: newAnswer.branch,
                            };

                            ConsumersSurveyAnswersModel.findOne(query, (err, result) => {
                                if (err) {
                                    return cb(err);
                                }

                                if (!result) {
                                    return cb(null, false);
                                }

                                cb(null, result._id.toString());
                            });
                        },

                        (questionAnswerIdToUpdate, cb) => {
                            const createdBy = {
                                user: personnelId,
                                date: new Date(),
                            };

                            if (questionAnswerIdToUpdate) {
                                newAnswer.editedBy = createdBy;

                                return ConsumersSurveyAnswersModel.update({
                                    _id: questionAnswerIdToUpdate,
                                }, {
                                    $set: newAnswer,
                                }, (err) => {
                                    if (err) {
                                        return cb(err);
                                    }

                                    isItUpdateOperation = true;

                                    cb(null);
                                });
                            }

                            newAnswer.createdBy = createdBy;
                            newAnswer.editedBy = createdBy;

                            ConsumersSurveyAnswersModel.create(newAnswer, (err) => {
                                if (err) {
                                    return cb(err);
                                }

                                cb(null);
                            });
                        },

                    ], eachCb);
                }, (err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null);
                });
            },

            (cb) => {
                if (isItUpdateOperation) {
                    return cb(null);
                }

                ConsumersSurveyModel.findByIdAndUpdate(body.consumerSurveyId, {
                    $inc: {
                        countAnswered: 1,
                    },
                    editedBy: {
                        user: personnelId,
                        date: new Date(),
                    },
                }, {
                    new: true,
                }, cb);
            },

        ], (err, survey) => {
            if (err) {
                return next(err);
            }

            ActivityLog.emit('marketing:consumer-survey:item-published', {
                actionOriginator: userId,
                accessRoleLevel,
                body: survey.toJSON(),
            });

            next({
                status: 200,
                body: {},
            });
        });
    }

    access.getEditAccess(req, ACL_MODULES.CONSUMER_SURVEY, function (err) {
        if (err) {
            return next(err);
        }

        let updateObject;

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
