/**
 * @module Outlet
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var Handler = require('../handlers/outlet');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/outlet`
     *
     * Returns the all existing `outlet`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link OutletModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/outlet'
     *
     * @example Response example:
     *
     *  {
     *  "total": 9,
     *  "data": [{
     *      "_id": "56c495e58f40aa0e41615cfc",
     *      "ID": "9",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-17T15:46:45.161Z",
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-02-17T15:46:45.161Z",
     *          "user": null
     *      },
     *      "archived": false,
     *      "retailSegments": [
     *          "56c495e58f40aa0e41615cf7",
     *          "56c495e58f40aa0e41615cf8",
     *          "56c495e58f40aa0e41615cf6"
     *      ],
     *      "subRegions": [
     *          "56c495e58f40aa0e41615ceb",
     *          "56c495e58f40aa0e41615ce8",
     *          "56c495e58f40aa0e41615ce9",
     *          "56c495e58f40aa0e41615cea"
     *      ],
     *      "imageSrc": "data:image/png;base64,iVBORw0...AAAAElFTkSuQmCC",
     *      "name": {
     *          "en": "Choithrams"
     *      }
     *  }]
     * }
     *
     * @method /outlet
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/outlet/getForDD`
     *
     * Returns the all existing `outlet`
     *
     * @see {@link OutletModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/outlet/getForDD'
     *
     * @example Response example:
     *
     *  [{
     *      "_id": "56c495e58f40aa0e41615cfc",
     *      "name": {
     *          "en": "Choithrams"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615cfd",
     *      "name": {
     *          "en": "Lifco group of companies"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615cfe",
     *      "name": {
     *          "en": "Aswaaq"
     *      }
     *  }]
     *
     * @method /outlet/getForDD
     * @instance
     */

    router.get('/getForDd', handler.getForDD);
    // router.get('names/',handler.getNames);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/outlet/:id`
     *
     * Returns existing `outlet` by id
     * @see {@link OutletModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/outlet/56c495e58f40aa0e41615cfc'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56c495e58f40aa0e41615cfc",
     *      "ID": "9",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-17T15:46:45.161Z",
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-02-17T15:46:45.161Z",
     *          "user": null
     *      },
     *      "archived": false,
     *      "retailSegments": [
     *          "56c495e58f40aa0e41615cf7",
     *          "56c495e58f40aa0e41615cf8",
     *          "56c495e58f40aa0e41615cf6"
     *      ],
     *      "subRegions": [
     *          "56c495e58f40aa0e41615ceb",
     *          "56c495e58f40aa0e41615ce8",
     *          "56c495e58f40aa0e41615ce9",
     *          "56c495e58f40aa0e41615cea"
     *      ],
     *      "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANS...AAAElFTkSuQmCC",
     *      "name": {
     *          "en": "Choithrams"
     *      }
     *  }
     *
     * @method /outlet/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/outlet`
     *
     * Creates new outlet.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/outlet/'
     *
     * BODY:
     *  {
     *     "archived": false,
     *     "retailSegments": [
     *         "56c495e58f40aa0e41615cf7",
     *         "56c495e58f40aa0e41615cf8",
     *         "56c495e58f40aa0e41615cf6"
     *     ],
     *     "subRegions": [
     *         "56c495e58f40aa0e41615ceb",
     *         "56c495e58f40aa0e41615ce8",
     *         "56c495e58f40aa0e41615ce9",
     *         "56c495e58f40aa0e41615cea"
     *     ],
     *     "imageSrc": "data:image/png;base64,iVBORw0KGg...U8AAAAAElFTkSuQmCC",
     *     "name": {
     *         "en": "Choithrams new"
     *     }
     *  }
     *
     * @example Response example:
     *
     *  {
     *     "__v": 0,
     *     "_id": "56d5aa815320a1a0243e7553",
     *     "editedBy": {
     *         "date": "2016-03-01T14:43:13.760Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-01T14:43:13.760Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "archived": false,
     *     "retailSegments": [
     *         "56c495e58f40aa0e41615cf7",
     *         "56c495e58f40aa0e41615cf8",
     *         "56c495e58f40aa0e41615cf6"
     *     ],
     *     "subRegions": [
     *         "56c495e58f40aa0e41615ceb",
     *         "56c495e58f40aa0e41615ce8",
     *         "56c495e58f40aa0e41615ce9",
     *         "56c495e58f40aa0e41615cea"
     *     ],
     *     "imageSrc": "data:image/png;base64,iVBORw0KGgo...AAAAAElFTkSuQmCC",
     *     "name": {
     *         "en": "Choithrams new",
     *         "ar": ""
     *     }
     *  }
     *
     * @method /outlet
     * @instance
     */

    router.post('/', handler.create);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/outlet/remove`
     *
     * Archive outlet with ids in body
     *
     * @param {array} ids - array of branch ids
     * @param {string} archived - true if branch need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/outlet/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56d5aa815320a1a0243e7553"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /outlet/remove
     * @instance
     */

    router.put('/remove', handler.archive);
    //router.get('/archive/:id', handler.remove);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/outlet/:id`
     *
     * Updated outlet with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/outlet/56d5aa815320a1a0243e7553'
     *
     * BODY:
     *  {
     *     "archived": false,
     *     "retailSegments": [
     *         "56c495e58f40aa0e41615cf7",
     *         "56c495e58f40aa0e41615cf8",
     *         "56c495e58f40aa0e41615cf6"
     *     ],
     *     "subRegions": [
     *         "56c495e58f40aa0e41615ceb",
     *         "56c495e58f40aa0e41615ce8",
     *         "56c495e58f40aa0e41615ce9",
     *         "56c495e58f40aa0e41615cea"
     *     ],
     *     "imageSrc": "data:image/png;base64,iVBORw0KGgo...yWU8AAAAAElFTkSuQmCC",
     *     "name": {
     *         "en": "Choithrams new1"
     *     }
     *  }
     *
     * @example Response example:
     * BODY:
     *  {
     *     "_id": "56d5aa815320a1a0243e7553",
     *     "__v": 0,
     *     "editedBy": {
     *         "date": "2016-03-01T14:47:50.955Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-01T14:43:13.760Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "archived": false,
     *     "retailSegments": [
     *         "56c495e58f40aa0e41615cf7",
     *         "56c495e58f40aa0e41615cf8",
     *         "56c495e58f40aa0e41615cf6"
     *     ],
     *     "subRegions": [
     *         "56c495e58f40aa0e41615ceb",
     *         "56c495e58f40aa0e41615ce8",
     *         "56c495e58f40aa0e41615ce9",
     *         "56c495e58f40aa0e41615cea"
     *     ],
     *     "imageSrc": "data:image/png;base64,iVBORw0...AAAAAElFTkSuQmCC",
     *     "name": {
     *         "ar": "",
     *         "en": "Choithrams new1"
     *     }
     *  }
     *
     * @method /outlet/:id
     * @instance
     */

    router.put('/:id([0-9a-fA-F]{24})', handler.update);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/outlet/:id`
     *
     * Updated outlet with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/outlet/56d5aa815320a1a0243e7553'
     *
     * BODY:
     *  {
     *     "archived": false,
     *     "name": {
     *         "en": "Choithrams new2"
     *     }
     *  }
     *
     * @example Response example:
     * BODY:
     *  {
     *     "_id": "56d5aa815320a1a0243e7553",
     *     "__v": 0,
     *     "editedBy": {
     *         "date": "2016-03-01T14:47:50.955Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-01T14:43:13.760Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "archived": false,
     *     "retailSegments": [
     *         "56c495e58f40aa0e41615cf7",
     *         "56c495e58f40aa0e41615cf8",
     *         "56c495e58f40aa0e41615cf6"
     *     ],
     *     "subRegions": [
     *         "56c495e58f40aa0e41615ceb",
     *         "56c495e58f40aa0e41615ce8",
     *         "56c495e58f40aa0e41615ce9",
     *         "56c495e58f40aa0e41615cea"
     *     ],
     *     "imageSrc": "data:image/png;base64,iVBORw0...AAAAAElFTkSuQmCC",
     *     "name": {
     *         "ar": "",
     *         "en": "Choithrams new2"
     *     }
     *  }
     *
     * @method /outlet/:id
     * @instance
     */

    router.patch('/:id([0-9a-fA-F]{24})', handler.update);
    //router.delete('/:id', handler.remove);

    return router;
};
