const wrap = require('co-express');
const async = require('async');
const _ = require('lodash');
const AccessManager = require('./../../../helpers/access')();
const BodyValidator = require('./../../../helpers/bodyValidator');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const ACTIVITY_TYPES = require('./../../../constants/activityTypes');
const ConsumerSurveyModel = require('./../types/survey/model');
const AnswerModel = require('./../types/answer/model');
const logger = require('./../../../utils/logger');
const eventEmitter = require('./../../../utils/eventEmitter');

const actionAnswerLeaved = (options) => {
    const personnelId = options.personnelId;
    const answerId = options.answerId;


};

module.exports = wrap(function * (req, res, next) {
    const body = req.body;
    const accessRoleLevel = req.session.level;
    const aclModule = ACL_MODULES.CONSUMER_SURVEY;
    const contentType = CONTENT_TYPES.CONSUMER_SURVEY_ANSWER;
    const personnelId = req.session.uId;

    yield AccessManager.getEditAccessPromise(req, aclModule);
    const allowedData = yield BodyValidator.validateBodyPromise({
        body,
        level: accessRoleLevel,
        contentType,
        method: 'create'
    });

    // should be an array
    const answers = allowedData.answers || [];

    async.each(answers, (answer, eachCb) => {
        const newAnswer = {
            surveyId: allowedData.surveyId,
            questionId: answer.questionId,
            personnelId,
            customer: allowedData.customer,
            country: allowedData.country,
            region: allowedData.region,
            subRegion: allowedData.subRegion,
            retailSegment: allowedData.retailSegment,
            outlet: allowedData.outlet,
            branch: allowedData.branch,
            createdBy: {
                user: personnelId,
            },
            editedBy: {
                user: personnelId,
            },
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

        const answerModel = new AnswerModel();
        answerModel.set(newAnswer);
        answerModel.save(eachCb);
    }, (err) => {
        if (err) {
            return next(err);
        }

        next({
            status: 200,
            body: {}
        })
    });
});
