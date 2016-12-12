const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const CONTENT_TYPES = require('../public/js/constants/contentType.js');
const mongo = require('./../utils/mongo');

var GetImagesHelper = function() {
    this.getImages = (options, cb) => {
        const data = options.data;
        const modelNames = Object.keys(data);
        const models = {};
        const parallelTasks = {};
        const $defProjectionImages = {
            imageSrc: 1,
            preview : 1
        };

        if (modelNames && modelNames.length) {
            modelNames.forEach((key) => {
                models[key] = require('./../types')[key];
            });
        }


        function getWhereIdIn(model, name) {
            return (cb) => {
                const pipeLine = [{
                    $match: {
                        _id: {
                            $in: data[name]
                        }
                    }
                }, {
                    $project: $defProjectionImages
                }];

                model.aggregate(pipeLine, cb);
            };
        }

        for (let key in models) {
            const model = models[key];

            parallelTasks[key] = getWhereIdIn(model, key);
        }

        async.parallel(parallelTasks, cb);
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
            const imgSrcObject = _.find(result[key], { _id: field._id });

            if (imgSrcObject && [
                CONTENT_TYPES.PERSONNEL,
                CONTENT_TYPES.DOMAIN,
                CONTENT_TYPES.OUTLET,
                CONTENT_TYPES.RETAILSEGMENT,
                CONTENT_TYPES.BRANCH
            ].indexOf(key) !== -1) {
                field.imageSrc = imgSrcObject.imageSrc;
            } else if (imgSrcObject && [
                CONTENT_TYPES.FILES,
                CONTENT_TYPES.DOCUMENTS
            ].indexOf(key) !== -1) {
                field.preview = imgSrcObject.preview;
            }
            return field;
        }

        function findAndSet(key, name, element, array) {
            const strArray = name.split('.');
            const length = strArray.length;

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

                    element[strArray[0]] = element[strArray[0]].map((item) => {
                        return getImageById(key, item);
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

                    element[strArray[0]][strArray[1]] = element[strArray[0]].map((item) => {
                        return getImageById(key, item[strArray[1]]);
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

                    element[strArray[0]][strArray[1]] = element[strArray[0]].map((item) => {
                        const field = item[strArray[1]][strArray[2]];

                        if (field) {
                            return getImageById(key, field);
                        }

                        return item;
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

        keys.forEach((key) => {
            if (!fields[key].length) {
                mapObject = mapObject.map((field) => {
                    return getImageById(key, field);
                });

                return null;
            }

            fields[key].forEach((name) => {
                mapObject = mapObject.map((model) => {
                    if (_.isString(name)) {
                        return findAndSet(key, name, model);
                    } else if (Array.isArray(name)) {
                        return findAndSet(key, name[0], model, true);
                    }
                });
            });
        });

        if (isArray) {
            resultToSend = mapObject;
        } else if (hasData) {
            resultToSend.data = mapObject;
            resultToSend.total = total;
        } else {
            resultToSend = mapObject[0];
        }

        // fixme incorrect error callback format, should be: return cb(null, data);
        return cb(resultToSend);
    };
};

module.exports = GetImagesHelper;
