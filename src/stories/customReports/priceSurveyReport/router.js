const express = require('express');

const getAll = require('./routes/getAll');
const getFilters = require('./routes/getFilters');
const XMLExport = require('./routes/XMLExport');

const router = express.Router();

router.get('/', getAll);
router.get('/filters', getFilters);
router.get('/export', XMLExport);

module.exports = router;
