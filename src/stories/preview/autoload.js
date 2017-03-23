const async = require('async');
const logger = require('./../../utils/logger');
const defaultImageSrc = require('./../../constants/defaultImageSrc');
const collection = require('./collection');

const defaults = {};

const insertDefaults = (callback) => {
    const contentTypes = Object.keys(defaultImageSrc);

    async.each(contentTypes, (contentType, eachCb) => {
        async.waterfall([

            (cb) => {
                collection.findOne({
                    contentType,
                    isDefault: true,
                }, {
                    fields: {
                        _id: 1,
                    },
                }, cb);
            },

            (result, cb) => {
                if (result) {
                    const previewId = result._id;

                    defaults[contentType] = previewId;

                    logger.info(`Default preview for "${contentType}" is "${previewId}"`);
                    return eachCb(null);
                }

                collection.insertOne({
                    base64: defaultImageSrc[contentType],
                    contentType,
                    isDefault: true,
                }, cb);
            },

            (result, cb) => {
                const previewId = result.ops[0]._id;

                defaults[contentType] = previewId;

                logger.info(`Default preview for "${contentType}" inserted "${previewId}"`);
                cb(null);
            },

        ], eachCb);
    }, callback);
};

module.exports = {
    insertDefaults,
    defaults,
};
