var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');
var Handler = require('../../handlers/variant');

module.exports = function() {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/', handler.getAll);

    router.get('/sync', handler.getAllForSync);

    return router;
};
