var GetImagesHelper = function (db, redis, app) {
    'use strict';
    var mongoose = require('mongoose');
    var async = require('async');
    var _ = require('lodash');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var schemas = mongoose.Schemas;

    this.getImages = function (options, cb) {
        var data = options.data;
        var modelNames = Object.keys(data);
        var schemaModelName;
        var models = {};
        var parallelTasks = {};
        var $defProjectionImages = {
            imageSrc: 1,
            preview : 1
        };
        if (modelNames && modelNames.length) {
            modelNames.forEach(function (key) {
                schemaModelName = key;
                models[key] = db.model(schemaModelName, schemas[schemaModelName]);
            });
        }


        function gen(Model, name) {
            return function (parallelCb) {
                var pipeLine = [];
                pipeLine.push({
                    $match: {
                        _id: {$in: data[name]}
                    }
                });

                pipeLine.push({
                    $project: $defProjectionImages
                });

                Model.aggregate(pipeLine, function (err, result) {
                    if (err) {
                        return parallelCb(err);
                    }

                    return parallelCb(null, result);
                });
            };
        }

        for (var key in models) {
            parallelTasks[key] = gen(models[key], key);
        }

        async.parallel(parallelTasks, function (err, result) {
            if (err) {
                return cb(err);
            }
            return cb(null, result);
        });
    };

    this.setIntoResult = function (options, cb) {
        var response = options.response || [];
        var fields = options.fields;
        var result = options.imgsObject;
        var keys = Object.keys(fields);
        var mapObject = [];
        var isArray = false;
        var hasData = false;
        var resultToSend = {};
        var total;


        if (!response || !fields || !result) {
            return false;
        }

        function getImageById(key, field) {
            var imgSrcObject = _.find(result[key], {_id: field._id});
            if (imgSrcObject && [CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.DOMAIN, CONTENT_TYPES.OUTLET, CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH].indexOf(key) !== -1) {
                field.imageSrc = imgSrcObject.imageSrc;
            } else if (imgSrcObject && [CONTENT_TYPES.FILES, CONTENT_TYPES.DOCUMENTS].indexOf(key) !== -1) {
                field.preview = imgSrcObject.preview;
            }
            return field;
        }

        function findAndSet(key, name, element, array) {
            var strArray = name.split('.');
            var length = strArray.length;

            switch (length) {
                case 0:
                    return element;
                    break;

                case 1:
                    if (!element[strArray[0]] || array && !element[strArray[0]].length) {
                        return element;
                    }
                    if (!array) {
                        element[strArray[0]] = getImageById(key, element[strArray[0]]);
                        return element;
                    }

                    element[strArray[0]] = _.map(element[strArray[0]], function (el) {
                        return getImageById(key, el);
                    });
                    return element;
                    break;

                case 2:
                    if (!element[strArray[0]] || array && !element[strArray[0]].length) {
                        return element;
                    }
                    if (!array) {
                        element[strArray[0]][strArray[1]] = getImageById(key, element[strArray[0]][strArray[1]]);
                        return element;
                    }

                    element[strArray[0]][strArray[1]] = _.map(element[strArray[0]], function (el) {
                        return getImageById(key, el[strArray[1]]);
                    });
                    return element;
                    break;

                case 3:
                    if (!element[strArray[0]] || array && !element[strArray[0]].length) {
                        return element;
                    }
                    if (!array) {
                        element[strArray[0]][strArray[1]][strArray[2]] = getImageById(key, element[strArray[0]][strArray[1]][strArray[2]]);
                        return element;
                    }

                    element[strArray[0]][strArray[1]] = _.map(element[strArray[0]], function (el) {
                        return getImageById(key, el[strArray[1]][strArray[2]]);
                    });
                    return element;
                    break;

                default:
                    return element;
                    break;
            }
        }

        if (Array.isArray(response)) {
            mapObject = response;
            isArray = true;
        } else if (response.data) {
            mapObject = response.data;
            hasData = true;
            total = response.total;
        } else {
            mapObject.push(response);
        }

        keys.forEach(function (key) {
            if (!fields[key].length) {
                mapObject = _.map(mapObject, function (element) {
                    return getImageById(key, element);
                });
            } else {
                fields[key].forEach(function (name) {
                    mapObject = _.map(mapObject, function (model) {
                        if (typeof name === 'string') {
                            return findAndSet(key, name, model);
                        } else if (Array.isArray(name)) {
                            return findAndSet(key, name[0], model, true);
                        }
                    });
                });
            }
        });

        if (isArray) {
            resultToSend = mapObject;
        } else if (hasData) {
            resultToSend.data = mapObject;
            resultToSend.total = total;
        } else {
            resultToSend = mapObject[0];
        }

        return cb(resultToSend);
    };
};

module.exports = GetImagesHelper;
