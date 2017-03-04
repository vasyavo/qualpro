/**
 * @module Brand
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var Handler = require('../handlers/brand');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brand`
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
     *     'http://192.168.88.15:9797/brand'
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
     * @method /brand
     * @instance
     */

    router.get('/', handler.getAll);
    //router.get('/getForDD', handler.getForDD);
    //router.get('names/',handler.getNames);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brand/:id`
     *
     * Returns existing `brand` by id
     * @see {@link BrandModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/brand/56c495e58f40aa0e41615d05'
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
     * @method /brand/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brand`
     *
     * Creates new brand.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/brand/'
     *
     * BODY:
     *  {
     *      "archived" : false,
     *      "imageSrc" : "data:image/jpeg;base64,/9j/4AAQ...2fvk0UUUAf//Z",
     *      "name" : {
     *          "ar" : "sdfsdf12",
     *          "en" : "dsdf22"
     *      }
     *  }
     *
     * @example Response example:
     *
     * {
     *      "__v": 0,
     *      "_id": "56cf158a40cc83e025836d4f",
     *      "editedBy": {
     *          "date": "2016-02-25T14:54:02.433Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-25T14:54:02.433Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "archived": false,
     *      "imageSrc": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...wJ2fvk0UUUAf//Z",
     *      "name": {
     *          "ar": "sdfsdf12",
     *          "en": "dsdf22"
     *      }
     *  }
     *
     * @method /brand
     * @instance
     */

    router.post('/', handler.create);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brand/remove`
     *
     * Archive brands with ids in body
     *
     * @param {array} ids - array of branch ids
     * @param {string} archived - true if brand need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/brand/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56cf158a40cc83e025836d4f"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /brand/remove
     * @instance
     */

    router.put('/remove', handler.archive);
    //router.get('/archive/:id', handler.remove);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brand/:id`
     *
     * Updated brand with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/brand/56cf158a40cc83e025836d4f'
     *
     * BODY:
     *  {
     *      "archived": false,
     *      "imageSrc": "data:image/jpeg;base64,/9j/4AAQSkZJRgA...QB50IwJ2fvk0UUUAf//Z",
     *      "name": {
     *          "ar": "sdfsdf12",
     *          "en": "dsdf22"
     *      }
     *  }
     *
     * @example Response example:
     *  {
     *      "_id": "56cf158a40cc83e025836d4f",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-25T15:00:50.894Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-25T14:54:02.433Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "archived": false,
     *      "imageSrc": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...J2fvk0UUUAf//Z",
     *      "name": {
     *          "en": "dsdf22",
     *          "ar": "sdfsdf12"
     *      }
     *  }
     *
     * @method /brand/:id
     * @instance
     */

    router.put('/:id([0-9a-fA-F]{24})', handler.update);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brand/:id`
     *
     * Updated brand with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/brand/56cf158a40cc83e025836d4f'
     *
     * BODY:
     *  {
     *      "name": {
     *          "ar": "sdfsdf12",
     *          "en": "dsdf22"
     *      }
     *  }
     *
     * @example Response example:
     *  {
     *      "_id": "56cf158a40cc83e025836d4f",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-25T15:00:50.894Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-25T14:54:02.433Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "archived": false,
     *      "imageSrc": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...J2fvk0UUUAf//Z",
     *      "name": {
     *          "en": "dsdf22",
     *          "ar": "sdfsdf12"
     *      }
     *  }
     *
     * @method /brand/:id
     * @instance
     */

    router.patch('/:id([0-9a-fA-F]{24})', handler.update);
    //router.delete('/:id', handler.remove);

    return router;
};
