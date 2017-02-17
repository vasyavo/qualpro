/**
 * @module Item
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/itemHistory');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/item`
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
     *     'http://192.168.88.15:9797/item'
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
     * @method /item
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/item/:id`
     *
     * Returns existing `item` by id
     * @see {@link ItemModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/item/56bccca85f4226c829f671f5'
     *
     * @example Response example:
     *
     *  {
     *     "_id": "56bccca85f4226c829f671f5",
     *     "variant": "56a36bf3446815602bf6bc1a",
     *     "category": "56a36686446815602bf6bc17",
     *     "__v": 0,
     *     "editedBy": {
     *         "date": "2016-02-11T18:02:16.498Z",
     *         "user": "569d11fbc0348a0613de61af"
     *     },
     *     "createdBy": {
     *         "date": "2016-02-11T18:02:16.498Z",
     *         "user": "569d11fbc0348a0613de61af"
     *     },
     *     "topArchived": false,
     *     "archived": true,
     *     "location": [
     *         {
     *             "outlet": "56a23e3952c4a272764bf5d7",
     *             "country": "56a23e3852c4a272764bf5ac",
     *             "region": "56a23e3852c4a272764bf5c2",
     *             "subRegion": "56a23e3852c4a272764bf5c3",
     *             "retailSegment": "56a23e3952c4a272764bf5d6"
     *         },
     *         {
     *             "country": "56a23e3852c4a272764bf5ac",
     *             "region": "56a23e3852c4a272764bf5c2",
     *             "subRegion": "56a23e3852c4a272764bf5c3",
     *             "retailSegment": "56a23e3952c4a272764bf5d6",
     *             "outlet": "56a23e3952c4a272764bf5da"
     *         },
     *         {
     *             "country": "56c495e48f40aa0e41615cd1",
     *             "region": "56c495e48f40aa0e41615ce7",
     *             "subRegion": "56c495e58f40aa0e41615ce8",
     *             "retailSegment": "56c495e58f40aa0e41615cfa",
     *             "outlet": "56c495e58f40aa0e41615d04"
     *         }
     *     ],
     *     "origin": [
     *         {
     *             "_id": "56bb0545631d7f8e4166b8d0",
     *             "name": "Angola"
     *         }
     *     ],
     *     "ppt": 343242,
     *     "size": "fsdfds",
     *     "packing": "dsfs",
     *     "barCode": "45434534",
     *     "name": {
     *         "en": "gffdgdf",
     *         "ar": "fdgdfgdfg"
     *     }
     *  }
     *
     * @method /item/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    return router;
};
