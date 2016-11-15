'use strict';

const express = require('express');
const router = express.Router();
const NewProductLaunch = require('../handlers/newProductLaunch');
const access = require('../helpers/access');

const ACL_MODULES = require('./../constants/aclModulesNames');


module.exports = function (db, redis, event) {
    const handler = new NewProductLaunch(db, redis, event);
    const access = require('./../helpers/access')(db);
    const checkAuth = require('./../helpers/access').checkAuth;

    router.use(checkAuth);

    router.get('/', function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, function(err, allowed, personnel) {
            if (err) {
                return next(err);
            }
            req.personnel = personnel;
            next();
        })
    }, handler.getAll);
    router.get('/:id', function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, function(err) {
            err ? next(err) : next();
        })
    }, handler.getById);

    return router;
};
