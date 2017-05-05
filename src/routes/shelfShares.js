/**
 * @module ShelfShare
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/shelfShare');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/brands', handler.getBrands);
    router.get('/', handler.getAll);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);
    router.put('/:id([0-9a-fA-F]{24})/item/:itemId([0-9a-fA-F]{24})', handler.update);
    router.delete('/:id([0-9a-fA-F]{24})/item/:itemId([0-9a-fA-F]{24})', handler.removeItem);

    return router;
};
