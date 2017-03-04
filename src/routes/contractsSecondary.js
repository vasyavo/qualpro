var express = require('express');
var router = express.Router();
var ContractHandler = require('../handlers/contractSecondary');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function () {

    var handler = new ContractHandler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', multipartMiddleware, handler.create);
    router.put('/:id([0-9a-fA-F]{24})', multipartMiddleware, handler.update);
    router.patch('/:id([0-9a-fA-F]{24})', handler.update);

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    router.get('/', handler.getAll);

    return router;
};