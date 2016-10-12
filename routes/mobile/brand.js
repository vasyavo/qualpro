/**
* @module Mobile - Brand
*/


var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/brand');

module.exports = function (db, redis) {
    var handler = new Handler(db, redis);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/brand`
     *
     * Returns the all existing `brand`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link BrandModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/brand'
     *
     * @example Response example:
     *
     * {
     *  "total": 1,
     *  "data": [{
     *      "_id": "56bab1653cf2257456c29ad4",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-19T17:09:54.110Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-10T03:41:25.397Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "archived": false,
     *      "imageSrc": "data:image/jpeg;base64,/9j/4AAQSkZJ...vk0UUUAf//Z",
     *      "name": {
     *          "ar": "sdfsdf",
     *          "en": "dsdf"
     *      }
     *  }]
     * }
     *
     * @method /mobile/brand
     * @instance
     */

    router.get('/', handler.getAll);
    
    router.get('/sync', handler.getAllForSync);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/brand/:id`
     *
     * Returns existing `brand` by id
     * @see {@link BrandModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/brand/56c495e58f40aa0e41615d05'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56bab1653cf2257456c29ad4",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-19T17:09:54.110Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-10T03:41:25.397Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "archived": false,
     *      "imageSrc": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAA...J2fvk0UUUAf//Z",
     *      "name": {
     *          "ar": "sdfsdf",
     *          "en": "dsdf"
     *      }
     *  }
     *
     * @method /mobile/brand/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    return router;
};

