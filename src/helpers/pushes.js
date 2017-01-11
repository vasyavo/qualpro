var mongoose = require('mongoose');
var async = require('async');
const config = require('./../config');
const FCM = require('./../stories/push-notifications/utils/fcm');
const SessionModel = require('./../types/session/model');
const logger = require('./../utils/logger');

const fcmClient = new FCM(config.fcmApiKey);

module.exports = function() {
    function sendPushesToUser(userId, payload, callback) {
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

                    logger.info(`Firebase device ${deviceId} message payload:`, payload);

                    fcmClient.send({
                        to: deviceId,
                        data: payload
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

    this.sendPushes = (userId, payload, callback) => {
        const payloadWithTitle = Object.assign({}, payload, {
            title: {
                en: 'New activity',
                ar: '',
            },
        });

        sendPushesToUser(userId, payloadWithTitle, callback);
    };
};
