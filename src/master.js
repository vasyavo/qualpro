const mongoose = require('mongoose');
const async = require('async');
const mongo = require('./utils/mongo');
const config = require('./config');
const logger = require('./utils/logger');
const RedisClient = require('./helpers/redisClient').redisClient;
const PubNubClient = require('./stories/push-notifications/utils/pubnub');

mongoose.Schemas = {}; // important thing
require('./types');

const Scheduler = require('./helpers/scheduler');
const scheduler = new Scheduler();

async.series([

    (cb) => {
        RedisClient.once('ready', () => {
            logger.info('Master connected to Redis.');
            cb();
        });
    },

    (cb) => {
        mongo.on('connected', () => {
            logger.info('Master connected to MongoDB.');
            cb();
        });
    },

    (cb) => {
        require('./modulesCreators')(cb);
    },

], () => {
    PubNubClient.init();
    scheduler.start();
});
