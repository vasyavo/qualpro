var express = require('express');
var router = express.Router();
var CompetitorPromotion = require('../handlers/competitorPromotion');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    'use strict';

    var handler = new CompetitorPromotion(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/', handler.getAll);
    router.get('/:id', handler.getById);

    return router;
};
