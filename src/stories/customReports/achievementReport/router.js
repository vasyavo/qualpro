const express = require('express');

const getAll = require('./routes/getAll');
const getCharts = require('./routes/getCharts');
const getFilters = require('./routes/getFilters');

const router = express.Router();

router.get('/', getAll);
router.get('/charts', getCharts);
router.get('/filters', getFilters);

module.exports = router;
