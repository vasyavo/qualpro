const express = require('express');

const locationFilters = require('./routes/locationFilters');
const personnelFilters = require('./routes/personnelFilters');
const productFilters = require('./routes/productFilters');
const brandFilters = require('./routes/brandFilters');
const variantFilters = require('./routes/variantFilters');

const router = express.Router();

router.post('/location/filters', locationFilters);
router.post('/employee/filters', personnelFilters);
router.post('/product/filters', productFilters);
router.post('/brand/filters', brandFilters);
router.post('/variant/filters', variantFilters);

module.exports = router;
