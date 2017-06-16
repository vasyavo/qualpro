const express = require('express');

const getAll = require('./routes/getAll');
const getCharts = require('./routes/getCharts');
const getFilters = require('./routes/getFilters');
const XMLExport = require('./routes/XMLExport');
const getDetails = require('./routes/getDetails');

const router = express.Router();

router.get('/', getAll);
router.get('/charts', getCharts);
router.get('/filters', getFilters);
router.get('/export', XMLExport);
router.get('/details', getDetails);

module.exports = router;
