var NotoficationHelper = function (db, redis, app) {
    'use strict';
    var async = require('async');
    var mongoose = require('mongoose');
    var Pushes = require('../helpers/pushes');
    var pushes = new Pushes(db);
    var _ = require('lodash');
    var logWriter = require('../helpers/logWriter.js');
    this.sendObject = function (options, cb) {
        var message = 'notificationCountChange';
        var io = app.get('io');
        var activeSockets = Object.keys(io.sockets.sockets);
        var parallelTasks = [];

        function getSocketsByUserId(userId, waterfallCb) {
            redis.redisClient.keys('socket_Uid:' + userId + ':*', function (err, value) {
                if (err) {
                    return waterfallCb(err, null);
                }
                waterfallCb(null, value, userId);
            });
        }

        function createMySocket(sockets, userId, waterfallCb) {
            var socketArray = [];
            var localSocketArray = [];

            sockets.forEach(function (socket) {
                localSocketArray.push(socket.split(':')[2]);
            });
            socketArray = _.concat(socketArray, localSocketArray);
            if (socketArray.length) {
                socketArray = _.filter(socketArray, function (socket) {
                    return activeSockets.indexOf(socket) !== -1;
                });
            }

            waterfallCb(null, socketArray, userId);
        }

        function getValueFromRedis(socketIds, userId, waterfallCb) {
            var key = options.itemKey + '#' + userId;

            redis.cacheStore.readFromStorage(key, function (err, value) {
                var valueJSON;

                if (err) {
                    return waterfallCb(err);
                }

                valueJSON = value ? JSON.parse(value) : 0;

                waterfallCb(null, socketIds, valueJSON);
            });
        }

        function emitMessageToSocket(socketIds, value, waterfallCb) {
            async.each(socketIds, function (socket, eachCb) {

                io.to(socket).emit(message, {count: value});

                eachCb(null);
            }, function (err) {
                if (err) {
                    return waterfallCb(err);
                }
                waterfallCb(null);
            });
        }

        function createParallelTask(id) {
            var userId = id;

            return function parallelForSendSocket(parallelCb) {
                async.waterfall([
                    async.apply(getSocketsByUserId, userId),
                    createMySocket,
                    getValueFromRedis,
                    emitMessageToSocket
                ], function (err, result) {
                    if (err) {
                        parallelCb(err);
                    }
                });
            };
        }

        options.itemIds.forEach(function (id) {
            parallelTasks.push(createParallelTask(id));
        });

        async.parallel(parallelTasks, function (err, results) {
            if (err) {
                return logWriter.log('notification count', err);
            }
        });
    };
};

module.exports = NotoficationHelper;
