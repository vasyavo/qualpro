const express = require('express');
const access = require('../../helpers/access');

const achievementReport = require('./achievementReport/router');
const priceReport = require('./priceReport/router');
const promotionEvaluationReport = require('./promotionEvaluationReport/router');
const shelfShareReport = require('./shelfShareReport/router');
const newProductLaunchReport = require('./newProductLaunchReport/router');
const competitorPromoReport = require('./competitorPromoReport/router');
const priceSurveyReport = require('./priceSurveyReport/router');
const inStoreTaskReport = require('./inStoreTaskReport/router');
const objectiveReport = require('./objectiveReport/router');
const distributionListReport = require('./distributionListReport/router');

const router = express.Router();
const checkAuth = access.checkAuth;

router.use(checkAuth);

router.use('/newProductLaunchReport', newProductLaunchReport);
router.use('/shelfShareReport', shelfShareReport);
router.use('/promotionEvaluationReport', promotionEvaluationReport);
router.use('/achievementReport', achievementReport);
router.use('/priceReport', priceReport);
router.use('/competitorPromoReport', competitorPromoReport);
router.use('/priceSurveyReport', priceSurveyReport);
router.use('/inStoreTaskReport', inStoreTaskReport);
router.use('/objectiveReport', objectiveReport);
router.use('/distributionListReport', distributionListReport);

module.exports = router;
