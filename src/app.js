'use strict';

const event = require('./utils/eventEmitter');
const db = require('./utils/mongo');

var path = require('path');
var express = require('express');
var Session = require('express-session');
var session;
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var consolidate = require('consolidate');
var mongoose = require('mongoose');

var server;

var app = express();

var logWriter = require('./helpers/logWriter');

var MemoryStore = require('connect-mongo')(Session);
var configs = require('./config');

var sessionConfig = configs.sessionConfig(db);

var allowCrossDomain = function(req, res, next) {
    const browser = req.headers['user-agent'];

    if (/Trident/.test(browser) || /Edge/.test(browser)) {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    }

    req.isMobile = /mobile/i.test(browser);

    next();
};

app.engine('html', consolidate.swig);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(logger('dev'));
app.use(bodyParser.json({ strict: false, /*inflate: false,*/ limit: 1024 * 1024 * 200 }));
app.use(bodyParser.urlencoded({ extended: false, limit: 1024 * 1024 * 200 }));
app.use(cookieParser("CRMkey"));
app.use(express.static(path.join(__dirname, 'public')));

app.use(allowCrossDomain);

session = Session({
    name: 'qualPro_main',
    key: 'qualPro_main',
    secret: 'gE7FkGtEdF32d4f6h8j0jge4547hTThGFyJHPkJkjkGH7JUUIkj0HKh',
    resave: false,

    cookie: {
        maxAge: 365 * 24 * 60 * 60 * 1000 // One year
        /* secure: true */
    },

    rolling: true,
    saveUninitialized: true,
    store: new MemoryStore(sessionConfig)
});

app.use(session);

require('./utils/polyfills');

app.get('/info', require('./utils/isApiAvailable'));

require('./routes/index')(app, db, event);

module.exports = app;
