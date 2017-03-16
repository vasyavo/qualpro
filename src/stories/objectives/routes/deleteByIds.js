const async = require('async');
const ObjectiveModel = require('./../../../types/objective/model');

module.exports = (req, res, next) => {
    const setId = req.body.ids;

    const parallel = [];

    setId.forEach(id => {
        if (id.length === 24) {
            parallel.push((cb) => {
                ObjectiveModel.findByIdAndRemove(id, (error, result) => {
                    if (error) {
                        return cb(error);
                    }

                    return cb(null, result);
                });
            });
        }
    });

    if (setId.length !== parallel.length) {
        const error = new Error('Incorrect ID.');

        error.status = 400;
        return next(error);
    }

    async.parallel(parallel, (err, result) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(result);
    });
};
