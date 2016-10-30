/**
 * @module Mobile - Outlet
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/outlet');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/outlet/sync`
     *
     * Returns the all changed and created `outlet`
     *
     * @param {data} lastLogOut - last log out date
     *
     * @see {@link OutletModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/outlet/sync?lastLogOut=2014'
     *
     * @example Response example:
     *
     * [
     *   {
     *      "_id":"56c495e58f40aa0e41615cfc",
     *      "editedBy":{
     *         "date":"2016-02-17T15:46:45.161Z",
     *         "user":null
     *      },
     *      "createdBy":{
     *         "date":"2016-02-17T15:46:45.161Z"
     *      },
     *      "archived":false,
     *      "retailSegments":[
     *         "56c495e58f40aa0e41615cf7",
     *         "56c495e58f40aa0e41615cf8",
     *         "56c495e58f40aa0e41615cf6"
     *      ],
     *      "subRegions":[
     *         "56c495e58f40aa0e41615ceb",
     *         "56c495e58f40aa0e41615ce8",
     *         "56c495e58f40aa0e41615ce9",
     *         "56c495e58f40aa0e41615cea"
     *      ],
     *      "imageSrc":"data:image/png;base64,iVBORw0KG...AElFTkSuQmCC",
     *      "name":{
     *         "en":"Choithrams"
     *      }
     *   }
     * ]
     *
     * @method /mobile/outlet/sync
     * @instance
     */

    router.get('/sync', handler.getAllForSync);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/outlet`
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
     *     'http://192.168.88.15:9797/mobile/outlet'
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
     * @method /mobile/outlet
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/outlet/:id`
     *
     * Returns existing `outlet` by id
     * @see {@link OutletModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/outlet/56c495e58f40aa0e41615cfc'
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
     * @method /mobile/outlet/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    return router;
};
