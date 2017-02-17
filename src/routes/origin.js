/**
 * @module Origin
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var Handler = require('../handlers/origin');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/origin`
     *
     * Returns the all existing `origin`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link OriginModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/origin'
     *
     * @example Response example:
     *
     *  {
     *     "total": 151,
     *     "data": [
     *         {
     *             "_id": "56bb0545631d7f8e4166b8b8",
     *             "ID": "151",
     *             "name": "Chad",
     *             "__v": 0
     *         },
     *         {
     *             "_id": "56bb0545631d7f8e4166b8b9",
     *             "ID": "150",
     *             "name": "Botswana",
     *             "__v": 0
     *         }
     *     ]
     *  }
     *
     * @method /origin
     * @instance
     */

    router.get('/', handler.getAll);

    return router;
};
