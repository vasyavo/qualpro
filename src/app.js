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

Array.prototype.fromObjectID = function() {
    var _arrayOfID = [];

    for (var i = 0; i < this.length; i++) {
        if (this[i] && typeof this[i] === 'object' && this[i].hasOwnProperty('id')) {
            _arrayOfID.push(this[i].toString());
        } else {
            _arrayOfID.push(null);
        }
    }

    return _arrayOfID;
};

Array.prototype.objectID = function() {
    var _arrayOfID = [];
    var objectId = mongoose.Types.ObjectId;

    for (var i = 0; i < this.length; i++) {
        if (this[i] && typeof this[i] === 'object' && this[i].hasOwnProperty('_id')) {
            _arrayOfID.push(this[i]._id);
        } else {
            if (typeof this[i] === 'string' && this[i].length === 24) {
                _arrayOfID.push(objectId(this[i]));
            }
            if (this[i] === null || this[i] === 'null') {
                _arrayOfID.push(null);
            }

        }
    }

    return _arrayOfID;
};

Array.prototype.contains = function(predicate) {
    if (typeof predicate !== 'function') {
        return this.indexOf(predicate) !== -1;
    }

    return !!this.find(predicate);

};

Object.defineProperty(Object.prototype, 'getNestedProperty', {
    value: function(propertyName) {
        var result = this;
        var arr = propertyName.split('.');

        while (arr.length && result) {
            result = result[arr.shift()];
        }

        return result;
    },
    enumerable: false
});

Object.defineProperty(Object.prototype, 'setNestedProperty', {
    value: function(propertyName, propertyValue) {
        var result = this;
        var arr = propertyName.split('.');
        var arrEl;

        while (arr.length && result) {
            arrEl = arr.shift();
            if (arr.length) {
                if (!result[arrEl]) {
                    result[arrEl] = {};
                }
                result = result[arrEl];
            } else {
                result[arrEl] = propertyValue;
            }
        }

        return this;
    },
    enumerable: false
});

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
};

app.get('/info', require('./utils/isApiAvailable'));

require('./routes/index')(app, db, event);

module.exports = app;
