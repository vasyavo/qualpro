const async = require('async');
const _ = require('lodash');
const ObjectiveModel = require('./../../../types/objective/model');
const FileModel = require('./../../../types/file/model');
const TestUtils = require('./../../test-utils');
const ActivityLog = require('./../../push-notifications/activityLog');

module.exports = (args, callback) => {
    const {
        objectiveId,
        visibilityFormId,
        setFileId,
        actionOriginator,
        accessRoleLevel,
    } = args;

    async.waterfall([

        (cb) => {
            const query = {
                _id: {
                    $in: setFileId,
                },
                isProcessing: false,
            };

            FileModel.find(query)
                .select('_id isProcessing')
                .lean()
                .exec(cb);
        },

        (files, cb) => {
            const isUploaded = files.length === setFileId.length;

            if (isUploaded) {
                return cb();
            }

            callback(null, false);
        },

        (cb) => {
            ObjectiveModel.findOne({
                _id: objectiveId,
            }).lean().exec(cb);
        },

        (objective, cb) => {
            if (TestUtils.isObjectiveDraft(objective)) {
                ActivityLog.emit('sub-objective:draft-created', {
                    originatorId: actionOriginator,
                    accessRoleLevel,
                    objective: objective.toJSON(),
                });
            }

            if (TestUtils.isObjectivePublished(objective)) {
                ActivityLog.emit('sub-objective:published', {
                    originatorId: actionOriginator,
                    accessRoleLevel,
                    objective: objective.toJSON(),
                });
            }

            cb(null, true);
        },

    ], callback);
};
