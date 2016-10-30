var Domain = function (db) {
    var async = require('async');
    var CurrencyModel = require('./../types/currency/model');

    this.getForDD = function (req, res, next) {
        CurrencyModel.find({}, '_id name').

            exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
    };

};
module.exports = Domain;