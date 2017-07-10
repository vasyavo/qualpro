const express = require('express');

const getAll = require('./routes/getAll');
const getFilters = require('./routes/getFilters');
const XMLExport = require('./routes/XMLExport');
const getCharts = require('./routes/getCharts');

const router = express.Router();

router.post('/', getAll);
router.post('/filters', getFilters);
router.post('/export', XMLExport);
router.post('/charts', getCharts);

module.exports = router;
