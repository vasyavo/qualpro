var express = require('express');
var router = express.Router();
var Handler = require('../handlers/import');
var access = require('../helpers/access');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.get('/importFromFolderPart1', checkAuth, handler.importFromFolderPart1);
    router.get('/importFromFolderPart2', checkAuth, handler.importFromFolderPart2);
    router.get('/importOrigins', checkAuth, handler.importOrigins);

    return router;
};