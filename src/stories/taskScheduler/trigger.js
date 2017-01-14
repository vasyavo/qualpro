const async = require('async');
const _ = require('lodash');
const logger = require('./../../utils/logger');
const releaseSchedulerTask = require('./../../services/request').del;
const TaskSchedulerModel = require('../../types/taskScheduler/model');
const actions = require('./actions');

module.exports = (req, res, next) => {
    const arrayOfDelayedId = req.body;

    if (!arrayOfDelayedId || !arrayOfDelayedId.length) {
        return res.status(200).send([]);
    }

    async.waterfall([

        // find available tasks
        (cb) => {
            TaskSchedulerModel.find({
                scheduleId : {
                    $in : arrayOfDelayedId
                }
            }).lean().exec(cb);
        },

        // execute action per task
        // and diff not existed
        (arrayOfRegistered, cb) => {
            async.waterfall([

                (cb) => {
                    async.map(arrayOfRegistered, (task, cb) => {
                        const actionType = task.functionName;
                        const taskId = task.documentId;
                        const scheduleId = task.scheduleId.toString();
                        const action = actions[actionType];

                        action(task.args, taskId, (err) => {
                            if (err) {
                                return cb(err);
                            }

                            cb(null, scheduleId);
                        });

                    }, cb);
                },

                // registered array contains lean documents
                // processed array contains ObjectId
                (arrayOfProcessedId, cb) => {
                    const arrayOfIgnoredId = _.difference(arrayOfDelayedId, arrayOfProcessedId);
                    const arrayOfToBeReleasedId = _.union(arrayOfIgnoredId, arrayOfProcessedId);

                    cb(null, {
                        processed: arrayOfProcessedId,
                        ignored: arrayOfIgnoredId,
                        released: arrayOfToBeReleasedId,
                    });
                }

            ], cb);
        }

    ], (err, conclusion) => {
        if (err) {
            return next(err);
        }

        async.parallel({

            // send processed tasks
            processedRequest: (cb) => {
                res.status(200).send(conclusion.processed);
                cb();
            },

            // remove ignored and processed tasks from store
            cleanupStore: (cb) => {
                TaskSchedulerModel.remove({
                    scheduleId: {
                        $in: conclusion.released,
                    },
                }, cb);

            },

            // unregister task in scheduler
            unregisterRequest: (cb) => {
                releaseSchedulerTask({
                    json: {
                        data: conclusion.ignored,
                    },
                }, cb);
            },

        });
    });
};

