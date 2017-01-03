const mongoose = require('mongoose');

mongoose.Schemas = {};
require('./../../utils/mongo');

const importOrigin = require('./types/origin');
const logger = require('./../../utils/logger');

importOrigin((err) => {
    if (err) {
        logger.error('Import of "Origin" failed.');
        process.exit(1);
    }

    logger.info('Import of "Origin" done.');
    process.exit(0);
});
