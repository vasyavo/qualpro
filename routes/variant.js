var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/variant');

module.exports = function(db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', handler.create);
    router.get('/', handler.getAll);
    router.get('/:id', handler.getById);
    router.put('/remove', handler.archive);
    router.put('/:id', handler.update);
    router.patch('/:id', handler.update);
    // router.delete('/:id', handler.remove);

    return router;
};
