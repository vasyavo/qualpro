'use strict';

const express = require('express');
const router = express.Router();
const BrandingActivityHandler = require('../../handlers/brandingAndDisplay');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

var ACL_MODULES = require('../../constants/aclModulesNames');


module.exports = function (db, redis, event) {
    const access = require('../../helpers/access')(db);
    const handler = new BrandingActivityHandler(db, redis, event);
    const checkAuth = access.checkAuth;

    // router.use(checkAuth);

    router.post('/', function(req, res, next) {
        access.getWriteAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, function (err) {
            err ? next(err) : next();
        })
    }, multipartMiddleware, handler.create);

    return router;
};
