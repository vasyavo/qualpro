const winston = require('winston');
const config = require('./../../config');

require('winston-mongodb');

const logger = new (winston.Logger)({
    transports: config.isTest ? [] : [
        new (winston.transports.Console)({
            colorize: true,
            json: true,
            handleExceptions: true,
            humanReadableUnhandledException: true,
        }),
        new (winston.transports.MongoDB)({
            db: config.mongodbUri,
        }),
    ],
});

module.exports = logger;
