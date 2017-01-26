const mongoose = require('mongoose');
const async = require('async');
const mongo = require('./utils/mongo');
const config = require('./config');
const logger = require('./utils/logger');
const PubNubClient = require('./stories/push-notifications/utils/pubnub');

mongoose.Schemas = {}; // important thing
require('./types');

const Scheduler = require('./helpers/scheduler');
const scheduler = new Scheduler();

mongo.on('connected', () => {
    logger.info('Master connected to MongoDB.');
});

// warning: be careful whit this glitch
if (config.isTest) {
    PubNubClient.init();
    scheduler.start();
} else {
    require('./modulesCreators')(() => {
        PubNubClient.init();
        scheduler.start();
    });
}
