const express = require('express');

const getAll = require('./routes/getAll');
const getDetails = require('./routes/getDetails');
const getCharts = require('./routes/getCharts');
const getFilters = require('./routes/getFilters');
const XMLExport = require('./routes/XMLExport');
const XMLExportDetails = require('./routes/XMLExportDetails');

const router = express.Router();

router.get('/', getAll);
router.get('/details', getDetails);
router.get('/charts', getCharts);
router.get('/filters', getFilters);
router.get('/exportDetails', XMLExportDetails);
router.get('/export', XMLExport);

module.exports = router;
