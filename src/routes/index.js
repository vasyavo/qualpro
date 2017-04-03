const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('./../utils/logger');
const errorHandler = require('./../utils/errorHandler');
const notFoundHandler = require('./../utils/notFound');
const csrfProtection = require('./../utils/csrfProtection');
const checkAuth = require('./../utils/isAuth');
const addRequestId = require('express-request-id')();
const config = require('./../config');
const express = require('express');

module.exports = function(app) {
    var redis = require('../helpers/redisClient');

    app.set('csrfProtection', csrfProtection);

    var ModuleslHandler = require('../handlers/modules');
    var modulesHandler = new ModuleslHandler();

    var marketingCampaignRouter = require('./marketingCampaign')();
    var marketingCampaignItemRouter = require('./marketingCampaignItem')();
    var personnelRouter = require('./personnel')();
    var mobileRouter = require('./mobile')();
    var notificationsRouter = require('./notifications')();
    var currencyRouter = require('./currency')();
    var fileRouter = require('./file')();
    var domainRouter = require('./domain')();
    var promotionsItems = require('./promotionsItems')();
    var retailSegmentRouter = require('./retailSegment')();
    var outletRouter = require('./outlet')();
    var branchRouter = require('./branch')();
    var positionRouter = require('./position')();
    var ratingRouter = require('./rating')();
    var filtersRouter = require('./filters')();
    var importRouter = require('./import')();
    var planogramRouter = require('./planogram')();
    var questionnaryRouter = require('./questionnary')();
    var shelfShareRouter = require('./shelfShares')();

    var categoryRouter = require('./category')();
    var variantRouter = require('./variant')();
    var itemRouter = require('./item')();
    var commentRouter = require('./comment')();

    var brandRouter = require('./brand')();
    var competitorItemRouter = require('./competitorItem')();
    var competitorVariantRouter = require('./competitorVariant')();
    var competitorBranding = require('./competitorBranding')();
    var competitorPromotion = require('./competitorPromotion')();
    var achievementForm = require('./achievementForm')();
    var newProductLaunch = require('./newProductLaunch')();
    var originRouter = require('./origin')();
    var contactUs = require('./contactUs')();

    var contractsYearlyRouter = require('./contractsYearly')();
    var contractsSecondaryRouter = require('./contractsSecondary')();
    var documentsRouter = require('./documents')();
    var noteRouter = require('./note')();

    var formRouter = require('./form')();
    var accessRoleRouter = require('./accessRole')();

    var promotionsRouter = require('./promotions')();

    var itemHistoryRouter = require('./itemHistory')();

    var displayTypeRouter = require('./displayType')();

    app.use(addRequestId);
    app.use(require('../utils/IncomingRequestPayloadLogger'));
    app.use(require('./../utils/rememberMeMiddleware'));


    app.get('/', csrfProtection, (req, res, next) => {
        res.render('index.html', {
            csrfToken: req.csrfToken(),
            pubnubSubscribeKey: config.pubnub.subscribeKey,
            previewUrlRoot: config.previewUrlRoot,
        });
    });

    // endpoint for handling api documents
    app.get('/docs', (req, res, next) => {
        res.render(path.join(process.cwd(), '/API_documentation/qualPro_API.html').normalize());
    });

    app.get('/modules', checkAuth, modulesHandler.getAll);

    app.post('/scheduler', require('./../stories/scheduler/middleware'));

    app.use(require('./../stories/user-registration'));

    app.use('/activityList', require('../stories/activityList/router'));
    app.use('/preview', require('../stories/preview/router'));
    app.use('/brandingAndMonthlyDisplay', require('./brandingAndMonthlyDisplay'));
    app.use('/marketingCampaign', marketingCampaignRouter);
    app.use('/marketingCampaignItem', marketingCampaignItemRouter);
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
    app.use('/objectives', require('../stories/objectives/router'));
    app.use('/instoretasks', require('../stories/inStoreTasks/router'));
    app.use('/planogram', planogramRouter);
    app.use('/questionnary', questionnaryRouter);
    app.use('/consumersSurvey', require('../stories/consumersSurvey/router'));
    app.use('/shelfShares', shelfShareRouter);
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
        var breadcrumbsHelper = new BreadcrumbsHelper();

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