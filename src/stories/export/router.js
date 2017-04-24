const express = require('express');
const {wrap} = require('co');
const access = require('../../helpers/access');

const router = express.Router();
const checkAuth = access.checkAuth;

router.use(checkAuth);

router.get('/locations',
    checkAuth,
    wrap(require('./routes/exportLocations'))
);

module.exports = router;
