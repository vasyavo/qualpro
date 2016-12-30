const async = require('async');
const CONTENT_TYPES = require('../../public/js/constants/contentType');
const TaskSchedulerModel = require('../../types/taskScheduler/model');
const models = require('../../types/index');

const actions = {
    changeStatusOfConsumerSurvey : (args, docId, callback) => {
        const ConsumerSurveyModel = models[CONTENT_TYPES.CONSUMER_SURVEY];
        const status = args.slice(0).pop();

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

