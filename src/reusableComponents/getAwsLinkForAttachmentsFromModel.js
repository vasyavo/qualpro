const async = require('async');
const _ = require('lodash');
const FileHandler = require('../handlers/file');

const fileHandler = new FileHandler();

module.exports = (model, callback) => {
    if (!_.get(model, 'attachments')) {
        return callback(null, model || {});
    }

    async.each(model.attachments, function(file, cb) {
        file.url = fileHandler.computeUrl(file.name);
        cb();
    }, (err) => {
        if (err) {
            return callback(err);
        }

        callback(null, model);
    });
};
