const express = require('express');

const getAll = require('./routes/getAll');
const getFilters = require('./routes/getFilters');

const router = express.Router();

router.post('/', getAll);
router.post('/filters', getFilters);

module.exports = router;
