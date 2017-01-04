const async = require('async');
const TaskSchedulerModel = require('../../types/taskScheduler/model');
const actions = require('./actions');

module.exports = (req, res, next) => {
    const schedulesId = req.body;

    if (!schedulesId || !schedulesId.length) {
        res.status(200).send([]);
    }

    async.waterfall([

        (cb) => {
            TaskSchedulerModel.find({
                scheduleId : {
                    $in : schedulesId
                }
            }, cb);
        },

        (docs, callback) => {
            async.map(docs, (doc, cb) => {
                const action = actions[doc.functionName];

                action(doc.args, doc.documentId, (err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, doc.scheduleId);
                });

            }, callback);
        }

    ], (err, processedSchedules) => {
        if (err) {
            return next(err);
        }

        if (!processedSchedules.length) {
            return res.status(200).send([]);
        }

        TaskSchedulerModel.remove({
            scheduleId : {
                $in : processedSchedules
            }
        }, (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(processedSchedules);
        });
    });
};

