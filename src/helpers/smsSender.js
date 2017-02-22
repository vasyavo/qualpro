const twilio = require('twilio');
const handlebars = require('handlebars');
const config = require('./../config');
const logger = require('./../utils/logger');
const SMS_CONST = require('../constants/responses').SMS;

const {
    accountSid,
    authToken,
} = config.twilio;
const phoneNumber = config.twilio.number;

const client = new twilio.RestClient(accountSid, authToken);

const sendSMS = (message, cb) => {
    client.messages.create(message, (err, output) => {
        if (err) {
            logger.error(`{SMS Service} Message rejected ${message}, ${err.message} : ${err.moreInfo}`);

            return cb(err);
        }

        logger.info(`{SMS Service} Message sent: ${message}. Response: ${output}.`);

        cb(err, message);
    });
};

const forgotPassword = (options, res, cb) => {
    const resetCode = options.resetCode;
    const template = SMS_CONST.FORGOT_PASS;

    const body = handlebars.compile(template)({
        resetCode,
    });
    const message = {
        to: options.phoneNumber,
        from: phoneNumber,
        body,
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
        password,
    });
    const message = {
        to: options.phoneNumber,
        from: phoneNumber,
        body,
    };

    sendSMS(message, cb);
};

module.exports = {
    sendSMS,
    forgotPassword,
    sendNewPassword,
};
