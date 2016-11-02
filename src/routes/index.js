/**
 * @see {@link https://nodejs.org/api/events.html}
 * @class EventEmiter
 */

module.exports = function (app, db, event) {
    // var express = require('express');
    var path = require('path');
    var logWriter = require('../helpers/logWriter');
    var fs = require('fs');
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();
    var mongoose = require('mongoose');

    var redis = require('../helpers/redisClient');

    var csurf = require('csurf');
    var csrfProtection = csurf({ignoreMethods: ['GET', 'POST'], cookie: true});

    // var i18n = require('i18n');

    app.set('csrfProtection', csrfProtection);
    require('../helpers/eventEmiter')(db, redis, event, app);

    var LocalFs = require('../helpers/localFs');

    var DocsHandler = require('../handlers/docs');
    var PersonnelHandler = require('../handlers/personnel');
    var ModuleslHandler = require('../handlers/modules');
    var personnelHandler = new PersonnelHandler(db);
    var modulesHandler = new ModuleslHandler(db);
    var docsHandler = new DocsHandler(db);

    var brandingAndDisplayRouter = require('./brandingAndDisplay')(db, redis, event);
    var brandingAndDisplayItems = require('./brandingAndDisplayItems')(db, redis, event);
    var personnelRouter = require('./personnel')(db, app, event, redis);
    var mobileRouter = require('./mobile')(db, app, redis, event);
    var notificationsRouter = require('./notifications')(db, redis, event);
    var currencyRouter = require('./currency')(db, redis, event);
    var fileRouter = require('./file')(db, redis, event);
    var objectivesRouter = require('./objectives')(db, redis, event);
    var inStoreeTasksRouter = require('./inStoreTasks')(db, redis, event);
    var domainRouter = require('./domain')(db, redis, event);
    var promotionsItems = require('./promotionsItems')(db, redis, event);
    var retailSegmentRouter = require('./retailSegment')(db, redis, event);
    var outletRouter = require('./outlet')(db, redis, event);
    var branchRouter = require('./branch')(db, redis, event);
    var positionRouter = require('./position')(db, redis, event);
    var ratingRouter = require('./rating')(db, redis, event);
    var filtersRouter = require('./filters')(db, app, redis);
    var importRouter = require('./import')(db, redis, event);
    var planogramRouter = require('./planogram')(db, redis, event);
    var questionnaryRouter = require('./questionnary')(db, redis, event);
    var shelfShareRouter = require('./shelfShares')(db, redis, event);

    var categoryRouter = require('./category')(db, event);
    var variantRouter = require('./variant')(db, redis, event);
    var itemRouter = require('./item')(db, redis, event);
    var commentRouter = require('./comment')(db, redis, event);

    var brandRouter = require('./brand')(db, redis, event);
    var competitorItemRouter = require('./competitorItem')(db, redis, event);
    var competitorVariantRouter = require('./competitorVariant')(db, redis, event);
    var competitorBranding = require('./competitorBranding')(db, redis, event);
    var competitorPromotion = require('./competitorPromotion')(db, redis, event);
    var achievementForm = require('./achievementForm')(db, redis, event);
    var newProductLaunch = require('./newProductLaunch')(db, redis, event);
    var activityList = require('./activityList')(db, redis, event);
    var originRouter = require('./origin')(db, redis, event);
    var priceSurvey = require('./priceSurvey')(db, redis, event);
    var contactUs = require('./contactUs')(db, redis, event);

    var contractsYearlyRouter = require('./contractsYearly')(db, redis, event);
    var contractsSecondaryRouter = require('./contractsSecondary')(db, redis, event);
    var documentsRouter = require('./documents')(db, redis, event);
    var noteRouter = require('./note')(db, redis, event);

    var formRouter = require('./form')(db, redis, event);
    var accessRoleRouter = require('./accessRole')(db, redis, event);

    var promotionsRouter = require('./promotions')(db, redis, event);

    var itemHistoryRouter = require('./itemHistory')(db, redis, event);

    var displayTypeRouter = require('./displayType')(db, redis, event);

    var RESPONSES = require('../constants/responses');
    var CONSTANTS = require('../constants/mainConstants');

    var sessionValidator = function (req, res, next) {
        var session = req.session;
        var year = 31536000000;

        if (session) {
            if (session.rememberMe) {
                session.cookie.maxAge = year;
            } else {
                session.cookie.maxAge = CONSTANTS.SESSION_TTL;
            }
        }

        next();
    };

    function checkAuth(req, res, next) {
        if (req.session && req.session.loggedIn) {
            next();
        } else {
            res.send(401);
        }
    }

    /*i18n.configure({
     locales  : ['en', 'ar'],
     cookie   : 'currentLanguage',
     directory: __dirname + '/locales'
     });*/

    app.use(sessionValidator);
    //  app.use(i18n.init);

    app.get('/', csrfProtection, function (req, res, next) {
        //ToDo remove (res.cookie) this one after test sms
        //res.cookie('lang', 'ae');
        res.render('index.html', {csrfToken: req.csrfToken()});
    });

    // endpoint for handling api documents
    app.get('/docs', function (req, res, next) {
        res.render(process.cwd() + '/API_documentation/qualPro_API.html');
    });

    app.get('/authenticated', function (req, res, next) {
        if (req.session && req.session.loggedIn) {
            res.send(200);
        } else {
            res.send(401);
        }
    });
    app.get('/modules', checkAuth, modulesHandler.getAll);
    app.post('/login', csrfProtection, personnelHandler.login);

    app.post('/upload', multipartMiddleware, function (req, res, next) {
        var localFs = new LocalFs();
        var id = req.session.uId;
        var content = req.headers.contenttype;
        var folderName = path.join(content, id);
        var fileData = req.files.attachfile;

        localFs.postFile(folderName, fileData, function (err) {
            if (err) {
                return next(err);
            }

            res.status(201).send({success: 'file(\'s) uploaded success'});
        });
    });

    app.get('/passwordChange/:forgotToken', csrfProtection, function (req, res, next) {
        var forgotToken = req.params.forgotToken;

        res.render('changePassword', {
            host       : process.env.HOST,
            forgotToken: forgotToken,
            csrfToken  : req.csrfToken()
        });
    });

    app.get('/passwordChangeNotification/:messageObj', csrfProtection, function (req, res, next) {
        var messageObj = JSON.parse(req.params.messageObj);

        res.render('passwordChangeNotification', {
            host      : process.env.HOST,
            messageObj: messageObj
        });
    });

    app.get('/verificateCode/:phoneNumber', csrfProtection, function (req, res, next) {
        var phoneNumber = req.params.phoneNumber;

        res.render('enterCode.html', {
            host       : process.env.HOST,
            csrfToken  : req.csrfToken(),
            phoneNumber: phoneNumber,
            sendSMSUrl : 'forgotPass'
        });
    });
    app.get('/messageSent', csrfProtection, function (req, res, next) {

        res.render('emailMessageWasSent.html', {
            host     : process.env.HOST,
            csrfToken: req.csrfToken()
        });
    });
    app.post('/forgotPass', csrfProtection, personnelHandler.forgotPassword);

    app.get('/logout', csrfProtection, function (req, res, next) {
        if (req.session) {
            req.session.destroy(function (err) {
                if (err) {
                    return next(err);
                }

                res.status(200).send();
            });
        } else {
            res.status(200).send();
        }

        res.clearCookie();
    });


    app.use('/activityList', activityList);
    app.use('/brandingAndDisplay', brandingAndDisplayRouter);
    app.use('/brandingAndDisplayItems', brandingAndDisplayItems);
    app.use('/personnel', personnelRouter);
    app.use('/domain', domainRouter);
    app.use('/country', domainRouter);
    app.use('/promotionsItems', promotionsItems);
    app.use('/region', domainRouter);
    app.use('/subRegion', domainRouter);
    app.use('/retailSegment', retailSegmentRouter);
    app.use('/outlet', outletRouter);
    app.use('/branch', branchRouter);
    app.use('/mobile', mobileRouter);
    app.use('/currency', currencyRouter);
    app.use('/notifications', notificationsRouter);
    app.use('/objectives', objectivesRouter);
    app.use('/instoretasks', inStoreeTasksRouter);
    app.use('/planogram', planogramRouter);
    app.use('/questionnary', questionnaryRouter);
    app.use('/shelfShares', shelfShareRouter);
    app.use('/docs/db', docsHandler.getDb);
    app.use('/position', positionRouter);
    app.use('/rating', ratingRouter);
    app.use('/filters', filtersRouter);
    app.use('/import', importRouter);

    app.use('/category', categoryRouter);
    app.use('/variant', variantRouter);
    app.use('/item', itemRouter);
    app.use('/comment', commentRouter);

    app.use('/brand', brandRouter);
    app.use('/competitorItem', competitorItemRouter);
    app.use('/competitorVariant', competitorVariantRouter);
    app.use('/competitorList', competitorItemRouter);
    app.use('/origin', originRouter);
    app.use('/file', fileRouter);
    app.use('/priceSurvey', priceSurvey);
    app.use('/competitorBranding', competitorBranding);
    app.use('/competitorPromotion', competitorPromotion);
    app.use('/achievementForm', achievementForm);
    app.use('/newProductLaunch', newProductLaunch);
    app.use('/contactUs', contactUs);

    app.use('/contractsYearly', contractsYearlyRouter);
    app.use('/contractsSecondary', contractsSecondaryRouter);
    app.use('/documents', documentsRouter);
    app.use('/notes', noteRouter);

    app.use('/promotions', promotionsRouter);

    app.use('/itemHistory', itemHistoryRouter);

    app.use('/accessRole', accessRoleRouter);

    app.use('/displayType', displayTypeRouter);

    app.use('/form', formRouter);

    app.get('/breadcrumbs', function (req, res, next) {
        var breadcrumb = req.query.breadcrumb;
        var ids = breadcrumb.ids;
        var type = breadcrumb.type;
        var BreadcrumbsHelper = require('../helpers/breadcrumbsHelper');
        var breadcrumbsHelper = new BreadcrumbsHelper(db);

        breadcrumbsHelper.getBreadcrumbs({ids: ids, type: type}, function (err, resp) {
            if (err) {
                return next(err);
            }
            res.status(200).send(resp);

        });
    });

    app.get('/sms/:phoneNumber/:testType', function (req, res, next) {
        var testType = req.params.testType;
        var phoneNumber = req.params.phoneNumber;
        var Sms = require('../helpers/smsSender');
        var smsSender = new Sms();

        var forgotPassOptions = {
            phoneNumber: phoneNumber,
            resetCode  : 123456
        };

        var newPassOptions = {
            phoneNumber: phoneNumber,
            password   : 'hdf67wefbhu87wef'
        };

        function resultCb(err, message) {
            if (err) {
                return next(err);
            }

            res.status(200).send(message);
        }

        switch (testType) {
            case 'forgotPass':
                smsSender.forgotPassword(forgotPassOptions, res, resultCb);
                break;
            case 'newPassword':
                smsSender.sendNewPassword(newPassOptions, res, resultCb);
        }

    });

    function notFound(req, res, next) {
        res.status(404);

        if (req.accepts('html')) {
            return res.send(RESPONSES.PAGE_NOT_FOUND);
        }

        if (req.accepts('json')) {
            return res.json({error: RESPONSES.PAGE_NOT_FOUND});
        }

        res.type('txt');
        res.send(RESPONSES.PAGE_NOT_FOUND);
    }

    function errorHandler(err, req, res, next) {
        var status = err.status || 500;

        if (process.env.NODE_ENV === 'production') {
            if (status === 401) {
                logWriter.log('', err.message + '\n' + err.stack);
            }

            if (err.code === 11000 || err.code === 11001) {
                err.message = 'Record with such data is already exists';
            }

            res.status(status).send({
                error : err.message,
                details : err.details
            });
        } else {
            if (status !== 401) {
                logWriter.log('', err.message + '\n' + err.stack);
            }

            res.status(status).send({
                error: err.message + '\n' + err.stack,
                details : err.details
            });
        }
    }

    function csrfErrorParser(err, req, res, next) {
        if (err.code !== 'EBADCSRFTOKEN') {
            return next(err);
        }
        // handle CSRF token errors here
        res.status(403);

        if (req.accepts('html')) {
            return res.send('form tampered with');
        }

        if (req.accepts('json')) {
            return res.json({error: 'form tampered with'});
        }

        res.type('txt');
        res.send('form tampered with');
    }

    function sendData(data, req, res, next) {
        var status = data.status;
        var body = data.body;

        if (status !== 200) {
            return next(data);
        }

        if (req.isMobile && body && typeof body === 'object' && body.data) {
            body.lastSyncDate = new Date();
        }

        res.status(status).send(body);
    }

    app.use(notFound);
    app.use(sendData);
    app.use(csrfErrorParser);
    app.use(errorHandler);
};