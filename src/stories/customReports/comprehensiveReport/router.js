const express = require('express');

const locationFilters = require('./routes/locationFilters');
const personnelFilters = require('./routes/personnelFilters');
const productFilters = require('./routes/productFilters');

const router = express.Router();

router.post('/location/filters', locationFilters);
router.post('/employee/filters', personnelFilters);
router.post('/product/filters', productFilters);

module.exports = router;
