var express = require('express');
var router = express.Router();
var PersonnelHandler = require('../handlers/personnel');

/**
 * @module Mobile - Login
 */

module.exports = function (db, app, redis, event) {
    var personnelHandler = new PersonnelHandler(db, app, event, redis);
    var activityListRouter = require('./mobile/activityList')(db, redis, event);
    var brandingAndDisplayRouter = require('./mobile/brandingAndDisplay')(db, redis, event);
    var brandingAndDisplayItemsRouter = require('./mobile/brandingAndDisplayItems')(db, redis, event);
    var domainRouter = require('./mobile/domain')(db, redis, event);
    var notificationsRouter = require('./mobile/notifications')(db);
    var retailSegmentRouter = require('./mobile/retailSegment')(db, redis, event);
    var outletRouter = require('./mobile/outlet')(db, redis, event);
    var itemRouter = require('./mobile/item')(db);
    var competitorItemRouter = require('./mobile/competitorItem')(db);
    var branchRouter = require('./mobile/branch')(db, redis, event);
    var planogramRouter = require('./mobile/planogram')(db);
    var brandRouter = require('./mobile/brand')(db);
    var fileRouter = require('./mobile/file')(db);
    var formRouter = require('./mobile/form')(db, redis, event);
    var priceSurveyRouter = require('./mobile/priceSurvey')(db, redis, event);
    var objectiveRouter = require('./mobile/objective')(db, redis, event);
    var commentRouter = require('./mobile/comment')(db, redis, event);
    var inStoreTasksRouter = require('./mobile/inStoreTasks')(db, redis, event);
    var competitorBrandingRouter = require('./mobile/competitorBranding')(db, redis, event);
    var achievementFormRouter = require('./mobile/achievementForm')(db, redis, event);
    var newProductLaunchRouter = require('./mobile/newProductLaunch')(db, redis, event);
    var competitorPromotionRouter = require('./mobile/competitorPromotion')(db, redis, event);
    var accessRoleRouter = require('./mobile/accessRole')(db);
    var promotionsRouter = require('./mobile/promotions')(db);
    var promotionsItemsRouter = require('./mobile/promotionsItems')(db, redis, event);
    var shelfSharesRouter = require('./mobile/shelfShares')(db, redis, event);
    var categoryRouter = require('./mobile/category')(db);
    var variantRouter = require('./mobile/variant')(db);
    var competitorVariantRouter = require('./mobile/competitorVariant')(db);
    var displayTypeRouter = require('./mobile/displayType')(db);
    var documentsRouter = require('./mobile/documents')(db, redis, event);
    var contractsYearlyRouter = require('./mobile/contractsYearly')(db, redis, event);
    var contractsSecondaryRouter = require('./mobile/contractsSecondary')(db, redis, event);
    var questionnaryRouter = require('./mobile/questionnary')(db, redis, event);
    var positionRouter = require('./position')(db, redis, event);
    var originRouter = require('./origin')(db, redis, event);


    router.use(function (req, res, next) {
        req.isMobile = true;

        next();
    });

    router.use('/personnel', require('./mobile/personnel')(db, app, event, redis));
    router.use('/activityList', activityListRouter);
    router.use('/brandingAndDisplay', brandingAndDisplayRouter);
    router.use('/brandingAndDisplayItems', brandingAndDisplayItemsRouter);
    router.use('/domain', domainRouter);
    router.use('/accessRole', accessRoleRouter);
    router.use('/notifications', notificationsRouter);
    // router.use('/country', domainRouter);
    // router.use('/region', domainRouter);
    // router.use('/subRegion', domainRouter);
    router.use('/retailSegment', retailSegmentRouter);
    router.use('/outlet', outletRouter);
    router.use('/item', itemRouter);
    router.use('/competitorItem', competitorItemRouter);
    router.use('/branch', branchRouter);
    router.use('/planogram', planogramRouter);
    router.use('/brand', brandRouter);
    router.use('/form', formRouter);
    router.use('/objectives', objectiveRouter);
    router.use('/comment', commentRouter);
    router.use('/inStoreTasks', inStoreTasksRouter);
    router.use('/priceSurvey', priceSurveyRouter);
    router.use('/competitorBranding', competitorBrandingRouter);
    router.use('/competitorPromotion', competitorPromotionRouter);
    router.use('/achievementForm', achievementFormRouter);
    router.use('/newProductLaunch', newProductLaunchRouter);
    router.use('/file', fileRouter);
    router.use('/promotions', promotionsRouter);
    router.use('/promotionsItems', promotionsItemsRouter);
    router.use('/shelfShares', shelfSharesRouter);
    router.use('/category', categoryRouter);
    router.use('/variant', variantRouter);
    router.use('/competitorVariant', competitorVariantRouter);
    router.use('/displayType', displayTypeRouter);
    router.use('/documents', documentsRouter);
    router.use('/contractsYearly', contractsYearlyRouter);
    router.use('/contractsSecondary', contractsSecondaryRouter);
    router.use('/questionnary', questionnaryRouter);
    router.use('/position', positionRouter);
    router.use('/origin', originRouter);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/login`
     *
     * Logs into system
     *
     *
     * @example
     * REQUEST:
     *     'http://192.168.88.15:9797/mobile/login'
     * BODY:
     * {
     *      login:'admin@admin.com'
     *      pass:'121212'
     * }
     * RESPONSE : status
     *
     * @method /mobile/login
     * @instance
     */
    router.post('/login', personnelHandler.login);


    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/deviceId`
     *
     * Add deviceId to user session
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/deviceId'
     *
     * BODY:
     * {
     *   deviceId: "eIAnMDJE74Y:APA91bElb132Lw2rPxfwVW60PhkfxJ8vvOqhtXlqTBVp_w2L41psZP0tgRjfiIt2AoQBt-22oyq1mx9IoYzccEEQFd967e8Q3vPpl1zh1BhYZEyfXyNp4keDLiFhOxf72EEJPKKr9LrT"
     * }
     *
     * @example Response example: status
     *
     * @method /mobile/deviceId
     * @instance
     */

    router.post('/deviceId', personnelHandler.deviceId);

    return router;
};