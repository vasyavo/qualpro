const path = require('path');
const co = require('co');
const logger = require('../../../utils/logger');
const config = require('../../../config');
const importLocations = require('./location');

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

    logger.info('---------------------------- IMPORT FINISHED --------------------------------');
}

function importAll() {
    return co(importAllGen);
}

module.exports = {
    importAll,
    importDataFromXLSX: importAllGen
};
