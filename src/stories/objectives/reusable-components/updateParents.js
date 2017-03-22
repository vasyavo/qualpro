const async = require('async');
const _ = require('lodash');
const logger = require('./../../../utils/logger');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');
const ObjectiveModel = require('./../../../types/objective/model');

const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

module.exports = (objective, callback) => {
    const updateParentObjective = (id, cb) => {
        async.waterfall([

            (cb) => {
                ObjectiveModel.findById(id, (err, parentObjective) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!parentObjective) {
                        const error = new Error('Parent objective not found.');

                        error.status = 400;
                        return cb(error);
                    }

                    cb(null, parentObjective);
                });
            },

            (parentObjective, cb) => {
                const parentModelLevel = parseInt(parentObjective.level, 10);
                const query = {
                    level: parentModelLevel + 1,
                    [`parent.${parentModelLevel}`]: parentObjective._id,
                };

                ObjectiveModel.find(query, (err, children) => {
                    const actualStatus = parentObjective.status;
                    const countSubTasks = children.filter(child => child.status !== 'draft').length;
                    const completedSubTasks = children.filter(child => child.status === 'completed').length;
                    const complete = Math.floor((completedSubTasks * 100) / countSubTasks);
                    const changes = {
                        countSubTasks,
                        completedSubTasks,
                        complete,
                    };

                    if (complete >= 100 && actualStatus === OBJECTIVE_STATUSES.RE_OPENED) {
                        changes.status = OBJECTIVE_STATUSES.CLOSED;
                    }

                    if (complete < 100 && actualStatus === OBJECTIVE_STATUSES.CLOSED) {
                        changes.status = OBJECTIVE_STATUSES.RE_OPENED;
                    }

                    parentObjective.set(changes);

                    cb(null, parentObjective);
                });
            },

        ], (err, parentObjective) => {
            if (err) {
                return cb(err);
            }

            parentObjective.save((err) => {
                if (err) {
                    return cb(err);
                }

                cb(null);
            });
        });
    };

    const series = [];
    const objectiveAsJson = _.assignIn({}, objective.toObject());
    const level = objectiveAsJson.level;
    const setParentObjective = objectiveAsJson.parent;

    for (let i = level - 1; i >= 1; i--) {
        const nextParent = setParentObjective[i];

        if (nextParent) {
            series.push((cb) => {
                updateParentObjective(nextParent, cb);
            });
        }
    }

    async.series(series, (err) => {
        if (err) {
            logger.error(err);
            return;
        }
    });

    callback(null, objective);
};
