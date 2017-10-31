const express = require('express');

const getAll = require('./routes/getAll');
const getFilters = require('./routes/getFilters');
const getDetails = require('./routes/getDetails');
const getCharts = require('./routes/getCharts');
const XMLExport = require('./routes/XMLExport');
const XMLExportDetails = require('./routes/XMLExportDetails');

const router = express.Router();

router.post('/', getAll);
router.post('/details', getDetails);
router.post('/filters', getFilters);
router.post('/charts', getCharts);
router.post('/export', XMLExport);
router.post('/exportDetails', XMLExportDetails);

module.exports = router;
