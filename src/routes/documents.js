const express = require('express');
const router = express.Router();
const DocumentHandler = require('../handlers/document');
const access = require('../helpers/access');

module.exports = function (db, redis, event) {
    'use strict';
    
    const handler = new DocumentHandler(db, redis, event);
    const checkAuth = access.checkAuth;

    router.use(checkAuth);
    
    router.post('/', handler.create);
    
    router.put('/:id([0-9a-fA-F]{24})', handler.update);
    
    router.patch('/delete', handler.delete);
    router.patch('/archive', handler.archive);
    router.patch('/move', handler.move);
    
    router.get('/folder/:id([0-9a-fA-F]{24})?', handler.getFolderContent);
    router.get('/files', handler.getRawFiles);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    return router;
};
