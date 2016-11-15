'use strict';

var express = require('express');
var router = express.Router();
var ContactUsHandler = require('../handlers/contactUs');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

const ACL_MODULES = require('./../constants/aclModulesNames');

module.exports = function (db, redis, event) {
    const handler = new ContactUsHandler(db, redis, event);
    const access = require('./../helpers/access')(db);
    const checkAuth = require('./../helpers/access').checkAuth;
    router.use(checkAuth);

    router.get('/', function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.CONTACT_US, function(err) {
            err ? next(err) : next();
        })
    }, handler.getAll);
    router.get('/:id([0-9a-fA-F]{24})',function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.CONTACT_US, function(err) {
            err ? next(err) : next();
        })
    }, handler.getById);

    router.put('/:id([0-9a-fA-F]{24})', function(req, res, next) {
        access.getEditAccess(req, ACL_MODULES.CONTACT_US, function(err) {
            err ? next(err) : next();
        })
    }, handler.updateById);

    router.post('/', multipartMiddleware, handler.create);

    return router;
};