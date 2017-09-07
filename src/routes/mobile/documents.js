/**
 * @module Mobile - Documents
 */

const express = require('express');
const router = express.Router();
const DocumentHandler = require('../../handlers/document');
const access = require('../../helpers/access');

module.exports = function () {
    'use strict';
    
    const handler = new DocumentHandler();
    const checkAuth = access.checkAuth;

    router.use(checkAuth);
    
    router.post('/', handler.create);
    
    router.put('/:id([0-9a-fA-F]{24})', handler.update);
    
    router.patch('/delete', handler.delete);
    router.patch('/archive', handler.archive);
    router.patch('/move', handler.move);
    
    router.get('/', handler.getAllForMobile);
    router.get('/sync', handler.getAllForSync);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);
    router.post('/getByIds', handler.getByIds);

    return router;
};