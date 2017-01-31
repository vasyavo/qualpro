const async = require('async');
const _ = require('lodash');
const logger = require('./../../../utils/logger');
const ObjectiveModel = require('./../../../types/objective/model');
const FileModel = require('./../../../types/file/model');
const TestUtils = require('./../../push-notifications/utils/TestUtils');
const ActivityLog = require('./../../push-notifications/activityLog');

const getObjectiveContext = (objective) => {
    return objective.context === 'objectives' ? 'objective' : 'in-store-task';
};

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

            const arrayOfParentObjectiveId = _(objective.parent)
                .values()
                .compact()
                .value();

            if (TestUtils.isObjectiveDraft(objective)) {
                if (arrayOfParentObjectiveId.length) {
                    ActivityLog.emit('sub-objective:draft-created', {
                        actionOriginator,
                        accessRoleLevel,
                        body: objective,
                    });
                } else {
                    ActivityLog.emit(`${getObjectiveContext(objective)}:draft-created`, {
                        actionOriginator,
                        accessRoleLevel,
                        body: objective,
                    });
                }
            }

            if (TestUtils.isObjectivePublished(objective)) {
                if (arrayOfParentObjectiveId.length) {
                    ActivityLog.emit('sub-objective:published', {
                        actionOriginator,
                        accessRoleLevel,
                        body: objective,
                    });
                } else {
                    ActivityLog.emit(`${getObjectiveContext(objective)}:published`, {
                        actionOriginator,
                        accessRoleLevel,
                        body: objective,
                    });
                }
            }
        },

    ], callback);
};
