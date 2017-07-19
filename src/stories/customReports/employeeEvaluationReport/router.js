const express = require('express');

const getAll = require('./routes/getAll');
const getPersonnelRating = require('./routes/getPersonnelRating');
const getFilters = require('./routes/getFilters');

const router = express.Router();

router.post('/', getAll);
router.get('/personnelRating/:personnelId', getPersonnelRating);
router.post('/filters', getFilters);

module.exports = router;
