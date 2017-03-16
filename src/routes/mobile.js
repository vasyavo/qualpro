var express = require('express');
var router = express.Router();
var PersonnelHandler = require('../handlers/personnel');

/**
 * @module Mobile - Login
 */

module.exports = function () {
    var personnelHandler = new PersonnelHandler();
    var brandingActivityRouter = require('./mobile/marketingCampaign')();
    var brandingActivityItemsRouter = require('./mobile/marketingCampaignItem')();
    var domainRouter = require('./mobile/domain')();
    var notificationsRouter = require('./mobile/notifications')();
    var notesRouter = require('./mobile/note')();
    var retailSegmentRouter = require('./mobile/retailSegment')();
    var outletRouter = require('./mobile/outlet')();
    var itemRouter = require('./mobile/item')();
    var competitorItemRouter = require('./mobile/competitorItem')();
    var branchRouter = require('./mobile/branch')();
    var planogramRouter = require('./mobile/planogram')();
    var brandRouter = require('./mobile/brand')();
    var fileRouter = require('./mobile/file')();
    var formRouter = require('./mobile/form')();
    var objectiveRouter = require('./mobile/objective')();
    var commentRouter = require('./mobile/comment')();
    var inStoreTasksRouter = require('./mobile/inStoreTasks')();
    var competitorBrandingRouter = require('./mobile/competitorBranding')();
    var achievementFormRouter = require('./mobile/achievementForm')();
    var newProductLaunchRouter = require('./mobile/newProductLaunch')();
    var competitorPromotionRouter = require('./mobile/competitorPromotion')();
    var accessRoleRouter = require('./mobile/accessRole')();
    var promotionsRouter = require('./mobile/promotions')();
    var promotionsItemsRouter = require('./mobile/promotionsItems')();
    var shelfSharesRouter = require('./mobile/shelfShares')();
    var categoryRouter = require('./mobile/category')();
    var variantRouter = require('./mobile/variant')();
    var competitorVariantRouter = require('./mobile/competitorVariant')();
    var displayTypeRouter = require('./mobile/displayType')();
    var documentsRouter = require('./mobile/documents')();
    var contractsYearlyRouter = require('./mobile/contractsYearly')();
    var contractsSecondaryRouter = require('./mobile/contractsSecondary')();
    var questionnaryRouter = require('./mobile/questionnary')();
    var positionRouter = require('./position')();
    var originRouter = require('./origin')();
    var contactUsRouter = require('./contactUs')();

    router.use(require('./../utils/setIsMobileToMiddleware'));

    router.use('/personnel', require('./mobile/personnel')());
    router.use('/activityList', require('../stories/activityList/router'));
    router.use('/brandingAndMonthlyDisplay', require('./mobile/brandingAndMonthlyDisplay'));
    router.use('/marketingCampaign', brandingActivityRouter);
    router.use('/marketingCampaignItem', brandingActivityItemsRouter);
    router.use('/domain', domainRouter);
    router.use('/accessRole', accessRoleRouter);
    router.use('/notifications', notificationsRouter);
    router.use('/note', notesRouter);
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
    router.use('/objectives', require('../stories/objectives/router'));
    router.use('/comment', commentRouter);
    router.use('/inStoreTasks', inStoreTasksRouter);
    router.use('/priceSurvey', require('./../stories/reporting/price-survey/router.mobile'));
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
    router.use('/consumersSurvey', require('../stories/consumersSurvey/router'));
    router.use('/position', positionRouter);
    router.use('/origin', originRouter);
    router.use('/contactUs', contactUsRouter);

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