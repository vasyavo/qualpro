/**
 * @module Mobile - RetailSegment
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/retailSegment');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/retailSegment/sync`
     *
     * Returns the all changed and created `retailSegment`
     *
     * @param {data} lastLogOut - last log out date
     *
     * @see {@link RetailSegmentModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/retailSegment/sync?lastLogOut=2014'
     *
     * @example Response example:
     *
     *  [
     *       {
     *          "_id":"56c495e58f40aa0e41615cf6",
     *          "configurations":[
     *
     *          ],
     *          "editedBy":{
     *             "date":"2016-03-01T16:13:31.486Z",
     *             "user":"56c4961e8f40aa0e41615d53"
     *          },
     *          "createdBy":{
     *             "date":"2016-02-17T15:46:45.129Z"
     *          },
     *          "subRegions":[
     *             "56c495e58f40aa0e41615ce9",
     *             "56c495e58f40aa0e41615cea",
     *             "56c495e58f40aa0e41615cf0",
     *             "56c495e58f40aa0e41615ce8",
     *             "56c495e58f40aa0e41615ceb"
     *          ],
     *          "archived":true,
     *          "imageSrc":"data:image/png;base64,iVB...kSuQmCC",
     *          "name":{
     *             "ar":"الشاحنات",
     *             "en":"Vans"
     *          }
     *       }
     *  ]
     *
     * @method /mobile/retailSegment/sync
     * @instance
     */

    router.get('/sync', handler.getAllForSync);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/retailSegment`
     *
     * Returns the all existing `retailSegment`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link RetailSegmentModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/retailSegment'
     *
     * @example Response example:
     *
     *  {
     *  "total": 6,
     *  "data": [{
     *          "_id": "56c495e58f40aa0e41615cf6",
     *          "ID": "6",
     *          "__v": 0,
     *          "configurations": [],
     *          "editedBy": {
     *              "date": "2016-02-17T15:46:45.129Z",
     *              "user": null
     *          },
     *          "createdBy": {
     *              "date": "2016-02-17T15:46:45.129Z",
     *              "user": null
     *          },
     *          "subRegions": [
     *              "56c495e58f40aa0e41615ce9",
     *              "56c495e58f40aa0e41615cea",
     *              "56c495e58f40aa0e41615cf0"
     *          ],
     *          "archived": false,
     *          "imageSrc": "data:image/png;base64,iVBORw0KGgo...AElFTkSuQmCC",
     *          "name": {
     *              "en": "Vans",
     *              "ar": "الشاحنات"
     *          }
     *          }]
     *  }
     *
     * @method /mobile/retailSegment
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/retailSegment/:id`
     *
     * Returns existing `retailSegment` by id
     * @see {@link RetailSegment}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/retailSegment/56c495e58f40aa0e41615cf6'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56c495e58f40aa0e41615cf6",
     *      "ID": "6",
     *      "__v": 0,
     *      "configurations": [],
     *      "editedBy": {
     *          "date": "2016-02-17T15:46:45.129Z",
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-02-17T15:46:45.129Z",
     *          "user": null
     *      },
     *      "subRegions": [
     *          "56c495e58f40aa0e41615ce9",
     *          "56c495e58f40aa0e41615cea",
     *          "56c495e58f40aa0e41615cf0"
     *      ],
     *      "archived": false,
     *      "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAAN...AAElFTkSuQmCC",
     *      "name": {
     *          "en": "Vans",
     *          "ar": "الشاحنات"
     *      }
     *  }
     *
     * @method /mobile/retailSegment/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    return router;
};
