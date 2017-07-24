const express = require('express');

const getAll = require('./routes/getAll');
const getFilters = require('./routes/filters/index');
const getCharts = require('./routes/getCharts');

const router = express.Router();

router.post('/', getAll);
router.post('/filters', getFilters);
router.post('/charts', getCharts);
router.post('/charts', getCharts);

module.exports = router;