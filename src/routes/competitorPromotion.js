var express = require('express');
var router = express.Router();
var CompetitorPromotion = require('../handlers/competitorPromotion');
var access = require('../helpers/access');

module.exports = function () {
    'use strict';

    var handler = new CompetitorPromotion();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/', handler.getAll);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    return router;
};
