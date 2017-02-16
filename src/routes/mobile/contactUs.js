'use strict';

const express = require('express');
const router = express.Router();
const ContactUsHandler = require('../../handlers/contactUs');
const access = require('../../helpers/access');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

const ACL_MODULES = require('./../../constants/aclModulesNames');

module.exports = function () {
    const handler = new ContactUsHandler();
    const checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', function(req, res, next) {
        access.getWriteAccess(req, ACL_MODULES.CONTACT_US, function(err) {
            err ? next(err) : next();
        })
    }, multipartMiddleware, handler.create);

    return router;
};