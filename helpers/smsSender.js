module.exports = function () {
    var TWILIO_ACCOUNT_SID = process.env.SMS_ACCOUNT_SID;
    var TWILIO_AUTH_TOKEN = process.env.SMS_AUTH_TOKEN;
    var TWILIO_NUMBER = process.env.SMS_NUMBER;

    var SMS_CONST = require('../constants/responses').SMS;

    var twilio = require('twilio');
    var client = new twilio.RestClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    this.forgotPassword = function (options, res, callback) {
        var smsMessage;
        var twilioMessage;
        var msg = SMS_CONST.FORGOT_PASS;

        if (!validateInviteSMSOptions(options)) {
            var err = new Error('Not enough options to send forgot password sms.');

            if (callback && typeof callback === 'function') {
                return callback(err);
            }

            return err;
        }

        smsMessage = prepareForgotPassMessage(msg, res, options);
        twilioMessage = {
            to  : options.phoneNumber,
            from: TWILIO_NUMBER,
            body: smsMessage
        };

        sendSMS(twilioMessage, function (err, msg) {
            if (callback && typeof callback === 'function') {
                return callback(err, msg);
            }
            return (err) ? err : true;
        });
    };

    this.sendNewPassword = function (options, res, callback) {
        var smsMessage;
        var twilioMessage;
        var currentLanguage = options.language ? options.language : 'en';
        var msg = SMS_CONST.NEW_PASSWORD[currentLanguage];

        if (!validateInviteSMSOptions(options)) {
            var err = new Error('Not enough options to send new password sms.');

            if (callback && typeof callback === 'function') {
                return callback(err);
            }

            return err;
        }

        smsMessage = prepareNewPassMessage(msg, res, options);
        twilioMessage = {
            to  : options.phoneNumber,
            from: TWILIO_NUMBER,
            body: smsMessage
        };

        sendSMS(twilioMessage, function (err, msg) {
            if (callback && typeof callback === 'function') {
                return callback(err, msg);
            }

            return (err) ? err : true;
        });
    };

    function validateInviteSMSOptions(options) {
        return (!!options || !!options.phoneNumber || !!options.resetCode);
    }

    function prepareForgotPassMessage(messageTemplate, res, options) {
        // messageTemplate = res.__(messageTemplate);

        return messageTemplate.replace('<resetCode>', options.resetCode);
    }

    function prepareNewPassMessage(messageTemplate, res, options) {
        var url = process.env.HOST + '/personnel/confirm/' + options.token;

        // messageTemplate = res.__(messageTemplate);

        messageTemplate = messageTemplate.replace('<password>', options.password);
        messageTemplate = messageTemplate.replace('<url>', url);

        return messageTemplate;
    }

    function sendSMS(twilioMessage, callback) {
        client.messages.create(twilioMessage, function (error, message) {
            if (!error) {
                if (process.env.NODE_ENV === 'development') {
                    var success = 'SMS sent! The SID for this SMS message is: '
                        + message.sid
                        + '\nMessage sent on: '
                        + message.dateCreated;

                    console.log(success);
                }
            } else {
                if (process.env.NODE_ENV === 'development') {
                    var failed = 'SMS sent failed! Error occurred: '
                        + error.message + ' : ' + error.moreInfo;

                    console.error(failed);
                }
            }

            callback(error, message);
        });
    }
};