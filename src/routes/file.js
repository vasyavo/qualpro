var express = require('express');
var router = express.Router();
var FileHandler = require('../handlers/file');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function () {
    var handler = new FileHandler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/:id', handler.getFileById);
    router.get('/:bucket/:id', handler.getById);

    router.post('/', multipartMiddleware, handler.uploadFileHandler);

    return router;
};
