const exportCountry = require('./methods/exportCountry');
const exportOrigin = require('./methods/exportOrigin');
const exportCategory = require('./methods/exportCategory');
const exportVariant = require('./methods/exportVariant');
const exportItem = require('./methods/exportItem');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        COUNTRY,
        ORIGIN,
        CATEGORY,
        VARIANT,
        ITEM
    }
} = require('../../../../constants/import');

module.exports = function* exporter() {
    let sheetOpts = [];

    // export country
    try {
        const data = yield* exportCountry();
        const opt = {
            data,
            sheetName: COUNTRY.sheetName,
            header   : COUNTRY.header,
            headerRow: COUNTRY.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export countries. Details: ${ex}`);
        throw ex;
    }

    // export origin
    try {
        const data = yield* exportOrigin();
        const opt = {
            data,
            sheetName: ORIGIN.sheetName,
            header   : ORIGIN.header,
            headerRow: ORIGIN.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export origins. Details: ${ex}`);
        throw ex;
    }

    // export category
    try {
        const data = yield* exportCategory();
        const opt = {
            data,
            sheetName: CATEGORY.sheetName,
            header   : CATEGORY.header,
            headerRow: CATEGORY.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export categories. Details: ${ex}`);
        throw ex;
    }

    // export variant
    try {
        const data = yield* exportVariant();
        const opt = {
            data,
            sheetName: VARIANT.sheetName,
            header   : VARIANT.header,
            headerRow: VARIANT.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export variant. Details: ${ex}`);
        throw ex;
    }

    // export competitor item
    try {
        const data = yield* exportItem();
        const opt = {
            data,
            sheetName: ITEM.sheetName,
            header   : ITEM.header,
            headerRow: ITEM.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export items. Details: ${ex}`);
        throw ex;
    }

    return {
        sheets: sheetOpts
    };
};
