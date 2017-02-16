/**
 * @module Category
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/category');

module.exports = function() {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/category`
     *
     * Creates new category.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/category/'
     *
     * BODY:
     *  {
     *      "topArchived": false,
     *      "archived": true,
     *      "name": {
     *          "ar": "dfdsfdsfdsgnhgfhgfhf",
     *          "en": "ggggggggnbgv"
     *      }
     *  }
     *
     * @example Response example:
     *
     *  {
     *      "__v": 0,
     *      "_id": "56cf1dfb40cc83e025836d50",
     *      "editedBy": {
     *          "date": "2016-02-25T15:30:03.175Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-25T15:30:03.175Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "topArchived": false,
     *      "archived": true,
     *      "name": {
     *          "ar": "dfdsfdsfdsgnhgfhgfhf",
     *          "en": "ggggggggnbgv"
     *      }
     *  }
     *
     * @method /category
     * @instance
     */

    router.post('/', handler.create);

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

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/category/:id`
     *
     * Returns existing `category` by id
     * @see {@link CategoryModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/category/56a0d0cd2c9618d142f45478'
     *
     * @example Response example:
     *
     *  {
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
     *  }
     *
     * @method /category/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/category/remove`
     *
     * Archive category with ids in body
     *
     * @param {array} ids - array of branch ids
     * @param {string} archived - true if category need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/category/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56a0d0cd2c9618d142f45478"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /category/remove
     * @instance
     */

    router.put('/remove', handler.archive);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/category/:id`
     *
     * Updated category with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/category/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     *  {
     *      "topArchived": false,
     *      "archived": true,
     *      "name": {
     *          "ar": "dfdsfdsfdsgnhgfhgfhf",
     *          "en": "ggggggggnbgv"
     *      }
     *  }
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56a0d0cd2c9618d142f45478",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-25T15:25:16.627Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-01-21T12:36:29.060Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "topArchived": false,
     *      "archived": true,
     *      "name": {
     *          "en": "ggggggggnbgv",
     *          "ar": "dfdsfdsfdsgnhgfhgfhf"
     *      }
     *  }
     *
     * @method /category/:id
     * @instance
     */

    router.put('/:id([0-9a-fA-F]{24})', handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/category/:id`
     *
     * Updated category with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/category/56a0d0cd2c9618d142f45478'
     *
     * BODY:
     *  {
     *      "archived": false
     *  }
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56a0d0cd2c9618d142f45478",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-25T15:27:32.029Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-01-21T12:36:29.060Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "topArchived": false,
     *      "archived": false,
     *      "name": {
     *          "en": "ggggggggnbgv",
     *          "ar": "dfdsfdsfdsgnhgfhgfhf"
     *      }
     *  }
     *
     * @method /branch/:id
     * @instance
     */

    router.patch('/:id([0-9a-fA-F]{24})', handler.update);
    // router.delete('/:id', handler.remove);

    return router;
};
