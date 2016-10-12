'use strict';

var http = require('http');
var Events = require('events');
var event = new Events.EventEmitter();
const configs = require('./config');
const mongo = require('./src/utils/mongo');
const logger = require('./src/utils/logger');
const Scheduler = require('./helpers/scheduler')(mongo, event);

mongo.once('open', () => {
	const instance = parseInt(process.env.NODE_APP_INSTANCE, 10) || 0;
    let port = parseInt(process.env.PORT) || 443;
    const scheduler = new Scheduler();

	port += instance;

    require('./models/index.js');

    const app = require('./app')(mongo, event);
    const httpServer = http.createServer(app);
    const io = require('./helpers/socket')(httpServer, app);

    app.set('io', io);
    httpServer.listen(port, () => {
        logger.info(`Server started at port ${port} in ${configs.env} environment`);
    });

    scheduler.initEveryHourScheduler();
});
