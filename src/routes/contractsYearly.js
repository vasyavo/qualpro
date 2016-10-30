var express = require('express');
var router = express.Router();
var ContractHandler = require('../handlers/contractYearly');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    'use strict';

    var handler = new ContractHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', multipartMiddleware, handler.create);
    router.put('/:id', multipartMiddleware, handler.update);
    router.patch('/:id', handler.update);

    // router.put('/remove', handler.archive);

    router.get('/:id', handler.getById);

    router.get('/', handler.getAll);

    return router;
};
