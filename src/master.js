const mongoose = require('mongoose');
const async = require('async');
const mongo = require('./utils/mongo');
const logger = require('./utils/logger');
const PubNubClient = require('./stories/push-notifications/utils/pubnub');

mongoose.Schemas = {}; // important thing
require('./types');

const Scheduler = require('./helpers/scheduler');
const scheduler = new Scheduler();

mongo.on('connected', () => {
    logger.info('Master connected to MongoDB.');
});

async.series([

    (cb) => {
        require('./modulesCreators')(cb);
    },

], () => {
    PubNubClient.init();
    scheduler.start();
});
