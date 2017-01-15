const async = require('async');
const _ = require('lodash');
const logger = require('./../../utils/logger');
const config = require('./../../config');
const circuitRequest = require('./request').circuitRequest;
const SchedulerModel = require('./model');
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
            SchedulerModel.find({
                scheduleId: {
                    $in: arrayOfDelayedId
                }
            }).lean().exec(cb);
        },

        // execute action per task
        // and diff not existed
        (arrayOfRegistered, cb) => {
            logger.info(`[abstract-scheduler:${requestId}] Registered tasks:`, arrayOfRegistered);

            async.waterfall([

                (cb) => {
                    async.map(arrayOfRegistered, (task, mapCb) => {
                        const actionType = task.functionName;
                        const documentId = task.documentId;
                        const scheduleId = task.scheduleId.toString();
                        const action = actions[actionType];

                        const callback = (err, isProcessed) => {
                            if (err) {
                                return mapCb(err);
                            }

                            if (isProcessed) {
                                return mapCb(null, scheduleId);
                            }

                            return mapCb(null);
                        };

                        if (documentId) {
                            return action(task.args, documentId, callback);
                        }

                        logger.info(`[abstract-scheduler:${requestId}/${scheduleId}]:`, task.args);

                        action(task.args, callback);
                    }, (err, setProcessedId) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, {
                            arrayOfRegistered,
                            setProcessedId,
                        })
                    });
                },

                // registered array contains lean documents
                // processed array contains ObjectId
                (options, cb) => {
                    const setProcessedId = _.compact(options.setProcessedId);
                    const setIgnoredId = _.difference(arrayOfDelayedId, arrayOfRegistered);
                    const setToBeReleasedId = _.union(setIgnoredId, []);

                    cb(null, {
                        processed: setProcessedId,
                        released: setToBeReleasedId,
                        ignored: setIgnoredId,
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
                logger.info(`[abstract-scheduler:${requestId}] Released:`, released);

                SchedulerModel.remove({
                    scheduleId: {
                        $in: conclusion.released,
                    },
                }, cb);

            },

            // unregister task in scheduler
            unregisterRequest: (cb) => {
                logger.info(`[abstract-scheduler:${requestId}] Ignored:`, ignored);

                circuitRequest({
                    method: 'DELETE',
                    url: `${config.schedulerHost}/tasks`,
                    json: {
                        data: ignored,
                    }
                }, cb);
            },

        });
    });
};

