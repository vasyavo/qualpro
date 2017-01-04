const ConsumerSurveyModel = require('../../../types/consumersSurvey/model');

module.exports = (args, docId, callback) => {
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
};
