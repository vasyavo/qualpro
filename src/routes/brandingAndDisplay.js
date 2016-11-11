'use strict';

const express = require('express');
const router = express.Router();
const BrandingActivityHandler = require('./../handlers/brandingAndDisplay');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

var ACL_MODULES = require('./../constants/aclModulesNames');


module.exports = function (db, redis, event) {
    const access = require('./../helpers/access')(db);
    const handler = new BrandingActivityHandler(db, redis, event);
    const checkAuth = require('./../helpers/access').checkAuth;

    // router.use(checkAuth);

    router.get('/:id([0-9a-fA-F]{24})', /*function(req, res, next) {
     access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, function (err) {
     err ? next(err) : next();
     })
     },*/ handler.getById);

    router.get('/', /*function(req, res, next) {
     access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, function (err) {
     err ? next(err) : next();
     })
     },*/ handler.getAll);

    return router;
};
