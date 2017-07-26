const express = require('express');

const locationFilters = require('./routes/locationFilters');
const personnelFilters = require('./routes/personnelFilters');

const router = express.Router();

router.post('/location/filters', locationFilters);
router.post('/location/personnel', personnelFilters);

module.exports = router;
