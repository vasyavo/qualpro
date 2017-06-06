const express = require('express');

const getAll = require('./routes/getAll');

const router = express.Router();

router.get('/', getAll);

module.exports = router;
