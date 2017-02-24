/**
 * @module Mobile - Planogram
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/planogram');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/planogram`
     *
     * Returns the all existing `planogram`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link PlanogramModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/planogram'
     *
     * @example Response example:
     *
     *  {
     *  "total": 1,
     *  "data": [{
     *          "_id": "56cb23bc27420dcc06bed2aa",
     *          "country": {
     *              "_id": "56c495e48f40aa0e41615cd1",
     *              "archived": false,
     *              "name": {
     *                  "en": "Iraq"
     *              }
     *          },
     *          "retailSegment": {
     *              "_id": "56c495e58f40aa0e41615cfa",
     *              "archived": false,
     *              "name": {
     *                  "en": "A-class shops",
     *                  "ar": "المحلات التجارية فئة-أ"
     *              }
     *          },
     *          "product": {
     *              "_id": "56a36686446815602bf6bc17",
     *              "archived": false,
     *              "name": {
     *                  "en": "something",
     *                  "ar": "arSomething"
     *              }
     *          },
     *          "configuration": {
     *              "_id": "56cc5fedb5820a9c0334849b",
     *              "name": "666x98"
     *          },
     *          "editedBy": {
     *              "date": "2016-02-24T10:51:43.222Z",
     *              "user": "56c4961e8f40aa0e41615d53"
     *          },
     *          "createdBy": {
     *              "date": "2016-02-22T15:05:32.622Z",
     *              "user": null
     *          },
     *          "archived": false,
     *          "fileID": {
     *              "_id": "578340108a0822c968519d9c",
     *              "name": "5783400f8a0822c968519d9b.png",
     *              "contentType": "image/png",
     *              "originalName": "background.png",
     *              "createdBy": {
     *                  "date": "2016-07-11T06:43:28.275Z",
     *                  "user": "572b78d23e8b657506a4a9a6"
     *              },
     *              "prview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQAB...FxINwyT9elFFFAH//2Q=="
     *          }
     *          "configurations": [{
     *                              "configuration": "55x12",
     *                              "_id": "56cb23ac27420dcc06bed2a8",
     *                              "archived": false
     *                            },
     *                            {
     *                              "configuration": "666x98",
     *                              "_id": "56cc5fedb5820a9c0334849b",
     *                              "archived": false
     *                            }]
     *          }]
     *  }
     *
     * @method /mobile/planogram
     * @instance
     */

    router.get('/sync', handler.getAllForSync);
    
    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/planogram/:id`
     *
     * Returns existing `planogram` by id
     * @see {@link PlanogramModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/planogram/56cb23bc27420dcc06bed2aa'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56cb23bc27420dcc06bed2aa",
     *      "country": "56c495e48f40aa0e41615cd1",
     *      "retailSegment": "56c495e58f40aa0e41615cfa",
     *      "product": "56a36686446815602bf6bc17",
     *      "configuration": "56cc5fedb5820a9c0334849b",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-24T10:51:43.222Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-22T15:05:32.622Z",
     *          "user": null
     *      },
     *      "archived": false,
     *      "fileID": {
     *          "_id": "578340108a0822c968519d9c",
     *          "name": "5783400f8a0822c968519d9b.png",
     *          "contentType": "image/png",
     *          "originalName": "background.png",
     *          "createdBy": {
     *              "date": "2016-07-11T06:43:28.275Z",
     *              "user": "572b78d23e8b657506a4a9a6"
     *          },
     *          "prview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQAB...FxINwyT9elFFFAH//2Q=="
     *      }
     *  }
     *
     * @method /mobile/planogram/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    return router;
};
