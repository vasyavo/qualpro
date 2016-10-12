module.exports = function (db, event) {
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

    var allowCrossDomain = function (req, res, next) {

        var allowedHost = [
            '185.2.100.192:8088',
            'localhost:8088',
            '192.168.88.13:8088'
        ];
        var browser = req.headers['user-agent'];

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
    app.use(bodyParser.json({strict: false, /*inflate: false,*/ limit: 1024 * 1024 * 200}));
    app.use(bodyParser.urlencoded({extended: false, limit: 1024 * 1024 * 200}));
    app.use(cookieParser("CRMkey"));
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(allowCrossDomain);

    session = Session({
        name  : 'qualPro_main',
        key   : 'qualPro_main',
        secret: 'gE7FkGtEdF32d4f6h8j0jge4547hTThGFyJHPkJkjkGH7JUUIkj0HKh',
        resave: false,

        cookie: {
            maxAge: 365 * 24 * 60 * 60 * 1000 // One year
            /* secure: true */
        },

        rolling          : true,
        saveUninitialized: true,
        store            : new MemoryStore(sessionConfig)
    });

    app.use(session);

    Array.prototype.fromObjectID = function () {
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

    Array.prototype.objectID = function () {
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

    if (!Array.prototype.find) {
        Array.prototype.find = function (predicate) {
            var value;
            var thisArg;
            var length;
            var list;
            var i;

            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            list = Object(this);
            length = list.length >>> 0;
            thisArg = arguments[1];

            for (i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }

    Array.prototype.contains = function (predicate) {
        if (typeof predicate !== 'function') {
            return this.indexOf(predicate) !== -1;
        }

        return !!this.find(predicate);

    };

    Object.defineProperty(Object.prototype, 'getNestedProperty', {
        value     : function (propertyName) {
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
        value     : function (propertyName, propertyValue) {
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

    Date.prototype.addDays = function (days) {
        this.setDate(this.getDate() + parseInt(days));
        return this;
    };

    require('./routes/index')(app, db, event);

    return app;
};