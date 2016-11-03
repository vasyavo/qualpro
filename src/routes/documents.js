var express = require('express');
var router = express.Router();
var DocumentHandler = require('../handlers/document');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    'use strict';

    var handler = new DocumentHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', multipartMiddleware, handler.create);
    router.put('/remove', handler.archive);
    router.get('/', handler.getAll);
    router.get('/:id', handler.getById);
    router.put('/:id', multipartMiddleware, handler.update);
    router.patch('/:id', handler.update);

    return router;
};