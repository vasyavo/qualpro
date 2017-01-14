const async = require('async');
const ConsumerSurveyModel = require('../../../types/consumersSurvey/model');

module.exports = (args, docId, callback) => {
    const status = 'completed';

    async.waterfall([

        (cb) => {
            ConsumerSurveyModel.findById(docId, cb);
        },

        (model, cb) => {
            if (!model) {
                return cb(null);
            }

            model.status = status;

            model.save((err, model, numAffected) => {
                //tip: do not remove numAffected
                cb(err, model);
            });
        }

    ], callback);
};
