var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var MonthlyHandler = require('../handlers/monthly');
var BiYearlyHandler = require('../handlers/biYearly');

module.exports = function(db, redis, event) {
    var monthlyHandler = new MonthlyHandler(db, event);
    var biYearlyHandler = new BiYearlyHandler(db, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/monthly', monthlyHandler.create);
    router.post('/biYearly', biYearlyHandler.create);
    router.get('/monthly', monthlyHandler.getAll);
    router.get('/biYearly', biYearlyHandler.getAll);
    router.get('/monthly/create', monthlyHandler.getForCreate);
    router.get('/monthly/:id', monthlyHandler.getById);
    router.get('/biYearly/:id', biYearlyHandler.getById);
    router.put('/monthly/:id', monthlyHandler.update);
    router.put('/biYearly/:id', biYearlyHandler.update);
    router.patch('/monthly/:id', monthlyHandler.update);
    router.patch('/biYearly/:id', biYearlyHandler.update);
    // router.delete('/:type/:id', handler.remove);

    return router;
};
