const mongoose = require('mongoose');

mongoose.Schemas = {};
require('./../../utils/mongo');

const importOrigin = require('./types/origin');
const importItem = require('./types/item');
const logger = require('./../../utils/logger');

importItem((err, data) => {
    if (err) {
        logger.error('Import failed.');
        process.exit(1);
    }

    logger.info('Import done.');
    process.exit(0);
});
