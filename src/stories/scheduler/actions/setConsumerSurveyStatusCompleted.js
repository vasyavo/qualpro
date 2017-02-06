const async = require('async');
const _ = require('lodash');
const ConsumerSurveyModel = require('../../../types/consumersSurvey/model');
const ActivityLog = require('./../../push-notifications/activityLog');
const accessRoles = require('./../../../constants/aclRolesNames');

module.exports = (args, docId, callback) => {
    const status = 'completed';

    async.waterfall([

        (cb) => {
            ConsumerSurveyModel.findById(docId, cb);
        },

        (model, cb) => {
            if (!model) {
                return cb(null, false);
            }

            model.status = status;

            model.save((err) => {
                if (err) {
                    return cb(err);
                }

                ActivityLog.emit('marketing:consumer-survey:expired', {
                    actionOriginator: _.get(model, 'createdBy.user'),
                    accessRoleLevel: accessRoles.MASTER_ADMIN,
                    body: model.toJSON(),
                });

                cb(null, true);
            });
        },

    ], callback);
};
