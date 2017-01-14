const async = require('async');
const _ = require('lodash');
const logger = require('./../../utils/logger');
const releaseSchedulerTask = require('./../../services/request').del;
const TaskSchedulerModel = require('../../types/taskScheduler/model');
const actions = require('./actions');

module.exports = (req, res, next) => {
    const arrayOfDelayedId = req.body;
    const requestId = req.id;

    if (!arrayOfDelayedId || !arrayOfDelayedId.length) {
        return res.status(200).send([]);
    }

    logger.info(`[abstract-scheduler:${requestId}] Received delayed tasks:`, arrayOfDelayedId);

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
            logger.info(`[abstract-scheduler:${requestId}] Registered tasks:`, arrayOfRegistered);

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
                (setProcessedId, cb) => {
                    const setIgnoredId = _.difference(arrayOfDelayedId, setProcessedId);
                    const setToBeReleasedId = _.union(setIgnoredId, setProcessedId);

                    cb(null, {
                        processed: setProcessedId,
                        ignored: setIgnoredId,
                        released: setToBeReleasedId,
                    });
                }

            ], cb);
        }

    ], (err, conclusion) => {
        if (err) {
            return next(err);
        }
        const {
            processed,
            released,
            ignored,
        } = conclusion;

        async.parallel({

            // send processed tasks
            processedRequest: (cb) => {
                logger.info(`[abstract-scheduler:${requestId}] Processed:`, processed);

                res.status(200).send(processed);
                cb();
            },

            // remove ignored and processed tasks from store
            cleanupStore: (cb) => {
                logger.info(`[abstract-scheduler:${requestId}] Processed:`, released);

                TaskSchedulerModel.remove({
                    scheduleId: {
                        $in: conclusion.released,
                    },
                }, cb);

            },

            // unregister task in scheduler
            unregisterRequest: (cb) => {
                logger.info(`[abstract-scheduler:${requestId}] Ignored:`, released);

                releaseSchedulerTask({
                    json: {
                        data: conclusion.ignored,
                    },
                }, cb);
            },

        });
    });
};

