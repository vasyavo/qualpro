const async = require('async');
const _ = require('lodash');
const logger = require('./../../utils/logger');
const config = require('./../../config');
const circuitRequest = require('./request').circuitRequest;
const SchedulerModel = require('./model');
const actions = require('./actions');

module.exports = (req, res, next) => {
    const setDelayedId = req.body;
    const requestId = req.id;

    if (!setDelayedId || !setDelayedId.length) {
        return res.status(200).send([]);
    }

    logger.info(`[abstract-scheduler:${requestId}] Received delayed tasks:`, setDelayedId);

    async.waterfall([

        // find available tasks
        (cb) => {
            SchedulerModel.find({
                scheduleId: {
                    $in: setDelayedId
                }
            }).lean().exec(cb);
        },

        // execute action per task
        // and diff not existed
        (setRegistered, cb) => {
            const setRegisteredId = setRegistered.map(task => task.scheduleId.toString());

            logger.info(`[abstract-scheduler:${requestId}] Registered tasks:`, setRegisteredId);

            async.waterfall([

                (cb) => {
                    async.map(setRegistered, (task, mapCb) => {
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
                    }, cb);
                },

                // registered array contains lean documents
                // processed array contains ObjectId
                (setProcessedId, cb) => {
                    const setIgnoredId = _.difference(setDelayedId, setRegisteredId);

                    cb(null, {
                        processed: setProcessedId,
                        released: _.union(setProcessedId, setIgnoredId),
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
                        $in: released,
                    },
                }, cb);

            },

            // unregister task in scheduler
            unregisterRequest: (cb) => {
                logger.info(`[abstract-scheduler:${requestId}] Ignored:`, released);

                circuitRequest({
                    method: 'DELETE',
                    url: `${config.schedulerHost}/tasks`,
                    json: {
                        data: released,
                    }
                }, cb);
            },

        });
    });
};

