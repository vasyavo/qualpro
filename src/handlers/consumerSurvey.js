'use strict';

var ContactUs = function(db, redis, event) {
    var async = require('async');
    var _ = require('lodash');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Types.ObjectId;
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ContactUsModel = require('./../types/contactUs/model');
    var ConsumerSurveyModel = require('./../types/origin/model');
    var joiValidate = require('../helpers/joiValidate');

    this.create = function(req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var model;
            var fileId;

            function uploadFile(callback) {
                if (!files) {
                    return callback();
                }

                fileHandler.uploadFile(body.createdBy, files, CONTENT_TYPES.CONTACT_US, function(err, filesIds) {
                    if (err) {
                        return callback(err);
                    }

                    fileId = filesIds[0];

                    callback();
                });
            }

            function saveContactUs(callback) {
                body.attachments = fileId;

                model = new ContactUsModel(body);
                model.save(callback);
            }

            async.series([
                uploadFile,
                saveContactUs
            ], function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });
        }

        var body;
        var error;


        try {
            if (req.body.data) {
                body = JSON.parse(req.body.data);
            } else {
                body = req.body;
            }
        } catch (err) {
            return next(err);
        }

        body.createdBy = req.session.uId;

        joiValidate(body, req.session.level, CONTENT_TYPES.CONSUMER_SURVEY, 'create', function(err, saveData) {
            if (err) {
                error = new Error();
                error.status = 400;
                error.message = err.name;
                error.details = err.details;

                return next(error);
            }

            queryRun(saveData);
        });
    };
};

module.exports = ContactUs;
