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

mongoose.Schemas = mongoose.Schemas || {}; // important thing

const config = require('./config');
const mongo = require('./utils/mongo');
const logger = require('./utils/logger');
const eventEmitter = require('./utils/eventEmitter');
const PubNubClient = require('./stories/push-notifications/utils/pubnub');

process.on('unhandledRejection', (reason, p) => {
    logger.error(p, reason);
});

process.on('uncaughtException', (error) => {
    logger.error(error);
});

const app = express();

const setCacheControl = (req, res, next) => {
    const browser = req.headers['user-agent'];

    if (/Trident/.test(browser) || /Edge/.test(browser)) {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    }

    next();
};

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
app.use(setCacheControl);
app.get('/info', require('./utils/isApiAvailable'));

require('./routes/index')(app, mongo, eventEmitter);

const server = http.createServer(app);
const io = require('./helpers/socket')({
    server,
});

app.set('io', io);
PubNubClient.init();

server.listen(config.port, () => {
    logger.info(`Server started at port ${config.port} in ${config.env} environment:`, config);
});

module.exports = app;
