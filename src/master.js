const mongoose = require('mongoose');
const mongo = require('./utils/mongo');
const config = require('./config');
const logger = require('./utils/logger');
const spawnDefaults = require('./modulesCreators');
const PubNubClient = require('./stories/push-notifications/utils/pubnub');

mongoose.Schemas = mongoose.Schemas || {}; // important thing
require('./types');

const Scheduler = require('./stories/scheduler/cron');

const scheduler = new Scheduler();

mongo.on('connected', () => {
    logger.info('Master connected to MongoDB.');
});

// warning: be careful whit this glitch
if (config.isTest) {
    PubNubClient.init();
    scheduler.start();
} else {
    spawnDefaults(() => {
        PubNubClient.init();
        scheduler.start();
    });
}
