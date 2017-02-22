const redis = require('redis');
const config = require('./../config');
const logger = require('./../utils/logger');

const client = redis.createClient(config.redisUrl);

client.on('error', (err) => {
    logger.error('{Redis} Connection pruned.', err);
});

client.on('connect', () => {
    logger.info('{Redis} Connection established.');
});

client.on('reconnecting', () => {
    logger.info('{Redis} Reconnecting...');
});

module.exports = client;
