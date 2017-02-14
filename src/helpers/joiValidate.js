'use strict';

var async = require('async');
var _ = require('lodash');
var Joi = require('joi');

var schemasByRole = require('../constants/schemasByRole');

function getSchemaByAccessRole(level, contentType, method, callback) {
    var path = [contentType, level, method].join('.');
    var schema = _.get(schemasByRole, path);
    var err;

    if (!schema) {
        err = new Error();
        err.status = 400;

        return callback(err);
    }

    callback(null, schema);
}

function validate(body, schema, callback) {
    Joi.validate(body, schema, {
        allowUnknown: true,
        abortEarly  : false,
        convert     : true
    }, callback);
}

function joiValidate(body, level, contentType, method, callback) {
    async.waterfall([
        async.apply(getSchemaByAccessRole, level, contentType, method),
        async.apply(validate, body)
    ], function(err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    })
}

module.exports = joiValidate;
