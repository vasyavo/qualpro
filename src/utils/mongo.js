const Mongoose = require('mongoose');
const Bluebird = require('bluebird');
const config = require('./../config');
const logger = require('./logger');

Mongoose.Promise = Bluebird;
const dbUri = config.mongodbUri;

Mongoose.connect(dbUri);

// When successfully connected
Mongoose.connection.on('connected', () => {
    logger.info(`Mongoose default connection open to ${dbUri}`);
});

// If the connection throws an error
Mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose default connection error: ${dbUri}`, err);
});

// When the connection is disconnected
Mongoose.connection.on('disconnected', () => {
    logger.error('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
    Mongoose.connection.close(() => {
        logger.info('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

module.exports = Mongoose.connection;
