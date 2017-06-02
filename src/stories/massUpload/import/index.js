const path = require('path');
const co = require('co');
const logger = require('../../../utils/logger');
const config = require('../../../config');
const importLocations = require('./location');
const importPersonnels = require('./personnel');
const importCompetitorItems = require('./competitorItem');
const importItems = require('./item');

function* importAllGen() {
    logger.info('---------------------------- IMPORT STARTED --------------------------------');
    const pathPrefix = path.join(config.workingDirectory, 'src/stories/massUpload/source/');

    // location
    try {
        const filePath = path.join(pathPrefix, 'locations.xlsx');
        const data = yield* importLocations(filePath);

        logger.info(`LOCATION: Imported ${data.totalImported} items; ${data.totalErrors} errors occurred.`);
    } catch (ex) {
        logger.error(`LOCATION: Error occurs while importing. Details: ${ex}`);
        return;
    }

    // personnel
    try {
        const filePath = path.join(pathPrefix, 'personnels.xlsx');
        const data = yield* importPersonnels(filePath);

        logger.info(`PERSONNEL: Imported ${data.totalImported} items; ${data.totalErrors} errors occurred.`);
    } catch (ex) {
        logger.error(`PERSONNEL: Error occurs while importing. Details: ${ex}`);
        return;
    }

    // competitor items
    try {
        const filePath = path.join(pathPrefix, 'competitor-items.xlsx');
        const data = yield* importCompetitorItems(filePath);

        logger.info(`COMPETITOR_ITEMS: Imported ${data.totalImported} items; ${data.totalErrors} errors occurred.`);
    } catch (ex) {
        logger.error(`COMPETITOR_ITEMS: Error occurs while importing. Details: ${ex}`);
        return;
    }

    // items
    try {
        const filePath = path.join(pathPrefix, 'items.xlsx');
        const data = yield* importItems(filePath);

        logger.info(`ITEMS: Imported ${data.totalImported} items; ${data.totalErrors} errors occurred.`);
    } catch (ex) {
        logger.error(`ITEMS: Error occurs while importing. Details: ${ex}`);
        return;
    }

    logger.info('---------------------------- IMPORT FINISHED --------------------------------');
}

function importAll() {
    return co(importAllGen);
}

module.exports = {
    importAll,
    importDataFromXLSX: importAllGen
};
