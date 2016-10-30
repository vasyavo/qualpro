var express = require('express');
var router = express.Router();
var objectivesHandler = require('../handlers/objectives');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();


module.exports = function (db, redis, event) {
    var handler = new objectivesHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/subObjective', multipartMiddleware, handler.createSubObjective);
    router.post('/duplicate', handler.duplicateObjective);
    router.post('/', multipartMiddleware, handler.create);
    router.put('/:id', multipartMiddleware, handler.update);
    router.patch('/:id', multipartMiddleware, handler.update);
    
    router.get('/personnelFroSelection', handler.getPersonnelFroSelection);
    router.get('/url/:imageName', handler.getUrl); //TODO: remove this, only for testing

    router.get('/', handler.getAll);
    router.get('/tree/:id', handler.getByIdForObjectiveTreePreview);
    router.get('/history/:id', handler.getByIdHistory);
    router.get('/:id', handler.getById);

    router.delete('/file', handler.removeFileFromObjective);
    router.delete('/', handler.deleteByIds);

    return router;
};