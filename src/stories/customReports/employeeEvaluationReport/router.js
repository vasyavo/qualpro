const express = require('express');

const getAll = require('./routes/getAll');
const getPersonnelRating = require('./routes/getPersonnelRating');
const getPersonnelActivity = require('./routes/getPersonnelActivity');
const getFilters = require('./routes/getFilters');
const getCharts = require('./routes/getCharts');
const XMLExport = require('./routes/XMLExport');

const router = express.Router();

router.post('/', getAll);
router.post('/charts', getCharts);
router.get('/personnelRating/:personnelId', getPersonnelRating);
router.get('/personnelActivity/:personnelId', getPersonnelActivity);
router.post('/filters', getFilters);
router.post('/export', XMLExport);

module.exports = router;
