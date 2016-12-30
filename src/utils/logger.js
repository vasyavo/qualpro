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
        }),
        // fixme change from MongodDB to S3
        // new (winston.transports.MongoDB)({
        //     db: config.mongodbUri,
        // }),
    ],
});

logger.inspect = (...args) => {
    const inspected = util.inspect(args, {showHidden: false, depth: null});

    console.log(inspected);
};

module.exports = logger;
