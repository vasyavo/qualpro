const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const config = require('./../config');
const logger = require('./logger');
const mongo = require('./mongo');

module.exports = session({
    name: 'qualPro_main',
    key: 'qualPro_main',
    secret: 'gE7FkGtEdF32d4f6h8j0jge4547hTThGFyJHPkJkjkGH7JUUIkj0HKh',
    cookie: {
        maxAge: 365 * 24 * 60 * 60 * 1000, // One year
        httpOnly: true,
        secure: false,
    },
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
        url: config.redisUrl,
        db: config.redisSessionDb
    })
});
