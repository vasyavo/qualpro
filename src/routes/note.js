const express = require('express');
const router = express.Router();
const noteHandler = require('../handlers/note');
const access = require('../helpers/access');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    'use strict';

    const handler = new noteHandler(db, redis, event);
    const checkAuth = access.checkAuth;

    router.use(checkAuth);
    
    router.get('/', handler.getAll);
    router.get('/sync', handler.getAllForSync);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);
    
    router.post('/', multipartMiddleware, handler.create);
    
    router.put('/remove', handler.archive);
    router.put('/:id([0-9a-fA-F]{24})', multipartMiddleware, handler.update);
    
    router.patch('/:id([0-9a-fA-F]{24})', multipartMiddleware, handler.update);
    
    router.delete('/:id([0-9a-fA-F]{24})', handler.delete);

    return router;
};