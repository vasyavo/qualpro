module.exports = function () {
    'use strict';
    var config = {
        db  : 7,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.SOCKET_DB_PORT, 10) || 6379
    };
    var redis = require('redis');
    var client;
    if (global.client) {
        client = global.client;
    } else {
        client = redis.createClient(config.port, config.host, {});
        global.client = client;

        client.select(config.db, function (err) {
            if (err) {
                throw new Error(err);
            } else {
                console.log('----Selected Redis DB With index = ' + config.db);
            }
        });

        client.on('error', function (err) {
            console.log('Error ' + err);
        });

        client.on('ready', function () {
            console.log('Redis server  is now ready to accept connections on port ' + config.port);
        });
    }

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

    return {
        redisClient: client,
        cacheStore : new CacheStore()
    };
};
