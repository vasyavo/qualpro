const express = require('express');
const router = express.Router();
const objectivesHandler = require('../handlers/objectives');
const access = require('../helpers/access');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const onLeaveMiddleware = require('../utils/onLeaveMiddleware');

module.exports = function (db, redis, event) {
    const handler = new objectivesHandler(db, redis, event);
    const checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/subObjective', multipartMiddleware, onLeaveMiddleware, handler.createSubObjective);
    router.post('/', multipartMiddleware, onLeaveMiddleware, handler.create);
    router.put('/:id([0-9a-fA-F]{24})', multipartMiddleware, onLeaveMiddleware, handler.update);
    router.patch('/:id([0-9a-fA-F]{24})', multipartMiddleware, onLeaveMiddleware, handler.update);

    router.get('/personnelFroSelection', handler.getPersonnelForSelection);
    router.get('/url/:imageName', handler.getUrl); //TODO: remove this, only for testing

    router.get('/', handler.getAll);
    router.get('/tree/:id([0-9a-fA-F]{24})', handler.getByIdForObjectiveTreePreview);
    router.get('/history/:id([0-9a-fA-F]{24})', handler.getByIdHistory);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    router.delete('/file', onLeaveMiddleware, handler.removeFileFromObjective);
    router.delete('/', onLeaveMiddleware, handler.deleteByIds);

    return router;
};