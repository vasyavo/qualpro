const async = require('async');
const CONTENT_TYPES = require('../../public/js/constants/contentType');
const TaskSchedulerModel = require('../../types/taskScheduler/model');
const models = require('../../types/index');
const logger = require('../../utils/logger');

const actions = {
    changeStatusOfConsumerSurvey : (status, docId) => {
        const ConsumerSurveyModel = models[CONTENT_TYPES.CONSUMER_SURVEY];

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

                model.save(cb);
            }

        ], (err) => {
            if (err) {
                logger.error(err);

                return false;
            }

            return true;
        });
    }
};

module.exports = (req, res, next) => {
    const schedulesId = req.body;

    if (!schedulesId || !schedulesId.length) {
        res.status(200).send({});
    }

    const processedSchedules = [];

    async.waterfall([

        (cb) => {
            TaskSchedulerModel.find({
                scheduleId : {
                    $in : schedulesId
                }
            }, cb);
        },

        (docs, callback) => {
            if (!docs) {
                return res.status(200).send(processedSchedules);
            }

            async.each(docs, (doc, cb) => {
                const action = actions[doc.functionName];

                const processed = action(...doc.args, doc.documentId);

                if (!processed) {
                    return cb(true);
                }

                processedSchedules.push(doc.scheduleId);

                cb(null);
            }, callback);
        }

    ], (err) => {
        if (err) {
            logger.error(err);
        }

        res.status(200).send(processedSchedules);
    });
};

