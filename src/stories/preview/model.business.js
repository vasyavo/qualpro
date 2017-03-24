const async = require('async');
const PreviewModel = require('./model');

const setNewPreview = ({ model, base64, contentType }, callback) => {
    if (!base64) {
        return callback(null, model);
    }

    async.waterfall([
        (cb) => {
            PreviewModel.remove({
                itemId: model._id,
                contentType,
            }, cb);
        },
        (removeResult, cb) => {
            PreviewModel.create({
                itemId: model._id,
                base64,
                contentType,
            }, cb);
        },
        (result, cb) => {
            model.imageSrc = result._id;
            model.save(cb);
        },
    ], callback);
};

module.exports = {
    setNewPreview,
};
