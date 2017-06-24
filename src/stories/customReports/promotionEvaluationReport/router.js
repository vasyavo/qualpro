const express = require('express');

const getAll = require('./routes/getAll');
const getCharts = require('./routes/getCharts');
const getFilters = require('./routes/filters/index');
const XMLExport = require('./routes/XMLExport');

const router = express.Router();

router.get('/', getAll);
router.get('/charts', getCharts);
router.get('/filters', getFilters);
router.get('/export', XMLExport);

module.exports = router;
