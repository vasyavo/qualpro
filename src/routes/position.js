/**
 * @module Position
 */

var express = require('express');
var router = express.Router();
var positionHandler = require('../handlers/position');

var access = require('../helpers/access');

module.exports = function () {
    var handler = new positionHandler();
    var checkAuth = access.checkAuth;


    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/position/getForDD`
     *
     * Returns the all existing `position`
     *
     * @see {@link PositionModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/position/getForDD'
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
     * @method /position/getForDD
     * @instance
     */

    router.get('/getForDd', checkAuth, handler.getForDD);

    return router;
};
