var express = require('express');
var router = express.Router();
var PriceSurvey = require('../handlers/priceSurvey');
var access = require('../helpers/access');

module.exports = function (db, redis, event) {
    var handler = new PriceSurvey(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/brands', handler.getBrands);
    router.get('/', handler.getAll);
    router.get('/:id', handler.getById);

    return router;
};
