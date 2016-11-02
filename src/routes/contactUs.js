'use strict';

var express = require('express');
var router = express.Router();
var ContactUsHandler = require('../handlers/contactUs');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    var handler = new ContactUsHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', multipartMiddleware, handler.create);

    return router;
};