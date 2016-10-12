var mongoose = require('mongoose');
var async = require('async');
var CONSTANTS = require('../constants/mainConstants');
var key = CONSTANTS.GSM_API_KEY;
var googlePusher = require('../helpers/gcm')(key);

module.exports = function (db) {
    'use strict';

    var Session = db.model('session', mongoose.Schemas['session']);

    function sendPushesToUser(userId, alert, options, callback) {
        var sendPushToProvider = googlePusher;
        async.waterfall([
            function (waterfallCb) {
                var regExpArray = [];
                var search;

                regExpArray.push({session: {$regex: userId}});
                regExpArray.push({session: {$regex: 'deviceId'}});

                search = {
                    $and: regExpArray
                };
                Session.find(search, function (err, sessions) {
                    var i;
                    var devices = [];
                    var sessionObject;

                    if (err) {
                        return waterfallCb(err);
                    }

                    for (i = sessions.length - 1; i >= 0; i--) {
                        sessionObject = JSON.parse(sessions[i].session);
                        if (sessionObject.deviceId) {
                            devices.push({deviceId: sessionObject.deviceId});
                        }
                    }
                    waterfallCb(null, devices);
                });

            },

            function (devices, waterfallCb) {
                if (!devices) {

                    return waterfallCb(null);
                }

                async.each(devices, function (device, eachCb) {

                    sendPushToProvider.sendPush(device.deviceId, alert, options);
                    eachCb(null);
                }, function (err) {
                    if (err) {

                        return waterfallCb(err);
                    }

                    waterfallCb(null);
                });
            }
        ], function (err) {
            if (err) {

                return callback(err);
            }

            callback(null);
        });
    }


    this.sendPushes = function (userId, type, options, callback) {
        var alert;
        switch (type) {
            case 'newActivity':
                alert = {
                    title: 'New activity'
                };
                sendPushesToUser(userId, alert, {payload: options}, callback);
                break;
            default:
                alert = {
                    title: 'New activity'
                };
                sendPushesToUser(userId, alert, {payload: options}, callback);
                break;
        }

    };

};
