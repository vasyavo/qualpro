/**
 * @module Mobile - Access Roles
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/accessRole');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/accessRole`
     *
     * Returns the all existing `accessRoles`
     *
     * @example Request example:
     *     'http://194.42.200.114:9797/mobile/accessRole'
     *
     * @example Response example:
     *
     *  [{
     *      "_id": "56c495e58f40aa0e41615d2b",
     *      "level": 9,
     *      "name": {
     *          "en": "Country uploader"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d2c",
     *      "level": 8,
     *      "name": {
     *          "en": "Master uploader"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d2d",
     *      "level": 7,
     *      "name": {
     *          "en": "Cash van"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d2e",
     *      "level": 6,
     *      "name": {
     *          "en": "Merchandiser"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d2f",
     *      "level": 5,
     *      "name": {
     *          "en": "Salesman"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d30",
     *      "level": 4,
     *      "name": {
     *          "en": "Area in charge Manager"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d31",
     *      "level": 3,
     *      "name": {
     *          "en": "Area Manager"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d32",
     *      "level": 2,
     *      "name": {
     *          "en": "Country Admin"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615d33",
     *      "level": 1,
     *      "name": {
     *          "en": "Master Admin"
     *      }
     *  }]
     *
     * @method /mobile/accessRole
     * @instance
     */

    router.get('/', handler.getAll);

    return router;
};
