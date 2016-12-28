/**
 * @module ShelfShare
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/shelfShare');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/brands', handler.getBrands);
    router.get('/', handler.getAll);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    return router;
};
