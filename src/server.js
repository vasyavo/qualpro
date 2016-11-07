'use strict';

const http = require('http');
const async = require('async');
const eventEmitter = require('./utils/eventEmitter');
const config = require('./config');
const mongo = require('./utils/mongo');
const logger = require('./utils/logger');

require('mongoose').Schemas = {};

const Scheduler = require('./helpers/scheduler')(mongo, eventEmitter);

const app = require('./app');
const server = http.createServer(app);

const io = require('./helpers/socket')(server);

app.set('io', io);

mongo.on('connected', () => {
    require('./types');

    async.waterfall([

        (cb) => {
            require('./modulesCreators')(cb);
        },

        (creators, cb) => {
            server.listen(config.nodePort, cb);
        }

    ], () => {
        logger.info(`Server started at port ${config.nodePort} in ${config.env} environment:`, config);
    })
});

const scheduler = new Scheduler();

scheduler.initEveryHourScheduler();

require('./modulesCreators');

module.exports = server;
