const mongoose = require('mongoose');
const async = require('async');

mongoose.Schemas = {};
require('./../../utils/mongo');

const importDomain = require('./types/domain');
const importOutlet = require('./types/outlet');
const importRetailSegment = require('./types/retailSegment');
const importBranch = require('./types/branch');

const importAccessRole = require('./types/accessRole');
const importPosition = require('./types/position');
const importPersonnel = require('./types/personnel');

const PreviewAutoload = require('./../preview/autoload');

const logger = require('./../../utils/logger');

async.series([

    PreviewAutoload.insertDefaults,

    importDomain,
    importOutlet,
    importRetailSegment,
    importBranch,

    importAccessRole,
    importPosition,
    importPersonnel,

], (err) => {
    if (err) {
        logger.error('Something went wrong...', err);
        process.exit(1);
    }

    logger.info('Data imported successfully');
    process.exit(0);
});
