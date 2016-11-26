var express = require('express');
var router = express.Router();
var filterHandler = require('../handlers/filters');
var access = require('../helpers/access');
const PersonnelModel = require('./../types/personnel/model');

module.exports = function(db, app, redis) {
    var handler = new filterHandler(db, redis);
    var csrfProtection = app.get('csrfProtection');
    var checkAuth = access.checkAuth;

    const storePersonnelBeforeInMiddleware = (req, res, next) => {
        const uid = req.session.uId;
        const selection = {
            country : 1,
            region : 1,
            subRegion : 1,
            branch : 1
        };

        PersonnelModel.findById(uid, selection)
            .lean()
            .exec((err, personnel) => {
                if (err) {
                    return next(err);
                }

                if (personnel) {
                    req.personnelModel = personnel;
                }

                next();
            });
    };

    router.use(storePersonnelBeforeInMiddleware); // fixme why this middleware mounted before auth check?

    router.get('/priceSurvey', checkAuth, handler.priceSurveyFilters);
    router.get('/shelfShares', checkAuth, handler.shelfSharesFilters);
    router.get('/personnel', checkAuth, handler.personnelFilters);
    router.get('/planogram', checkAuth, handler.planogramFilters);
    router.get('/activityList', handler.activityListFilters);
    router.get('/brandingActivity', handler.brandingActivityFilters);
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
    router.get('/brandingAndDisplayNew', checkAuth, handler.brandingAndDisplayFilters);

    return router;
};
