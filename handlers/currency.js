var Domain = function (db) {
    var async = require('async');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var modelAndSchemaName = CONTENT_TYPES.CURRENCY;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);

    this.getForDD = function (req, res, next) {
        Model.find({}, '_id name').

            exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
    };

};
module.exports = Domain;