const exportBranch = require('./methods/exportBranch');
const exportDomain = require('./methods/exportDomain');
const exportOutlet = require('./methods/exportOutlet');
const exportRetailSegment = require('./methods/exportRetailSegment');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        LOCATION,
        RETAIL_SEGMENT,
        OUTLET,
        BRANCH
    }
} = require('../../../../constants/import');

module.exports = function* exporter() {
    let sheetOpts = [];

    // export domains
    try {
        const data = yield* exportDomain();
        const opt = {
            data,
            sheetName: LOCATION.sheetName,
            header   : LOCATION.header,
            headerRow: LOCATION.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export domains. Details: ${ex}`);
        throw ex;
    }

    // export retailSegment
    try {
        const data = yield* exportRetailSegment();
        const opt = {
            data,
            sheetName: RETAIL_SEGMENT.sheetName,
            header   : RETAIL_SEGMENT.header,
            headerRow: RETAIL_SEGMENT.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export retail segments. Details: ${ex}`);
        throw ex;
    }

    // export outlet
    try {
        const data = yield* exportOutlet();
        const opt = {
            data,
            sheetName: OUTLET.sheetName,
            header   : OUTLET.header,
            headerRow: OUTLET.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export outlets. Details: ${ex}`);
        throw ex;
    }


    // export branch
    try {
        const data = yield* exportBranch();
        const opt = {
            data,
            sheetName: BRANCH.sheetName,
            header   : BRANCH.header,
            headerRow: BRANCH.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export branches. Details: ${ex}`);
        throw ex;
    }

    return {
        sheets: sheetOpts
    };
};
