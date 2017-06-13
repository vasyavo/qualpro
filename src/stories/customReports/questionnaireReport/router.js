const express = require('express');

const getCharts = require('./routes/getCharts');
const getFilters = require('./routes/getFilters');

const router = express.Router();

router.get('/charts', getCharts);
router.get('/filters', getFilters);

module.exports = router;
