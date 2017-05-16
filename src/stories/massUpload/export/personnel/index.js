const exportPersonnel = require('./methods/exportPersonnel');
const exportRole = require('./methods/exportRole');
const exportPosition = require('./methods/exportPosition');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        ROLE,
        POSITION,
        PERSONNEL
    }
} = require('../../../../constants/import');

module.exports = function* exporter() {
    let sheetOpts = [];

    // export roles
    try {
        const data = yield* exportRole();
        const opt = {
            data,
            sheetName: ROLE.sheetName,
            header   : ROLE.header,
            headerRow: ROLE.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export roles. Details: ${ex}`);
        throw ex;
    }

    // export positions
    try {
        const data = yield* exportPosition();
        const opt = {
            data,
            sheetName: POSITION.sheetName,
            header   : POSITION.header,
            headerRow: POSITION.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export position. Details: ${ex}`);
        throw ex;
    }


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
