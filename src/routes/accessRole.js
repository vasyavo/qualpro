/**
 * @module Access Roles
 */

var express = require('express');
var router = express.Router();
var AccessRoleHandler = require('../handlers/accessRole');

var access = require('../helpers/access');

module.exports = function () {
    'use strict';

    var handler = new AccessRoleHandler();
    var checkAuth = access.checkAuth;

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/accessRole/getForDD`
     *
     * Returns the all existing `accessRole`
     *
     * @see {@link PositionModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/accessRole/getForDD'
     *
     * @example Response example:
     *
     *  [{
     *      "_id": "56c495e58f40aa0e41615d23",
     *      "name": {
     *          "en": "Marketing manager"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d24",
     *      "name": {
     *          "en": "Project manager"
     *      }
     *  }]
     *
     * @method /accessRole/getForDD
     * @instance
     */

    router.get('/getForDd', checkAuth, handler.getForDD);

    return router;
};