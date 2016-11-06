const fs = require('fs');
const path = require('path');
const config = require('./../config');
const logger = require('./../utils/logger');
const _ = require('lodash');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const smtpTransportObject = require('../config/mailer').noReplay;

const transport = nodemailer.createTransport(sgTransport(smtpTransportObject));

const readTmpl = (name) => {
    const pathToTmpl = `${__dirname}/../${name}.html`;
    const file = fs.readFileSync(pathToTmpl, 'utf8');

    return _.template(file);
};

const forgotPasswordTemplate = readTmpl('public/templates/mailer/forgotPassword');
const confirmAccountTemplate = readTmpl('public/templates/mailer/createUser');
const changePasswordTemplate = readTmpl('views/changePassword');

const deliver = (mailOptions, cb) => {
    transport.sendMail(mailOptions, function(err, response) {
        if (err) {
            logger.error(`Message wasn't sent ${err}`);

            if (_.isFunction(cb)) {
                return cb(err, null);
            }
        }

        logger.info(`Message sent: ${response.messageId}`);
        if (_.isFunction(cb)) {
            cb(null, response);
        }
    });
};

const forgotPassword = (options) => {
    const language = options.currentLanguage;
    const anotherLanguage = (language === 'en') ? 'ar' : 'en';
    const langFirstName = options.firstName[language];
    const langLastName = options.lastName[language];

    const firstName = (langFirstName && langLastName) ? langFirstName : options.firstName[anotherLanguage];
    const lastName = (langFirstName && langLastName) ? langLastName : options.lastName[anotherLanguage];

    const templateOptions = {
        name: `${firstName} ${lastName}`,
        email: options.email,
        url: `${config.localhost}/passwordChange/${options.forgotToken}`
    };
    const mailOptions = {
        from: 'Al Alali <no-replay@alAlali.com>',
        to: templateOptions.email,
        subject: 'Change password',
        generateTextFromHTML: true,
        html: forgotPasswordTemplate(templateOptions)
    };

    deliver(mailOptions);
};

const changePassword = (options) => {
    const enFirstName = options.firstName.en || options.firstName.ar;
    const arFirstName = options.firstName.ar || options.firstName.en;

    const enLastName = options.lastName.en || options.lastName.ar;
    const arLastName = options.lastName.ar || options.lastName.en;

    const templateOptions = {
        name: {
            en: `${enFirstName} ${enLastName}`,
            ar: `${arFirstName} ${arLastName}`
        },
        email: options.email,
        password: options.password,
        url: config.localhost // todo check url
    };
    const mailOptions = {
        from: 'Test',
        to: options.email,
        subject: 'Change password',
        generateTextFromHTML: true,
        html: changePasswordTemplate(templateOptions)
    };

    deliver(mailOptions);
};

const confirmNewUserRegistration = (options, cb) => {
    const enFirstName = options.firstName.en || options.firstName.ar;
    const arFirstName = options.firstName.ar || options.firstName.en;

    const enLastName = options.lastName.en || options.lastName.ar;
    const arLastName = options.lastName.ar || options.lastName.en;

    const templateOptions = {
        name: {
            en: `${enFirstName} ${enLastName}`,
            ar: `${arFirstName} ${arLastName}`
        },
        email: options.email,
        password: options.password,
        url: `${config.localhost}/personnel/confirm/${options.token}`
    };
    const mailOptions = {
        from: 'Al Alali <no-replay@alAlali.com>',
        to: options.email,
        subject: 'User verification',
        generateTextFromHTML: true,
        html: confirmAccountTemplate(templateOptions)
    };

    if (_.isFunction(cb)) {
        return deliver(mailOptions, cb);
    }

    deliver(mailOptions);
};

module.exports = {
    deliver,
    forgotPassword,
    changePassword,
    confirmNewUserRegistration
};
