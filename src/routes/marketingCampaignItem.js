var express = require('express');
var router = express.Router();
var BrandingActivityHandler = require('../handlers/marketingCampaignItem');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function () {
    var handler = new BrandingActivityHandler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', multipartMiddleware, handler.create);
    router.get('/', handler.getAll);
    router.delete('/:id([0-9a-fA-F]{24})', handler.removeItem);

    return router;
};
