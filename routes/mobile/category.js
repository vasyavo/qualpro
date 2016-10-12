/**
 * @module Category
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');
var Handler = require('../../handlers/category');

module.exports = function(db, redis, event) {
    var handler = new Handler(db);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/category`
     *
     * Returns the all existing `category`
     *
     * @see {@link CategoryModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/category'
     *
     * @example Response example:
     *
     *  [{
     *      "_id": "56a0d0cd2c9618d142f45478",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-01-22T13:07:16.265Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "createdBy": {
     *          "date": "2016-01-21T12:36:29.060Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "topArchived": false,
     *      "archived": true,
     *      "name": {
     *          "ar": "dfdsfdsfdsgnhgfhgfhf",
     *          "en": "ggggggggnbgv"
     *      }
     *  }]
     *
     * @method /category
     * @instance
     */

    router.get('/', handler.getAll);

    router.get('/sync', handler.getAllForSync);

    return router;
};
