const twilio = require('twilio');
const handlebars = require('handlebars');
const config = require('./../config');
const logger = require('./../utils/logger');
const accountSid = config.twilio.accountSid;
const authToken = config.twilio.authToken;
const phoneNumber = config.twilio.number;

const SMS_CONST = require('../constants/responses').SMS;
const client = new twilio.RestClient(accountSid, authToken);

const sendSMS = (message, cb) => {
    client.messages.create(message, (err, message) => {
        if (err) {
            logger.error(`Message wasn't sent. ${err.message} : ${err.moreInfo}`);
        } else {
            logger.info(`SMS sent. SID: ${message.sid}. Message sent on: ${message.dateCreated}`);
        }

        cb(err, message);
    });
};

const forgotPassword = (options, res, cb) => {
    const resetCode = options.resetCode;
    const template = SMS_CONST.FORGOT_PASS;

    const body = handlebars.compile(template)({
        resetCode
    });
    const message = {
        to: options.phoneNumber,
        from: phoneNumber,
        body: body
    };

    sendSMS(message, cb);
};

const sendNewPassword = (options, cb) => {
    const currentLanguage = options.language ? options.language : 'en';

    const url = `${config.localhost}/personnel/confirm/${options.token}`;
    const password = options.password;

    const template = SMS_CONST.NEW_PASSWORD[currentLanguage];
    const body = handlebars.compile(template)({
        url,
        password
    });
    const message = {
        to: options.phoneNumber,
        from: phoneNumber,
        body: body
    };

    sendSMS(message, cb);
};

module.exports = {
    sendSMS,
    forgotPassword,
    sendNewPassword
};
