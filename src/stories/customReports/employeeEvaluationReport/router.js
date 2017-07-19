const express = require('express');

const getAll = require('./routes/getAll');
const getPersonnelRating = require('./routes/getPersonnelRating');
const getPersonnelActivity = require('./routes/getPersonnelActivity');
const getFilters = require('./routes/getFilters');

const router = express.Router();

router.post('/', getAll);
router.get('/personnelRating/:personnelId', getPersonnelRating);
router.get('/personnelActivity/:personnelId', getPersonnelActivity);
router.post('/filters', getFilters);

module.exports = router;
