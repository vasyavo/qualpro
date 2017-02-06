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
    
    router.post('/', handler.create);
    
    router.put('/:id([0-9a-fA-F]{24})', handler.update);
    
    router.patch('/delete', handler.delete);
    router.patch('/archive', handler.archive);
    
    router.get('/folder/:id([0-9a-fA-F]{24})?', handler.getFolderContent);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);
    
    
    // router.put('/remove', handler.archive);
    // router.put('/:id([0-9a-fA-F]{24})', multipartMiddleware, handler.update);
    // router.patch('/:id([0-9a-fA-F]{24})', handler.update);

    return router;
};