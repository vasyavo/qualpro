var mongoose = require('mongoose');
var async = require('async');
const config = require('./../config');
const FCM = require('./../stories/push-notifications/fcm');
const SessionModel = require('./../types/session/model');
const logger = require('./../utils/logger');

const fcmClient = new FCM(config.fcmApiKey);

module.exports = function (db) {
    'use strict';

    function sendPushesToUser(userId, alert, options, callback) {
        async.waterfall([
            function (waterfallCb) {
                var regExpArray = [];
                var search;

                regExpArray.push({session: {$regex: userId}});
                regExpArray.push({session: {$regex: 'deviceId'}});

                search = {
                    $and: regExpArray
                };
                SessionModel.find(search, function (err, sessions) {
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
                    const payloadOptions = options.payload || {};
                    const fcmOptions = {
                        icon: payloadOptions.badge,
                        sound: payloadOptions.sound,
                        title: payloadOptions.title,
                    };

                    fcmClient.send({
                        registration_ids: [device.deviceId],
                        data: alert,
                        notification: fcmOptions,
                    }, (err, data) => {
                        logger.info(`Push messaging client, error: ${err}, data: ${data}`);
                    });
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
