var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/note');

module.exports = function (db, redis) {
    'use strict';

    var handler = new Handler(db, redis);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', handler.create);
    router.get('/', handler.getAll);
    router.put('/remove', handler.archive);
    router.put('/:id', handler.update);
    router.patch('/:id', handler.update);
    router.delete('/:id', handler.delete);

    return router;
};
