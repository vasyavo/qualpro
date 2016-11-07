'use strict';

var express = require('express');
var router = express.Router();

var ConsumerSurvey = require('../handlers/consumerSurvey');
var ACL_MODULES = require('../constants/aclModulesNames');

module.exports = function (db, redis, event) {
    var access = require('../helpers/access')(db);
    var handler = new ConsumerSurvey(db, redis, event);
    var checkAuth = access.checkAuth;

    // router.use(checkAuth);

    router.post('/', function(req, res, next) {
        access.getWriteAccess(req, ACL_MODULES.CONSUMER_SURVEY, function(err) {
            if (err) {
                return next(err);
            }
            next();
        })
    },handler.create);

    // router.get('/', handler.getAll);
    // router.get('/:id([0-9a-fA-F]{24})', handler.getById);
    // router.put('/:id([0-9a-fA-F]{24})', handler.updateById);

    return router;
};