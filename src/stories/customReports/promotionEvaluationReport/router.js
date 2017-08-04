const express = require('express');

const getAll = require('./routes/getAll');
const getCharts = require('./routes/getCharts');
const getFilters = require('./routes/getFilters');
const XMLExport = require('./routes/XMLExport');

const router = express.Router();

router.post('/', getAll);
router.post('/charts', getCharts);
router.post('/filters', getFilters);
router.post('/export', XMLExport);

module.exports = router;
