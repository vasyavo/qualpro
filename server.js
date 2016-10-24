'use strict';

var http = require('http');
var Events = require('events');
var event = new Events.EventEmitter();
const config = require('./config');
const mongo = require('./src/utils/mongo');
const logger = require('./src/utils/logger');
const Scheduler = require('./helpers/scheduler')(mongo, event);
const wsServer = require('./helpers/socket');

mongo.once('open', () => {
    logger.info('Current configurations:', config);

    const scheduler = new Scheduler();

    require('./models/index.js');

    const app = require('./app')(mongo, event);
    const httpServer = http.createServer(app);
    const io = wsServer(httpServer, app);

    app.set('io', io);
    httpServer.listen(config.nodePort, () => {
        logger.info(`Server started at port ${config.nodePort} in ${config.env} environment`);
    });

    scheduler.initEveryHourScheduler();
});
