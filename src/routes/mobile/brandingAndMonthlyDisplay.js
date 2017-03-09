const express = require('express');
const multipart = require('connect-multiparty');
const handlers = require('./../../handlers/brandingAndMonthlyDisplay');

const router = express.Router();
const multipartMiddleware = multipart();

const checkAuth = require('./../../helpers/access').checkAuth;

router.use(checkAuth);
router.post('/', multipartMiddleware, handlers.create);

module.exports = router;
