const _ = require('lodash');
const path = require('path');
const fs = require('mz/fs');
const importPersonnel = require('../../massUpload/import/personnel');
const logger = require('../../../utils/logger');
const responseSender = require('../../../utils/errorSender');
const publishImportResult = require('../utils/publishImportResult');
const {ALLOWED_MIME} = require('../../../constants/import');

module.exports = function* importTactic(req, res, next) {
    const {
        file,
        query: {
            channel
        }
    } = req;

    if (!channel) {
        return responseSender.badRequest(next, 'Please specify chanel to subscribe');
    }

    if (!file || !file.size) {
        return responseSender.badRequest(next, 'Source file is required');
    }

    if (!_.find(ALLOWED_MIME, (el) => (el.mime === file.mimetype))) {
        return responseSender.badRequest(next, `Invalid mime-type - ${file.mimetype}`);
    }

    res.status(200).send({success: 'Ok'});

    const filePath = file.path;

    let data;
    try {
        data = yield* importPersonnel(filePath);
    } catch (ex) {
        logger.error(`Error to import personnel. Details: ${ex}`);
        data = {
            rootError: `Error occurs while importing. ${ex}`,
        }
    }

    try {
        yield fs.unlink(filePath);
    } catch (ex) {
        logger.warn(`Error occurs while removing file: ${ex}`);
    }

    publishImportResult(channel, data);
};
