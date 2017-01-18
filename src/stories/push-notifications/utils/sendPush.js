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

                    SessionModel.find(search, cb);
                },

                (setRecord, cb) => {
                    async.each(setRecord, (record, eachCb) => {
                        const recordAsJson = record.toJSON();

                        let session;

                        try {
                            session = JSON.parse(record.session);
                        } catch (ex) {
                            logger.error('[push-service] Cannot parse session:', recordAsJson);

                            return cb(null);
                        }

                        const deviceId = session.deviceId;

                        if (!deviceId) {
                            logger.error('[push-service] Device ID is undefined:', recordAsJson);

                            return cb(null);
                        }

                        const readyPayload = Object.assign({}, action.payload, {
                            title: action.subject,
                        });

                        logger.info(`[push-service:${deviceId}] Message payload:`, readyPayload);

                        eachCb(null);

                        fcmClient.send({
                            registration_ids: [deviceId],
                            data: readyPayload,
                            priority: 'high'
                        }, (err, data) => {
                            if (err) {
                                logger.error(`[push-service:${deviceId}] Something went wrong in the end of request:`, recordAsJson);

                                return null;
                            }

                            if (data.failure) {
                                const err = data.errors.length ? data.errors.pop() : {};
                                const isNotRegistered = err.error === 'NotRegistered';

                                if (isNotRegistered) {
                                    return record.remove((err) => {
                                        if (err) {
                                            logger.error('[push-service] Session cannot be removed:', recordAsJson);

                                            return null;
                                        }

                                        logger.info(`[push-service] Session terminated:`, recordAsJson);
                                    });
                                }

                                logger.error('[push-service] Default exception:', recordAsJson);

                                return null;
                            }

                            logger.info(`[push-service:${deviceId}] Response data:`, data);
                        });
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
