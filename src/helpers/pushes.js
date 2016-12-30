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
                const userIdAsString = userId.toString();
                const search = {
                    $and: [{
                        session: {$regex: userIdAsString},
                    }, {
                        session: {$regex: 'deviceId'},
                    }]
                };

                SessionModel.find(search, function (err, sessions) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    const devices = [];

                    for (let i = sessions.length - 1; i >= 0; i--) {
                        const sessionObject = JSON.parse(sessions[i].session);

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
                    const deviceId = device.deviceId;
                    const payloadOptions = options.payload || {};
                    const pushData = Object.assign({}, payloadOptions, alert);

                    logger.info(`Firebase device ${deviceId} message payload:`, pushData);

                    fcmClient.send({
                        to: deviceId,
                        data: pushData
                    }, (err, data) => {
                        if (err) {
                            logger.error('Firebase returns', err);
                            return null;
                        }

                        logger.info('Firebase response data:', data);
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
