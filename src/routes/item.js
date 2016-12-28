/**
 * @module Item
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/item');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);


    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/item`
     *
     * Creates new item.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/item/'
     *
     * BODY:
     *  {
     *     "variant" : "56a36e05446815602bf6bc1c",
     *     "category" : "56a36686446815602bf6bc17",
     *     "country" : "56c495e48f40aa0e41615cd1",
     *     "topArchived" : false,
     *     "archived" : false,
     *     "location" : [
     *         {
     *             "country" : "56c495e48f40aa0e41615cd1",
     *             "region" : "56c495e48f40aa0e41615ce7",
     *             "subRegion" : "56c495e58f40aa0e41615ce8",
     *             "retailSegment" : "56c495e58f40aa0e41615cfa",
     *             "outlet" : "56c495e58f40aa0e41615d00"
     *         }
     *     ],
     *     "origin" : [],
     *     "ppt" : 3335,
     *     "size" : "fdsfddss",
     *     "packing" : "fdsfdssd",
     *     "barCode" : "fdsdfsds",
     *     "name" : {
     *         "en" : "enProduct1",
     *         "ar" : "arfdsfds1"
     *     }
     *  }
     *
     * @example Response example:
     *
     *  {
     *     "_id": "56d59b6d01bda8bc0754547b",
     *     "variant": "56a36e05446815602bf6bc1c",
     *     "category": "56a36686446815602bf6bc17",
     *     "country": "56c495e48f40aa0e41615cd1",
     *     "__v": 0,
     *     "editedBy": {
     *         "date": "2016-03-01T13:38:53.865Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-01T13:38:53.865Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "topArchived": false,
     *     "archived": false,
     *     "location": [
     *         {
     *             "country": "56c495e48f40aa0e41615cd1",
     *             "region": "56c495e48f40aa0e41615ce7",
     *             "subRegion": "56c495e58f40aa0e41615ce8",
     *             "retailSegment": "56c495e58f40aa0e41615cfa",
     *             "outlet": "56c495e58f40aa0e41615d00"
     *         }
     *     ],
     *     "origin": [],
     *     "ppt": 3335,
     *     "size": "fdsfddss",
     *     "packing": "fdsfdssd",
     *     "barCode": "fdsdfsds",
     *     "name": {
     *         "en": "enProduct1",
     *         "ar": "arfdsfds1"
     *     }
     *  }
     *
     * @method /item
     * @instance
     */

    router.post('/', handler.create);

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
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/item/remove`
     *
     * Archive items with ids in body
     *
     * @param {array} ids - array of item ids
     * @param {string} archived - true if item need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/item/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56d59b6d01bda8bc0754547b"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /item/remove
     * @instance
     */

    router.put('/remove', handler.archive);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/item/location`
     *
     * Updated items with specific ids.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/item/location'
     *
     * BODY:
     *  {
     *     "ids" : ["56a36e05446815602bf6bc1c"],
     *     "location" : {
     *             "country" : "56c495e48f40aa0e41615cd1",
     *             "region" : "56c495e48f40aa0e41615ce7",
     *             "subRegion" : "56c495e58f40aa0e41615ce8",
     *             "retailSegment" : "56c495e58f40aa0e41615cfa",
     *             "outlet" : "56c495e58f40aa0e41615d00"
     *         }
     *  }
     *
     * @example Response example: status
     *
     * @method /item/location
     * @instance
     */

    router.put('/location', handler.updateLocation);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/item/location`
     *
     * Updated items with specific ids.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/item/location'
     *
     * BODY:
     *  {
     *     "ids" : ["56a36e05446815602bf6bc1c"],
     *     "location" : {
     *             "country" : "56c495e48f40aa0e41615cd1",
     *             "region" : "56c495e48f40aa0e41615ce7"
     *         }
     *  }
     *
     * @example Response example: status
     *
     * @method /item/location
     * @instance
     */

    router.patch('/location', handler.updateLocation);

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

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/item/:id`
     *
     * Updated item with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/item/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     * {
     *      "subRegion": "56c495e58f40aa0e41615ceb",
     *      "retailSegment": "56c495e58f40aa0e41615cfb",
     *      "outlet": "56c495e58f40aa0e41615cfc",
     *      "linkToMap": "",
     *      "manager": null,
     *      "archived": false,
     *      "imageSrc": "data:image/png;base64,iVBORw0KGgoAA...AAAElFTkSuQmCC",
     *      "name": {
     *          "en": "enName",
     *          "ar": "arName"
     *      }
     *  }
     *
     * @example Response example: status
     *
     * @method /item/:id
     * @instance
     */

    router.put('/:id([0-9a-fA-F]{24})', handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/item/:id`
     *
     * Updated item with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/item/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     * {
     *      "subRegion": "56c495e58f40aa0e41615ceb",
     *      "retailSegment": "56c495e58f40aa0e41615cfb",
     *      "outlet": "56c495e58f40aa0e41615cfc"
     *  }
     *
     * @example Response example: status
     *
     * @method /item/:id
     * @instance
     */

    router.patch('/:id([0-9a-fA-F]{24})', handler.update);
    // router.delete('/:id', handler.remove);

    return router;
};
