var express = require('express');
var router = express.Router();
var FileHandler = require('../handlers/file');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    var handler = new FileHandler(db);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);
    
    router.get('/:bucket/:id', handler.getById);

    router.post('/', handler.uploadFile);

    router.delete('/', handler.deleteFile);

    return router;
};
