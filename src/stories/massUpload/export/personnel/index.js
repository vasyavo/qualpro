const exportPersonnel = require('./methods/exportPersonnel');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        PERSONNEL
    }
} = require('../../../../constants/import');

module.exports = function* exporter() {
    let sheetOpts = [];

    // export personnel
    try {
        const data = yield* exportPersonnel();
        const opt = {
            data,
            sheetName: PERSONNEL.sheetName,
            header   : PERSONNEL.header,
            headerRow: PERSONNEL.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export personnel. Details: ${ex}`);
        throw ex;
    }

    return {
        sheets: sheetOpts
    };
};
