const exportCountry = require('../item/methods/exportCountry');
const exportOrigin = require('../item/methods/exportOrigin');
const exportCategory = require('../item/methods/exportCategory');
const exportBrand = require('./methods/exportBrand');
const exportCompetitorVariant = require('./methods/exportCompetitorVariant');
const exportCompetitorItem = require('./methods/exportCompetitorItem');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        COUNTRY,
        ORIGIN,
        BRAND,
        CATEGORY,
        COMPETITOR_VARIANT,
        COMPETITOR_ITEM
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

    // export brand
    try {
        const data = yield* exportBrand();
        const opt = {
            data,
            sheetName: BRAND.sheetName,
            header   : BRAND.header,
            headerRow: BRAND.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export brands. Details: ${ex}`);
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

    // export competitor variant
    try {
        const data = yield* exportCompetitorVariant();
        const opt = {
            data,
            sheetName: COMPETITOR_VARIANT.sheetName,
            header   : COMPETITOR_VARIANT.header,
            headerRow: COMPETITOR_VARIANT.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export competitor variant. Details: ${ex}`);
        throw ex;
    }

    // export competitor item
    try {
        const data = yield* exportCompetitorItem();
        const opt = {
            data,
            sheetName: COMPETITOR_ITEM.sheetName,
            header   : COMPETITOR_ITEM.header,
            headerRow: COMPETITOR_ITEM.headerRow
        };

        sheetOpts.push(opt);
    } catch (ex) {
        logger.error(`Error to export competitor items. Details: ${ex}`);
        throw ex;
    }

    return {
        sheets: sheetOpts
    };
};
