'use strict';
const config = require('./../config');
const logger = require('./../utils/logger');
const redis = require('redis');
const client = redis.createClient(config.redisUrl);

client.on('error', (err) => {
    logger.error('Redis fails', err);
});

client.on('ready', () => {
    logger.info('Redis is ready');
});

function CacheStore() {

    function writeToStorage(key, value, exTime) {
        if (exTime) {
            client.setex([key, exTime, value]);

        } else {
            client.set([key, value]);

        }
    }

    function incrementAndGet(key, callback) {
        client.incr(key, callback);

    }

    function readFromStorage(key, callback) {
        client.get(key, function (err, value) {
            if (err) {
                callback(err);
            } else {
                callback(null, value);
            }
        });
    }

    function removeFromStorage(key) {
        client.del(key, redis.print);
    }

    return {
        incrementAndGet  : incrementAndGet,
        writeToStorage   : writeToStorage,
        removeFromStorage: removeFromStorage,
        readFromStorage  : readFromStorage
    };
}

const cacheStore = new CacheStore();

module.exports = {
    redisClient: client,
    cacheStore
};
