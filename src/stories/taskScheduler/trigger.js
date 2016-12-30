const async = require('async');
const TaskSchedulerModel = require('../../types/taskScheduler/model');
const ConsumerSurveyModel = require('../../types/consumersSurvey/model');

const actions = {
    setConsumerSurveyStatusCompleted : (args, docId, callback) => {
        const status = 'completed';

        async.waterfall([

            (cb) => {
                ConsumerSurveyModel.findById(docId, (err, model) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!model) {
                        return cb(true);
                    }

                    cb(null, model);
                });
            },

            (model, cb) => {
                model.status = status;

                model.save((err, model, numAffected) => {
                    //tip: do not remove numAffected
                    cb(err, model);
                });
            }

        ], callback);
    },

    setConsumerSurveyStatusActive : (args, docId, callback) => {
        const status = 'active';

        async.waterfall([

            (cb) => {
                ConsumerSurveyModel.findById(docId, (err, model) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!model) {
                        return cb(true);
                    }

                    cb(null, model);
                });
            },

            (model, cb) => {
                model.status = status;

                model.save((err, model, numAffected) => {
                    //tip: do not remove numAffected
                    cb(err, model);
                });
            }

        ], callback);
    }
};

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

