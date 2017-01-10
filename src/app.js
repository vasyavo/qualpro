require('./utils/polyfills');

const http = require('http');
const async = require('async');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const consolidate = require('consolidate');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const compress = require('compression');
const forky = require('forky');

mongoose.Schemas = {}; // important thing

const config = require('./config');
const mongo = require('./utils/mongo');
const logger = require('./utils/logger');
const eventEmitter = require('./utils/eventEmitter');
const MessageDispatcher = require('./stories/push-notifications/utils/messageDispatcher');

process.on('unhandledRejection', (reason, p) => {
    logger.error(p, reason);
});

process.on('uncaughtException', (error) => {
    logger.error(error);
    forky.disconnect();
});

const app = express();

app.use(compress());
app.engine('html', consolidate.swig);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(morgan('dev'));
app.use(bodyParser.json({
    strict: false,
    limit: '10mb',
}));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(require('./utils/sessionMiddleware'));
app.use(cookieParser('CRMkey'));
app.get('/info', require('./utils/isApiAvailable'));
require('./routes/index')(app, mongo, eventEmitter);

const node = http.createServer(app);
const io = require('./helpers/socket')(node);

app.set('io', io);
MessageDispatcher.setIo(io);

node.listen(config.port, () => {
    logger.info(`Server started at port ${config.port} in ${config.env} environment:`, config);
});

mongo.on('connected', () => {
    async.series([

        (cb) => {
            require('./types');

            if (config.isMaster) {
                return require('./modulesCreators')(cb);
            }

            cb(null);
        },

    ])
});

if (config.isMaster) {
    const Scheduler = require('./helpers/scheduler')(mongo, eventEmitter);
    const scheduler = new Scheduler();
    scheduler.initEveryHourScheduler();
}

module.exports = app;
