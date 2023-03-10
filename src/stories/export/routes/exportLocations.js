const moment = require('moment');
const generateSheet = require('../../massUpload/export/utils/generateSheet');
const getGenerationOptions = require('../../massUpload/export/location');
const responseSender = require('../../../utils/errorSender');

module.exports = function* exportLocation(req, res, next) {
    let options;
    try {
        options = yield* getGenerationOptions();
    } catch (ex) {
        return responseSender.badRequest(next, 'Error to export locations');
    }

    const data = generateSheet(options);
    const fileName = `locations-${moment().format('DD-MM-YYYY_HHmmss')}.xlsx`;
    res.writeHead(200, {
        'Content-Type'       : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-disposition': `attachment;filename=${fileName}`,
        'Content-Length'     : data.length
    });
    res.end(data);
};
