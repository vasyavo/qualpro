const event = require('./utils/eventEmitter');
const db = require('./utils/mongo');

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const consolidate = require('consolidate');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();

const allowCrossDomain = (req, res, next) => {
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

app.use(morgan('dev'));
app.use(bodyParser.json({
    strict: false,
    limit: '300kb'
}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '300kb'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(allowCrossDomain);
app.use(require('./utils/sessionMiddleware'));
app.use(cookieParser('CRMkey'));

require('./utils/polyfills');

app.get('/info', require('./utils/isApiAvailable'));

require('./routes/index')(app, db, event);

module.exports = app;
