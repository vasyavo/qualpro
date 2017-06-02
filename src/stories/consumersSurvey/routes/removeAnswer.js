const async = require('async');
const _ = require('lodash');
const ConsumersSurveyAnswersModel = require('../../../types/consumersSurveyAnswers/model');
const EventModel = require('../../../types/event/model');
const logger = require('../../../utils/logger');
const access = require('../../../helpers/access')();
const ACL_MODULES = require('../../../constants/aclModulesNames');

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const id = req.params.id;

    const queryRun = (callback) => {
        async.waterfall([

            (cb) => {
                ConsumersSurveyAnswersModel.findOne({ _id: id }).lean().exec(cb);
            },
            (removeItem, cb) => {
                const eventModel = new EventModel();
                const options = {
                    headers: {
                        contentType: 'ConsumerSurveyAnswer',
                        actionType: 'remove',
                        user: userId,
                    },
                    payload: removeItem,
                };
                eventModel.set(options);
                eventModel.save((err) => {
                    cb(null, err);
                });
            },
            (err) => {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }

                    return logger.error(err);
                }

                ConsumersSurveyAnswersModel.findOneAndRemove({ _id: id }, callback);
            },
        ], (err, body) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(body);
        });
    };

    async.waterfall([

        (cb) => {
            access.getArchiveAccess(req, ACL_MODULES.CONSUMER_SURVEY, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(cb);
        },
    ], (err, body) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(body);
    });
};
