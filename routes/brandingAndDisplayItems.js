var express = require('express');
var router = express.Router();
var BrandingAndDisplayHandler = require('../handlers/brandingAndDisplayItems');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    var handler = new BrandingAndDisplayHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', multipartMiddleware, handler.create);
    router.get('/', handler.getAll);

    return router;
};
