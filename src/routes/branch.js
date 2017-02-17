/**
 * @module Branch
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var Handler = require('../handlers/branch');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/branch`
     *
     * Returns the all existing `branch`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link BranchModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/branch'
     *
     * @example Response example:
     *
     * {
     *      "total": "3",
     *      "data": [{
     *              "_id": "56c495e58f40aa0e41615d05",
     *              "ID": "30",
     *              "subRegion": {
     *                  "_id": "56c495e58f40aa0e41615ce8",
     *                  "name": {
     *                      "en": "Mansour"
     *                  }
     *              },
     *              "retailSegment": {
     *                  "_id": "56c495e58f40aa0e41615cfa",
     *                  "name": {
     *                      "en": "A-class shops",
     *                      "ar": "المحلات التجارية فئة-أ"
     *                  }
     *              },
     *              "outlet": {
     *                  "_id": "56c495e58f40aa0e41615d03",
     *                  "name": {
     *                      "en": "Spinneys",
     *                      "ar": "سبينيس"
     *                  }
     *              },
     *              "__v": 0,
     *              "editedBy": {
     *                  "date": "2016-02-17T15:46:45.224Z",
     *                  "user": null
     *              },
     *              "createdBy": {
     *                  "date": "2016-02-17T15:46:45.224Z",
     *                  "user": null
     *              },
     *              "linkToMap": "",
     *              "address": {
     *                  "en": "al alali street, 56"
     *              },
     *              "manager": null,
     *              "archived": false,
     *              "imageSrc": "data:image/png;base64,iVBORw0...yWU8AAAAAElFTkSuQmCC",
     *              "name": {
     *                  "en": "Spinneys Sudanese south branch"
     *              }
     *              }]
     * }
     *
     * @method /branch
     * @instance
     */

    router.get('/', handler.getAll);
    //router.get('/getForDD', handler.getForDD);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/branch/location`
     *
     * Returns all retailSegments and outlets from country
     * @see {@link BranchModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/branch/location?countryId=some id'
     *
     * @example Response example:
     *
     *  {
     *      "retailSegment" : [
     *          {
     *              "_id" : ObjectId("56c495e58f40aa0e41615cfa"),
     *              "ID" : "2",
     *              "configurations" : [
     *                  {
     *                      "configuration" : "55x12",
     *                      "_id" : ObjectId("56cb23ac27420dcc06bed2a8"),
     *                      "archived" : false
     *                  },
     *                  {
     *                      "configuration" : "666x98",
     *                      "_id" : ObjectId("56cc5fedb5820a9c0334849b"),
     *                      "archived" : false
     *                  }
     *              ],
     *              "editedBy" : {
     *                  "date" : ISODate("2016-02-17T15:46:45.134Z"),
     *                  "user" : null
     *              },
     *              "createdBy" : {
     *                  "date" : ISODate("2016-02-17T15:46:45.134Z"),
     *                  "user" : null
     *              },
     *              "subRegions" : [
     *                  ObjectId("56c495e58f40aa0e41615ce8"),
     *                  ObjectId("56c495e58f40aa0e41615ced"),
     *                  ObjectId("56c495e58f40aa0e41615cee"),
     *                  ObjectId("56c495e48f40aa0e41615cdd"),
     *                  ObjectId("56c495e48f40aa0e41615cdb"),
     *                  ObjectId("56c495e58f40aa0e41615cf5")
     *              ],
     *              "archived" : false,
     *               "imageSrc" : "data:image/png;base64,iVBORw0K...SuQmCC",
     *               "name" : {
     *                   "en" : "A-class shops",
     *                   "ar" : "المحلات التجارية فئة-أ"
     *               },
     *               "__v" : 0
     *           }
     *       ]
     *       "outlet" : [
     *           {
     *               "_id" : ObjectId("56c495e58f40aa0e41615d03"),
     *               "ID" : "2",
     *               "editedBy" : {
     *                   "date" : ISODate("2016-02-17T15:46:45.168Z"),
     *                   "user" : null
     *               },
     *               "createdBy" : {
     *                   "date" : ISODate("2016-02-17T15:46:45.168Z"),
     *                   "user" : null
     *               },
     *               "archived" : false,
     *               "retailSegments" : [
     *                   ObjectId("56c495e58f40aa0e41615cfa"),
     *                   ObjectId("56c495e58f40aa0e41615cf9"),
     *                  ObjectId("56c495e58f40aa0e41615cfb")
     *              ],
     *              "subRegions" : [
     *                  ObjectId("56c495e48f40aa0e41615cdb"),
     *                  ObjectId("56c495e58f40aa0e41615ce8"),
     *                  ObjectId("56c495e58f40aa0e41615cef"),
     *                  ObjectId("56c495e58f40aa0e41615cf5")
     *              ],
     *              "imageSrc" : "data:image/png;base64,iVBORw0K...SuQmCC",
     *              "name" : {
     *                  "en" : "Spinneys",
     *                  "ar" : "سبينيس"
     *              },
     *              "__v" : 0
     *          }
     *      ]
     *  }
     *
     * @method /branch/location
     * @instance
     */

    router.get('/location', handler.getLocation);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/branch/:id`
     *
     * Returns existing `branch` by id
     * @see {@link BranchModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/branch/56c495e58f40aa0e41615d05'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56c495e58f40aa0e41615d05",
     *      "ID": "30",
     *      "subRegion": "56c495e58f40aa0e41615ce8",
     *      "retailSegment": "56c495e58f40aa0e41615cfa",
     *      "outlet": "56c495e58f40aa0e41615d03",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-17T15:46:45.224Z",
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-02-17T15:46:45.224Z",
     *          "user": null
     *      },
     *      "linkToMap": "",
     *      "address": {
     *          "en": "al alali street, 56"
     *      },
     *      "manager": null,
     *      "archived": false,
     *      "imageSrc": "data:image/png;base64,iVBORw0KGgoAAA...SuQmCC",
     *      "name": {
     *          "en": "Spinneys Sudanese south branch"
     *      }
     *  }
     *
     * @method /branch/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/branch`
     *
     * Creates new branch.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/branch/'
     *
     * BODY:
     *  {
     *    "name" : {
     *      "en": "enName",
     *      "ar": "arName"
     *    },
     *    "subRegion" : "56c495e58f40aa0e41615ceb",
     *    "retailSegment" : "56c495e58f40aa0e41615cf7",
     *    "outlet" : "56c495e58f40aa0e41615cfc"
     *  }
     *
     * @example Response example:
     *
     *  {
     *      "__v": 0,
     *      "subRegion": "56c495e58f40aa0e41615ceb",
     *      "retailSegment": "56c495e58f40aa0e41615cf7",
     *      "outlet": "56c495e58f40aa0e41615cfc",
     *      "_id": "56cef0364dc2fdac2836f747",
     *      "editedBy": {
     *          "date": "2016-02-25T12:14:46.181Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-25T12:14:46.181Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "linkToMap": "",
     *      "manager": null,
     *      "archived": false,
     *      "imageSrc": "data:image/png;base64,iVBORw0KGgo...AAAElFTkSuQmCC",
     *      "name": {
     *          "en": "enName",
     *          "ar": "arName"
     *      }
     *  }
     *
     * @method /branch
     * @instance
     */

    router.post('/', handler.create);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/branch/remove`
     *
     * Archive branches with ids in body
     *
     * @param {array} ids - array of branch ids
     * @param {string} archived - true if branch need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/branch/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56cef0364dc2fdac2836f747"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /branch/remove
     * @instance
     */

    router.put('/remove', handler.archive);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/branch/:id`
     *
     * Updated branch with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/branch/55eeb7b58f9c1deb19000005'
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
     * @method /branch/:id
     * @instance
     */

    router.put('/:id([0-9a-fA-F]{24})', handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/branch/:id`
     *
     * Updated branch with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/branch/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     *  {
     *    "retailSegment":"56c495e58f40aa0e41615cfb"
     *  }
     *
     * @example Response example: status
     *
     * @method /branch/:id
     * @instance
     */

    router.patch('/:id([0-9a-fA-F]{24})', handler.update);

    return router;
};
