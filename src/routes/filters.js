var express = require('express');
var router = express.Router();
var filterHandler = require('../handlers/filters');
var access = require('../helpers/access');
const storePersonnelInMiddleware = require('../reusableComponents/storePersonnelInMiddleware');

module.exports = function() {
    var handler = new filterHandler();
    var csrfProtection = require('./../utils/csrfProtection');
    var checkAuth = access.checkAuth;

    router.use(require('../utils/redirectFilterMiddleware'));

    router.get('/priceSurvey', checkAuth,  handler.priceSurveyFilters);
    router.get('/shelfShares', checkAuth, handler.shelfSharesFilters);
    router.get('/personnel', checkAuth, handler.personnelFilters);
    router.get('/planogram', checkAuth, handler.planogramFilters);
    router.get('/activityList', handler.activityListFilters);
    router.get('/branch', handler.branchFilters);
    router.get('/marketingCampaign', handler.brandingActivityFilters);
    router.get('/brandingActivityCreate', handler.promotionLocationFilters);
    // router.get('/brandingAndDisplayCreate', handler.brandingAndDisplayCreateFilters);
    router.get('/itemsPrices', checkAuth, handler.itemsAndPricesFilters);
    router.get('/competitorsList', checkAuth, handler.competitorsListFilters);
    router.get('/itemsLocation', handler.selectItemsLocationFilters);
    router.get('/notifications', handler.notificationFilters);
    router.get('/notificationCreate', handler.notificationCreateFilters);
    router.get('/objectives', handler.objectiveFilters);
    router.get('/inStoreTasks', handler.inStoreTaskFilters);
    router.get('/personnelTasks', handler.personnelTasks);
    router.get('/createQuestionnary', handler.createQuestionnary);
    router.get('/questionnary', handler.questionnary);
    router.get('/consumersSurvey', require('../stories/consumersSurvey/routes/filters'));
    router.get('/createConsumersSurvey', require('../stories/consumersSurvey/routes/createFilters'));
    router.get('/competitorBranding', handler.competitorBrandingFilters);
    router.get('/competitorPromotion', handler.competitorPromotionFilters);
    router.get('/promotions', handler.promotionFilters);
    router.get('/promotions/location', handler.promotionLocationFilters);
    router.get('/achievementForm', handler.achievementFormFilters);
    router.get('/newProductLaunch', handler.newProductLaunchFilters);

    router.get('/contractsYearly/location', handler.contractsYearlyLocationFilters);
    router.get('/contractsYearly', handler.contractsYearlyFilters);
    router.get('/contractsSecondary/location', handler.contractsSecondaryLocationFilters);
    router.get('/contractsSecondary', handler.contractsSecondaryFilters);
    router.get('/documents', handler.documentsFilters);
    router.get('/notes', handler.notesFilters);
    router.get('/items/toOutlet', handler.itemsToOutletCountry);
    router.get('/contactUs', checkAuth, handler.contactUsFilters);
    router.get('/brandingAndMonthlyDisplay', checkAuth, handler.brandingAndDisplayFilters);

    return router;
};
