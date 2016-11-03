var express = require('express');
var router = express.Router();
var noteHandler = require('../handlers/note');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    'use strict';

    var handler = new noteHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);


    router.post('/', multipartMiddleware, handler.create);


    router.put('/remove', handler.archive);
    router.put('/:id', multipartMiddleware, handler.update);


    router.patch('/:id', multipartMiddleware, handler.update);


    router.delete('/:id', handler.delete);


    router.get('/', handler.getAll);
    router.get('/:id', handler.getById);



    return router;
};