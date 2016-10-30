var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');
var Handler = require('../../handlers/variant');

module.exports = function(db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/', handler.getAll);

    router.get('/sync', handler.getAllForSync);

    return router;
};
