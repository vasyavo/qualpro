'use strict';

const http = require('http');
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

server.listen(config.nodePort, () => {
    logger.info(`Server started at port ${config.nodePort} in ${config.env} environment:`, config);
});

mongo.on('connected', () => {
    require('./types');
});

const scheduler = new Scheduler();

scheduler.initEveryHourScheduler();

module.exports = server;
