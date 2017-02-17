const express = require('express');
const router = express.Router();
const CompetitorBranding = require('../handlers/competitorBranding');

const ACL_MODULES = require('./../constants/aclModulesNames');

module.exports = function () {
    const access = require('./../helpers/access')();
    const handler = new CompetitorBranding();
    const checkAuth = require('./../helpers/access').checkAuth;

    router.use(checkAuth);

    router.get('/', function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function(err) {
            err ? next(err) : next();
        })
    }, handler.getAll);
    router.get('/:id([0-9a-fA-F]{24})', function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function(err) {
            err ? next(err) : next();
        })
    }, handler.getById);

    return router;
};