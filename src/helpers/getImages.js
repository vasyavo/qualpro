const async = require('async');
const _ = require('lodash');
const CONTENT_TYPES = require('../public/js/constants/contentType');
const PreviewModel = require('./../types/preview/model');
const defaultImageSrc = require('./../constants/defaultImageSrc');
const toString = require('./../utils/toString');

class ImageHelper {

    getImages(options, cb) {
        const data = options.data;
        const modelNames = Object.keys(data);
        const models = {};

        if (modelNames && !modelNames.length) {
            return cb(null, {});
        }

        const setPreview = [
            CONTENT_TYPES.PERSONNEL,
            CONTENT_TYPES.DOMAIN,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.BRAND,
        ];
        const isPreview = (contentType) => {
            return setPreview.indexOf(contentType) !== -1;
        };

        modelNames.forEach((contentType) => {
            if (isPreview(contentType)) {
                models[contentType] = PreviewModel;
            } else {
                models[contentType] = require('./../types')[contentType];
            }
        });

        const getWhereIdIn = (model, contentType) => {
            return (cb) => {
                const pipeline = [{
                    $match: {
                        _id: {
                            $in: data[contentType],
                        },
                    },
                }, {
                    $project: {
                        imageSrc: 1,
                        preview: 1,
                    },
                }];

                model.aggregate(pipeline, cb);
            };
        };
        const getPreviewWhereIdIn = (contentType) => {
            return (cb) => {
                const $in = data[contentType].filter(id => id);

                const pipeline = [{
                    $match: {
                        itemId: {
                            $in,
                        },
                    },
                }, {
                    // local ID should be replaced with item ID
                    // as they're will be set into result
                    $project: {
                        _id: '$itemId',
                        imageSrc: '$base64',
                    },
                }];

                async.waterfall([

                    (cb) => {
                        PreviewModel.aggregate(pipeline, cb);
                    },

                    (result, cb) => {
                        // in order to set default imageSrc
                        if (result.length < $in.length) {
                            const setInboundId = $in.map(objectId => objectId.toString());
                            const setIdInResult = result.map(preview => toString(preview, '_id'));
                            const resultDefaults = _.difference(setInboundId, setIdInResult)
                                .map(id => ({
                                    _id: id,
                                    imageSrc: defaultImageSrc[contentType],
                                }));
                            const setOutboundData = [...result, ...resultDefaults];

                            return cb(null, setOutboundData);
                        }

                        cb(null, result);
                    },

                ], cb);
            };
        };

        const stack = {};

        for (const contentType in models) {
            const model = models[contentType];

            if (isPreview(contentType)) {
                stack[contentType] = getPreviewWhereIdIn(contentType);
            } else {
                stack[contentType] = getWhereIdIn(model, contentType);
            }
        }

        async.parallel(stack, cb);
    }

    setIntoResult(options, cb) {
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
            const imgSrcObject = _.find(result[key], (elem) => {
               return elem._id && field._id && elem._id.toString() === field._id.toString()
            });

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
                    if (!element[strArray[0]] || (array && !element[strArray[0]].length)) {
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
    }

    getImagesPromise(options) {
        return new Promise((resolve) => {
            this.getImages(options, (result) => {
                resolve(result);
            });
        });
    }

    setIntoResultPromise(options) {
        return new Promise((resolve) => {
            this.setIntoResult(options, (result) => {
                resolve(result);
            });
        });
    }

};

module.exports = ImageHelper;
