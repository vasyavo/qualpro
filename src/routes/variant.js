var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/variant');

module.exports = function() {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', handler.create);
    router.get('/', handler.getAll);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);
    router.put('/remove', handler.archive);
    router.put('/:id([0-9a-fA-F]{24})', handler.update);
    router.patch('/:id([0-9a-fA-F]{24})', handler.update);
    // router.delete('/:id', handler.remove);

    return router;
};
