const async = require('async');
const config = require('./../../../config');
const FCM = require('./../../push-notifications/utils/fcm');
const SessionModel = require('./../../../types/session/model');
const logger = require('./../../../utils/logger');

const fcmClient = new FCM(config.fcmApiKey);

const sendPush = (options, callback) => {
    const {
        userId,
        data,
    } = options;

    async.waterfall([

        (cb) => {
            const userIdAsString = userId.toString();
            const search = {
                $and: [{
                    session: {
                        $regex: userIdAsString,
                    },
                }, {
                    session: {
                        $regex: 'deviceId',
                    },
                }],
            };

            SessionModel.find(search, (err, sessions) => {
                if (err) {
                    return cb(err);
                }
                const arrayOfDeviceId = sessions.map((sessionAsString) => {
                    const sessionAsObject = JSON.parse(sessionAsString.session);

                    if (sessionAsObject.deviceId) {
                        return sessionAsObject.deviceId;
                    }

                }).filter(item => item);

                cb(null, arrayOfDeviceId);
            });

        },

        (arrayOfDeviceId, cb) => {
            async.each(arrayOfDeviceId, (deviceId, eachCb) => {
                const readyData = Object.assign({}, data, {
                    title: 'New activity',
                });

                logger.info(`Firebase device ${deviceId} message payload:`, readyData);

                fcmClient.send({
                    registration_ids: [deviceId],
                    data: readyData,
                    priority: 'high',
                    notification: {
                        title: readyData.title,
                    },
                }, (err, data) => {
                    if (err) {
                        logger.error('Firebase returns', err);
                        return null;
                    }

                    logger.info('Firebase response data:', data);
                });
                eachCb(null);
            }, cb);
        },

    ], callback);
};

module.exports = (options) => {
    return new Promise((resolve, reject) => {
        sendPush(options, (err, data) => {
            if (err) {
                return reject(err);
            }

            resolve(data);
        })
    });
};
