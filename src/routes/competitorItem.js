/**
 * @module CompetitorItem
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/competitorItem');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis,event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorItem`
     *
     * Returns the all existing `competitorItem`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link CompetitorItemModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorItem'
     *
     * @example Response example:
     *
     *  {
     *  "total": 2,
     *  "data": [{
     *              "_id": "56bc8d5da7f8db30645f7ec2",
     *              "name": {
     *                  "en": "aaa",
     *                  "ar": "bbbb"
     *              },
     *              "packing": "dfghj",
     *              "size": "dfgh",
     *              "origin": [
     *                  {
     *                      "_id": "56bb0545631d7f8e4166b8c4",
     *                      "name": "Benin"
     *                  },
     *                  {
     *                      "_id": "56bb0545631d7f8e4166b8c1",
     *                      "name": "Bahrain"
     *                  },
     *                  {
     *                      "_id": "56bb0545631d7f8e4166b8c9",
     *                      "name": "Kuwait"
     *                  },
     *                  {
     *                      "_id": "56bb0545631d7f8e4166b8d0",
     *                      "name": "Angola"
     *                  }
     *              ],
     *              "brand": {
     *                  "_id": "56bab1653cf2257456c29ad4",
     *                  "name": {
     *                      "ar": "sdfsdf",
     *                      "en": "dsdf"
     *                  }
     *              },
     *              "variant": {
     *                  "_id": "56bb4ad75c151aa009e30a17",
     *                  "name": {
     *                      "en": "dfgdfg",
     *                      "ar": "fdgdfgd"
     *                  }
     *              },
     *              "archived": false,
     *              "createdBy": {
     *                  "date": "2016-02-11T13:32:13.783Z",
     *                  "user": "569d11fbc0348a0613de61af"
     *              },
     *              "editedBy": {
     *                  "date": "2016-02-11T13:32:13.783Z",
     *                  "user": "569d11fbc0348a0613de61af"
     *              },
     *              "product": {
     *                  "_id": "56a36686446815602bf6bc17",
     *                  "name": {
     *                      "en": "something",
     *                      "ar": "arSomething"
     *                  }
     *              }
     *      }]
     *  }
     *
     * @method /competitorItem
     * @instance
     */

    router.get('/', handler.getAll);
    //router.get('/getForDD', handler.getForDD);
    //router.get('names/',handler.getNames);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorItem/:id`
     *
     * Returns existing `competitorItem` by id
     * @see {@link CompetitorItemModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorItem/56bc8d5da7f8db30645f7ec2'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56bc8d5da7f8db30645f7ec2",
     *      "brand": "56bab1653cf2257456c29ad4",
     *      "variant": "56bb4ad75c151aa009e30a17",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-11T13:32:13.783Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-11T13:32:13.783Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "archived": false,
     *      "origin": [
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c1",
     *              "name": "Bahrain"
     *          },
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c4",
     *              "name": "Benin"
     *          },
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c9",
     *              "name": "Kuwait"
     *          },
     *          {
     *              "_id": "56bb0545631d7f8e4166b8d0",
     *              "name": "Angola"
     *          }
     *      ],
     *      "size": "dfgh",
     *      "packing": "dfghj",
     *      "name": {
     *          "en": "aaa",
     *          "ar": "bbbb"
     *      }
     *  }
     *
     * @method /competitorItem/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorItem`
     *
     * Creates new competitorItem.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorItem/'
     *
     * BODY:
     *  {
     *      "name": {
     *          "en": "aaa1",
     *          "ar": "bbbb1"
     *      },
     *      "packing": "dfghj",
     *      "size": "dfgh",
     *      "origin": ["56bb0545631d7f8e4166b8c4"],
     *      "country": "56bb0545631d7f8e4166b8c4",
     *      "brand": "56bab1653cf2257456c29ad4",
     *      "competitorVariant": "56bb4ad75c151aa009e30a17",
     *      "archived": false,
     *      "product": "56a36686446815602bf6bc17"
     *      }
     *  }
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56cf21276e50aefc2a094da8",
     *      "brand": "56bab1653cf2257456c29ad4",
     *      "country": "56bb0545631d7f8e4166b8c4",
     *      "variant": "56bb4ad75c151aa009e30a17",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-25T15:43:35.273Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-25T15:43:35.273Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "archived": false,
     *      "origin": [
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c4",
     *              "name": "Benin"
     *          }
     *      ],
     *      "size": "dfgh",
     *      "packing": "dfghj",
     *      "name": {
     *          "en": "aaa",
     *          "ar": "bbbb"
     *      }
     *  }
     *
     * @method /competitorItem
     * @instance
     */

    router.post('/', handler.create);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorItem/remove`
     *
     * Archive competitorItem with ids in body
     *
     * @param {array} ids - array of branch ids
     * @param {string} archived - true if branch need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorItem/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56cef0364dc2fdac2836f747"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /competitorItem/remove
     * @instance
     */

    router.put('/remove', handler.archive);
    //router.get('/archive/:id', handler.remove);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorItem/:id`
     *
     * Updated competitorItem with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorItem/56cf24ee6e50aefc2a094da9'
     *
     * BODY:
     *  {
     *      "name": {
     *          "en": "aaa1",
     *          "ar": "bbbb1"
     *      },
     *      "packing": "dfghj",
     *      "size": "dfgh",
     *      "origin": ["56bb0545631d7f8e4166b8c4"],
     *      "country": ["56bb0545631d7f8e4166b8c4"],
     *      "brand": "56bab1653cf2257456c29ad4",
     *      "competitorVariant": "56bb4ad75c151aa009e30a17",
     *      "archived": false,
     *      "product": "56a36686446815602bf6bc17"
     *  }
     *
     * @example Response example:
     *
     *      *  {
     *      "_id": "56cf24ee6e50aefc2a094da9",
     *      "country": "56bb0545631d7f8e4166b8c4",
     *      "brand": "56bab1653cf2257456c29ad4",
     *      "variant": "56bb4ad75c151aa009e30a17",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-25T15:59:42.063Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-25T15:59:42.063Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "archived": false,
     *      "origin": [
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c4",
     *              "name": "Benin"
     *          }
     *      ],
     *      "size": "dfgh",
     *      "packing": "dfghj",
     *      "name": {
     *          "en": "aaa1",
     *          "ar": "bbbb1"
     *      }
     *  }
     *
     * @method /competitorItem/:id
     * @instance
     */

    router.put('/:id([0-9a-fA-F]{24})', handler.update);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorItem/:id`
     *
     * Updated branch with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorItem/56cf24ee6e50aefc2a094da9'
     *
     * BODY:
     *  {
     *      "name": {
     *          "en": "aaa1",
     *          "ar": "bbbb1"
     *      }
     *  }
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56cf24ee6e50aefc2a094da9",
     *      "country": "56bb0545631d7f8e4166b8c4",
     *      "brand": "56bab1653cf2257456c29ad4",
     *      "variant": "56bb4ad75c151aa009e30a17",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-25T15:59:42.063Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-25T15:59:42.063Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "archived": false,
     *      "origin": [
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c4",
     *              "name": "Benin"
     *          }
     *      ],
     *      "size": "dfgh",
     *      "packing": "dfghj",
     *      "name": {
     *          "en": "aaa1",
     *          "ar": "bbbb1"
     *      }
     *  }
     *
     * @method /competitorItem/:id
     * @instance
     */

    router.patch('/:id([0-9a-fA-F]{24})', handler.update);
    //router.delete('/:id', handler.remove);

    return router;
};
