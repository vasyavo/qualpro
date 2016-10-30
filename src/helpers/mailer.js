/**
 * Created by soundstorm on 14.04.15.
 */
module.exports = function () {
    var _ = require('../public/js/libs/underscore/underscore-min.js');
    var nodemailer = require("nodemailer");
    var sgTransport = require('nodemailer-sendgrid-transport');
    var smtpTransportObject = require('../config/mailer').noReplay;

    var fs = require('fs');
    var forgotPasswordTemplate = _.template(fs.readFileSync('public/templates/mailer/forgotPassword.html', encoding = "utf8"));
    var confirmAccountTemplate = _.template(fs.readFileSync('public/templates/mailer/createUser.html', encoding = "utf8"));

    this.forgotPassword = function (options) {
        var language = options.currentLanguage;
        var anotherLanguage = (language === 'en') ? 'ar' : 'en';
        var langFirstName = options.firstName[language];
        var langLastName = options.lastName[language];

        var firstName = (langFirstName && langLastName) ? langFirstName : options.firstName[anotherLanguage];
        var lastName = (langFirstName && langLastName) ? langLastName : options.lastName[anotherLanguage];

        var templateOptions = {
            name : firstName + ' ' + lastName,
            email: options.email,
            url  : process.env.HOST + '/passwordChange/' + options.forgotToken
        };
        var mailOptions = {
            from                : 'Al Alali <no-replay@alAlali.com>',
            to                  : templateOptions.email,
            subject             : 'Change password',
            generateTextFromHTML: true,
            html                : forgotPasswordTemplate(templateOptions)
        };

        deliver(mailOptions);
    };

    this.changePassword = function (options) {
        var enFirstName = options.firstName.en || options.firstName.ar;
        var arFirstName = options.firstName.ar || options.firstName.en;

        var enLastName = options.lastName.en || options.lastName.ar;
        var arLastName = options.lastName.ar || options.lastName.en;

        var templateOptions = {
            name : {
                en: enFirstName + ' ' + enLastName,
                ar: arFirstName + ' ' + arLastName
            },
            email   : options.email,
            password: options.password,
            url     : 'http://localhost:8823'
        };
        var mailOptions = {
            from                : 'Test',
            to                  : options.email,
            subject             : 'Change password',
            generateTextFromHTML: true,
            html                : _.template(fs.readFileSync('public/templates/mailer/changePassword.html', encoding = "utf8"), templateOptions)
        };

        deliver(mailOptions);
    };

    this.confirmNewUserRegistration = function (options) {
        var enFirstName = options.firstName.en || options.firstName.ar;
        var arFirstName = options.firstName.ar || options.firstName.en;

        var enLastName = options.lastName.en || options.lastName.ar;
        var arLastName = options.lastName.ar || options.lastName.en;

        var templateOptions = {
            name : {
                en: enFirstName + ' ' + enLastName,
                ar: arFirstName + ' ' + arLastName
            },
            email   : options.email,
            password: options.password,
            url     : process.env.HOST + '/personnel/confirm/' + options.token
        };
        var mailOptions = {
            from                : 'Al Alali <no-replay@alAlali.com>',
            to                  : options.email,
            subject             : 'User verification',
            generateTextFromHTML: true,
            html                : confirmAccountTemplate(templateOptions)
        };

        deliver(mailOptions);
    };

    function deliver(mailOptions, cb) {
        var transport = nodemailer.createTransport(sgTransport(smtpTransportObject));

        transport.sendMail(mailOptions, function (err, response) {
            if (err) {
                console.log(err);
                if (cb && (typeof cb === 'function')) {
                    cb(err, null);
                }
            } else {
                console.log("Message sent: " + response.messageId);
                if (cb && (typeof cb === 'function')) {
                    cb(null, response);
                }
            }
        });
    }
};

