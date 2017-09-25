const express = require('express');

const getAll = require('./routes/getAll');
const getFilters = require('./routes/getFilters');
const getCharts = require('./routes/getCharts');
const XMLExport = require('./routes/XMLExport');

const router = express.Router();

router.post('/', getAll);
router.post('/filters', getFilters);
router.post('/charts', getCharts);
router.post('/export', XMLExport);

module.exports = router;
