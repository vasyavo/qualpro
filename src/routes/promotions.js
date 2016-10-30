var express = require('express');
var router = express.Router();
var PromotionsHandler = require('../handlers/promotions');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    var handler = new PromotionsHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', multipartMiddleware, handler.create);
    router.put('/:id', multipartMiddleware, handler.update);
    router.patch('/:id', handler.update);

    router.get('/', handler.getAll);
    router.get('/:id', handler.getById);
    return router;
};
