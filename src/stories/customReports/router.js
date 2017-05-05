const express = require('express');
const access = require('../../helpers/access');

const achievementReport = require('./achievementReport/router');
const priceReport = require('./priceReport/router');
const promotionEvaluationReport = require('./promotionEvaluationReport/router');
const shelfShareReport = require('./shelfShareReport/router');

const router = express.Router();
const checkAuth = access.checkAuth;

router.use(checkAuth);

router.use('/shelfShareReport', shelfShareReport);
router.use('/promotionEvaluationReport', promotionEvaluationReport);
router.use('/achievementReport', achievementReport);
router.use('/priceReport', priceReport);

module.exports = router;
