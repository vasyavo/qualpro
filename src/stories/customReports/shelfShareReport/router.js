const express = require('express');

const getAll = require('./routes/getAll');
const getDetails = require('./routes/getDetails');
const getCharts = require('./routes/getCharts');
const getFilters = require('./routes/getFilters');

const router = express.Router();

router.get('/', getAll);
router.get('/details', getDetails);
router.get('/charts', getCharts);
router.get('/filters', getFilters);

module.exports = router;
