const util = require('util');
const winston = require('winston');
const config = require('./../config');

require('winston-mongodb');

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            json: false,
            handleExceptions: true,
            humanReadableUnhandledException: true,
        })
    ],
});

logger.inspect = (...args) => {
    const inspected = util.inspect(args, {showHidden: false, depth: null});

    console.log(inspected);
};

module.exports = logger;
