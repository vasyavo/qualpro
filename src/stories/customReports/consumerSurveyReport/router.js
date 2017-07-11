const express = require('express');

const getFilters = require('./routes/getFilters');

const router = express.Router();

router.post('/filters', getFilters);

module.exports = router;
