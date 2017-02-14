const async = require('async');
const logger = require('./../../../utils/logger');
const ObjectiveModel = require('./../../../types/objective/model');
const FileModel = require('./../../../types/file/model');
const TestUtils = require('./../../push-notifications/utils/TestUtils');
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
            if (!objective) {
                logger.info(`Ignoring objective ${objectiveId}`);

                return cb(null, false);
            }

            cb(null, true);

            const isSubObjective = TestUtils.isSubObjective(objective);
            const eventContext = TestUtils.getObjectiveEventContext(objective);

            if (TestUtils.isObjectiveDraft(objective)) {
                if (isSubObjective) {
                    ActivityLog.emit('sub-objective:draft-created', {
                        actionOriginator,
                        accessRoleLevel,
                        body: objective,
                    });
                } else {
                    ActivityLog.emit(`${eventContext}:draft-created`, {
                        actionOriginator,
                        accessRoleLevel,
                        body: objective,
                    });
                }
            }

            if (TestUtils.isObjectivePublished(objective)) {
                if (isSubObjective) {
                    ActivityLog.emit('sub-objective:published', {
                        actionOriginator,
                        accessRoleLevel,
                        body: objective,
                    });
                } else {
                    ActivityLog.emit(`${eventContext}:published`, {
                        actionOriginator,
                        accessRoleLevel,
                        body: objective,
                    });
                }
            }
        },

    ], callback);
};
