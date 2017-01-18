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

                    SessionModel.find(search)
                        .lean()
                        .exec(cb);
                },

                (setRecord, cb) => {
                    async.each(setRecord, (record, eachCb) => {
                        let session;

                        try {
                            session = JSON.parse(record.session);
                        } catch (ex) {
                            logger.error('[push-service] Cannot parse session:', record);

                            return cb(null);
                        }

                        const deviceId = session.deviceId;

                        if (!deviceId) {
                            logger.error('[push-service] Device ID is undefined:', record);

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
                                logger.error(`[push-service:${deviceId}] Something went wrong in the end of request:`, record);

                                return null;
                            }

                            if (data.failure) {
                                const err = data.results.length ? data.results.pop() : {};
                                const isNotRegistered = err.error === 'NotRegistered';

                                if (isNotRegistered) {
                                    return SessionModel.remove({
                                        _id: record._id,
                                    }, (err) => {
                                        if (err) {
                                            logger.error('[push-service] Session cannot be removed:', record);

                                            return null;
                                        }

                                        logger.info(`[push-service] Session terminated:`, record);
                                    });
                                }

                                logger.error('[push-service] Default exception:', record);

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
