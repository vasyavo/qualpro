const express = require('express');

const getAll = require('./routes/getAll');
const getFilters = require('./routes/getFilters');


const router = express.Router();

router.get('/', getAll);
router.get('/filters', getFilters);

module.exports = router;
