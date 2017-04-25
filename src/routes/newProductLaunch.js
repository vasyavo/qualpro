'use strict';

const express = require('express');
const router = express.Router();
const NewProductLaunch = require('../handlers/newProductLaunch');
const access = require('../helpers/access');

const ACL_MODULES = require('./../constants/aclModulesNames');


module.exports = function () {
    const handler = new NewProductLaunch();
    const access = require('./../helpers/access')();
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
    router.get('/:id([0-9a-fA-F]{24})', function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, function(err) {
            err ? next(err) : next();
        })
    }, handler.getById);

    router.put('/:id([0-9a-fA-F]{24})', function(req, res, next) {
        access.getEditAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, function(err) {
            err ? next(err) : next();
        })
    }, handler.update);

    return router;
};
