const winston = require('winston');

winston.cli();

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            json: false,
            handleExceptions: true,
            humanReadableUnhandledException: true,
        }),
    ],
});

module.exports = logger;
