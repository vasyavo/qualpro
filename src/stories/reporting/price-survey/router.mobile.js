const express = require('express');
const isAuth = require('./../../../helpers/access').checkAuth;
const handlers = require('./handlers');

const router = express.Router();

router.use(isAuth);
router.post('/', handlers.create);

module.exports = router;

