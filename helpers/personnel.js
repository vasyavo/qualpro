var PersonnelHelper = function (db, redis, app) {
    'use strict';
    var async = require('async');
    var mongoose = require('mongoose');
    var Pushes = require('../helpers/pushes');
    var pushes = new Pushes(db);
    var _ = require('lodash');
    var logWriter = require('../helpers/logWriter.js');

    this.sendObject = function (options, cb) {
        var message = 'onLeave';

        function getSocketsByUserId(id, callback) {

            redis.redisClient.keys('socket_Uid:' + id + ':*', function (err, value) {
                if (err) {
                    return callback(err, null);
                }
                callback(null, value);
            });
        };

        function createMySocket(sockets, callback) {
            var socketArray = [];
            var localSocketArray = [];
            /*pushes.sendPushes(options.coveredUserId, 'newActivity', {}, function (err, respond) {
                if (err) {
                    logWriter.log('personnel on leave', err);
                }
            });*/

            sockets.forEach(function (socket) {
                localSocketArray.push({
                    socketId: socket
                });
            });
            socketArray = _.concat(socketArray, localSocketArray);
            callback(null, socketArray);

        };

        function emitMessageToSocket(message, socketIds, callback) {
            async.each(socketIds, function (socket, eachCb) {
                app.get('io').to(socket.socketId.split(':')[2]).emit(message, {});
                eachCb(null);
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        };
        if (options.coveredUserId) {
            async.waterfall([async.apply(getSocketsByUserId, options.coveredUserId), createMySocket, async.apply(emitMessageToSocket, message)], function (err, result) {
                if (err) {
                    return logWriter.log('personnel on leave', err);
                }
            });
        }
        if (options.userOnLeave) {
            message = 'logOut';
            async.waterfall([async.apply(getSocketsByUserId, options.userOnLeave), createMySocket, async.apply(emitMessageToSocket, message)], function (err, result) {
                if (err) {
                    return logWriter.log('personnel on leave', err);
                }
            });
        }

    };
};

module.exports = PersonnelHelper;
