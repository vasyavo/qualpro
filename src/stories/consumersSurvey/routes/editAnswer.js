const async = require('async');
const _ = require('lodash');
const ConsumersSurveyAnswersModel = require('../../../types/consumersSurveyAnswers/model');
const bodyValidator = require('../../../helpers/bodyValidator');
const access = require('../../../helpers/access')();
const ACL_MODULES = require('../../../constants/aclModulesNames');
const CONTENT_TYPES = require('../../../public/js/constants/contentType');

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const requestBody = req.body;
    const id = req.params.id;

    const queryRun = (body, callback) => {
        body.editedBy = {
            user: userId,
            date: Date.now()
        };
        ConsumersSurveyAnswersModel.findByIdAndUpdate(id, body, { new: true }).exec(callback);
    };

    async.waterfall([
        (cb) => {
            access.getEditAccess(req, ACL_MODULES.CONSUMER_SURVEY, cb);
        },

        (allowed, personnel, cb) => {
            bodyValidator.validateBody(requestBody, accessRoleLevel, CONTENT_TYPES.CONSUMER_SURVEY_ANSWER, 'update', cb);
        },

        (body, cb) => {
            queryRun(body, cb);
        },

    ], (err, body) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(body);
    });
};