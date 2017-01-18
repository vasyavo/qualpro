const async = require('async');
const _ = require('lodash');
const Bluebird = require('bluebird');
const config = require('./../../../config');
const FCM = require('./../../push-notifications/utils/fcm');
const SessionModel = require('./../../../types/session/model');
const logger = require('./../../../utils/logger');

const fcmClient = new FCM(config.fcmApiKey);

const sendPush = (groups, callback) => {
    const itRecipient = (action) => {
        return (recipient, itCallback) => {
            async.waterfall([

                (cb) => {
                    const userIdAsString = recipient.toString();
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
                        const readyPayload = Object.assign({}, action.payload, {
                            title: action.subject,
                        });

                        logger.info(`Firebase device ${deviceId} message payload:`, readyPayload);

                        fcmClient.send({
                            registration_ids: [deviceId],
                            data: readyPayload,
                            priority: 'high'
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

            ], itCallback);
        }
    };
    const itGroup = (group, itCallback) => {
        const {
            payload,
        } = group;
        const action = {
            subject: group.subject || {
                en: 'New activity',
                ar: '',
            },
            payload,
        };
        const recipients = group.recipients.filter(recipient => recipient);

        async.each(recipients, itRecipient(action), itCallback);
    };

    async.each(groups, itGroup, callback);
};

module.exports = Bluebird.promisify(sendPush);;
