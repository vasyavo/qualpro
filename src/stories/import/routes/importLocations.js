const _ = require('lodash');
const path = require('path');
const fs = require('mz/fs');
const importLocation = require('../../massUpload/import/location');
const logger = require('../../../utils/logger');
const responseSender = require('../../../utils/errorSender');
const {ALLOWED_MIME} = require('../../../constants/import');

module.exports = function* importTactic(req, res, next) {
    const {
        file
    } = req;

    if (!file || !file.size) {
        return responseSender.badRequest(next, 'Source file is required');
    }

    if (!_.find(ALLOWED_MIME, (el) => (el.mime === file.mimetype))) {
        return responseSender.badRequest(next, `Invalid mime-type - ${file.mimetype}`);
    }

    const filePath = file.path;

    let data;
    try {
        data = yield* importLocation(filePath);
    } catch (ex) {
        logger.error(`Error to import location. Details: ${ex}`);
        return responseSender.badRequest(next, `Error occurs while importing. ${ex}`);
    }

    try {
        yield fs.unlink(filePath);
    } catch (ex) {
        logger.warn(`Error occurs while removing file: ${ex}`);
    }

    res.status(200).send(data);
};
