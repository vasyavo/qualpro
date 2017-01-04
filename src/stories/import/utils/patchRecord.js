const async = require('async');

const patchRecord = (options, callback) => {
    const query = options.query;
    const patch = options.patch;
    const DatabaseModel = options.model;

    async.waterfall([

        (cb) => {
            DatabaseModel.findOne(query, cb);
        },

        (existingModel, cb) => {
            if (existingModel === null) {
                const databaseModel = new DatabaseModel();

                databaseModel.set(patch);
                return databaseModel.save((err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, databaseModel);
                });
            }

            existingModel.set(patch);
            existingModel.save((err) => {
                if (err) {
                    return cb(err);
                }

                cb(null, existingModel);
            });
        }

    ], callback);
};

module.exports = patchRecord;
