var express = require('express');
var router = express.Router();
var filterHandler = require('../handlers/filters');
var access = require('../helpers/access');
var mongoose = require('mongoose');
var CONTENT_TYPES = require('../public/js/constants/contentType.js');

module.exports = function (db, app, redis) {
    var handler = new filterHandler(db, redis);
    var csrfProtection = app.get('csrfProtection');
    var checkAuth = access.checkAuth;

    router.use(function (req, res, next) {
        var personnelSchema = mongoose.Schemas[CONTENT_TYPES.PERSONNEL];
        var PersonnelModel = db.model(CONTENT_TYPES.PERSONNEL, personnelSchema);

        PersonnelModel.findById(req.session.uId, {
            country  : 1,
            region   : 1,
            subRegion: 1,
            branch   : 1
        }).lean().exec(function (err, personnel) {
            if (err) {
                return next(err);
            }

            if (personnel) {
                req.personnelModel = personnel;
            }

            next();
        });
    });

    router.get('/priceSurvey', checkAuth, handler.priceSurveyFilters);
    router.get('/shelfShares', checkAuth, handler.shelfSharesFilters);
    router.get('/personnel', checkAuth, handler.personnelFilters);
    router.get('/planogram', checkAuth, handler.planogramFilters);
    router.get('/activityList', handler.activityListFilters);
    router.get('/brandingAndDisplay', handler.brandingAndDisplayFilters);
    router.get('/brandingAndDisplayCreate', handler.promotionLocationFilters);
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

    return router;
};
