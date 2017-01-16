const fs = require('fs');
const path = require('path');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const mongoose = require('mongoose');
const logger = require('./../utils/logger');
const errorHandler = require('./../utils/errorHandler');
const notFoundHandler = require('./../utils/notFound');
const csrfProtection = require('./../utils/csrfProtection');
const checkAuth = require('./../utils/isAuth');
const addRequestId = require('express-request-id')();
const config = require('./../config');

module.exports = function(app, db, event) {
    var logWriter = require('../helpers/logWriter');
    var redis = require('../helpers/redisClient');

    app.set('csrfProtection', csrfProtection);

    require('../helpers/eventEmiter')(db, redis, event, app);

    var LocalFs = require('../helpers/localFs');

    var DocsHandler = require('../handlers/docs');
    var ModuleslHandler = require('../handlers/modules');
    var modulesHandler = new ModuleslHandler(db);
    var docsHandler = new DocsHandler(db);

    var brandingAndDisplayRouter = require('./brandingAndDisplay')(db, redis, event);
    var brandingActivityRouter = require('./brandingActivity')(db, redis, event);
    var brandingActivityItems = require('./brandingActivityItems')(db, redis, event);
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

    app.use(addRequestId);
    app.use(require('../utils/IncomingRequestPayloadLogger'));
    app.use(require('./../utils/rememberMeMiddleware'));


    app.get('/', csrfProtection, function(req, res, next) {
        //ToDo remove (res.cookie) this one after test sms
        //res.cookie('lang', 'ae');
        res.render('index.html', {csrfToken : req.csrfToken()});
    });

    // endpoint for handling api documents
    app.get('/docs', function(req, res, next) {
        res.render(process.cwd() + '/API_documentation/qualPro_API.html');
    });

    app.get('/modules', checkAuth, modulesHandler.getAll);

    app.post('/scheduler', require('./../stories/scheduler'));
    /*app.use(require('./../utils/validTimeZone'));*/

    app.use(require('./../stories/user-registration'));

    app.use('/activityList', activityList);
    app.use('/brandingAndDisplayNew', brandingAndDisplayRouter);
    app.use('/brandingActivity', brandingActivityRouter);
    app.use('/brandingActivityItems', brandingActivityItems);
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
    app.use('/consumersSurvey', require('../stories/consumersSurvey/router'));
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
    app.use('/priceSurvey', require('./../stories/reporting/price-survey/router'));
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

    app.get('/breadcrumbs', function(req, res, next) {
        var breadcrumb = req.query.breadcrumb;
        var ids = breadcrumb.ids;
        var type = breadcrumb.type;
        var BreadcrumbsHelper = require('../helpers/breadcrumbsHelper');
        var breadcrumbsHelper = new BreadcrumbsHelper(db);

        breadcrumbsHelper.getBreadcrumbs({
            ids : ids,
            type : type
        }, function(err, resp) {
            if (err) {
                return next(err);
            }
            res.status(200).send(resp);

        });
    });

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
            return res.json({error : 'form tampered with'});
        }

        res.type('txt');
        res.send('form tampered with');
    }

    // last sync date which represent timestamp end of request and mobile app save it in own context
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

    app.use(notFoundHandler);
    app.use(sendData);
    app.use(csrfErrorParser);
    app.use(errorHandler);
};