/**
 * @module Mobile - Branch
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/branch');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

     /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/branch`
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
     *     'http://192.168.88.15:9797/mobile/branch'
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
     * @method /mobile/branch
     * @instance
     */

     router.get('/sync', handler.getAllForSync);

     router.get('/', handler.getAll);


    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/branch/:id`
     *
     * Returns existing `branch` by id
     * @see {@link BranchModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/branch/56c495e58f40aa0e41615d05'
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
     * @method /mobile/branch/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    return router;
};
