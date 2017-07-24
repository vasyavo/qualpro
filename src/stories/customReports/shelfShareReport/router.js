const express = require('express');

const getAll = require('./routes/getAll');
const getDetails = require('./routes/getDetails');
const getCharts = require('./routes/getCharts');
const getFilters = require('./routes/getFilters');
const XMLExport = require('./routes/XMLExport');
const XMLExportDetails = require('./routes/XMLExportDetails');

const router = express.Router();

router.post('/', getAll);
router.post('/details', getDetails);
router.post('/charts', getCharts);
router.post('/filters', getFilters);
router.post('/exportDetails', XMLExportDetails);
router.post('/export', XMLExport);

module.exports = router;
