const express = require('express');

const getAll = require('./routes/getAll');
const getFilters = require('./routes/getFilters');
const getCharts = require('./routes/getCharts');
const getPersonnelSummary = require('./routes/getPersonnelSummary');
const getPersonnelSkillsRate = require('./routes/getPersonnelSkillsRate');
const getPersonnelPerformanceRating = require('./routes/getPersonnelPerformanceRating');
const XMLExport = require('./routes/XMLExport');

const router = express.Router();

router.post('/', getAll);
router.post('/filters', getFilters);
router.post('/charts', getCharts);
router.get('/personnelSummary/:personnelId', getPersonnelSummary);
router.get('/personnelSkillsRate/:personnelId', getPersonnelSkillsRate);
router.get('/personnelPerformanceRating/:personnelId', getPersonnelPerformanceRating);
router.get('/export', XMLExport);

module.exports = router;
