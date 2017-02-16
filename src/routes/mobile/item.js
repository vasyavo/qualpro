/**
 * @module Mobile - Item
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/item');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/item`
     *
     * Returns the all existing `item`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link ItemModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/item'
     *
     * @example Response example:
     *
     *  {
     *      "total": 1,
     *      "data": [{
     *              "_id": "56a36686446815602bf6bc17",
     *              "categoryName": {
     *                  "en": "something",
     *                  "ar": "arSomething"
     *              },
     *              "variants": [{
     *                          "_id": "56a36bf3446815602bf6bc1a",
     *                          "variantName": {
     *                              "en": "entext",
     *                              "ar": "artest"
     *                          },
     *                          "items": [{
     *                                   "_id": "56bccca85f4226c829f671f5",
     *                                   "name": {
     *                                      "en": "gffdgdf",
     *                                      "ar": "fdgdfgdfg"
     *                                   },
     *                                   "barCode": "45434534",
     *                                   "packing": "dsfs",
     *                                   "size": "fsdfds",
     *                                   "ppt": 343242,
     *                                   "origin": [
     *                                      {
     *                                          "_id": "56bb0545631d7f8e4166b8d0",
     *                                          "name": "Angola"
     *                                      }
     *                                   ],
     *                                   "category": {
     *                                      "_id": "56a36686446815602bf6bc17",
     *                                      "name": {
     *                                         "en": "something",
     *                                         "ar": "arSomething"
     *                                      }
     *                                   },
     *                                   "variant": {
     *                                      "_id": "56a36bf3446815602bf6bc1a",
     *                                      "name": {
     *                                          "en": "entext",
     *                                          "ar": "artest"
     *                                      }
     *                                   },
     *                                   "archived": false,
     *                                   "createdBy": {
     *                                      "date": "2016-02-11T18:02:16.498Z",
     *                                      "user": "569d11fbc0348a0613de61af"
     *                                   },
     *                                   "editedBy": {
     *                                      "date": "2016-02-11T18:02:16.498Z",
     *                                      "user": "569d11fbc0348a0613de61af"
     *                                   }
     *                                   }]
     *              }]
     *      }]
     *  }
     *
     * @method /mobile/item
     * @instance
     */

    router.get('/', handler.getAll);

    router.get('/sync', handler.getAllForSync);

    return router;
};

