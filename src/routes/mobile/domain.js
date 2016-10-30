/**
 * @module Mobile - Domain
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/domain');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/domain/sync`
     *
     * Returns the all changed and created `domain`
     *
     * @param {data} lastLogOut - last log out date
     *
     * @see {@link DomainModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/domain/sync?lastLogOut=2014'
     *
     * @example Response example:
     *
     *
     * [
     *   {
     *      "_id":"56c495e48f40aa0e41615cd1",
     *      "currency":null,
     *      "type":"country",
     *      "editedBy":{
     *         "date":"2016-02-17T15:46:44.689Z",
     *         "user":null
     *      },
     *      "createdBy":{
     *
     *      },
     *      "parent":null,
     *      "archived":false,
     *      "imageSrc":"data:image/png;base64,iVBOR...SuQmCC",
     *      "name":{
     *         "en":"Iraq"
     *      },
     *      "topArchived":true
     *   }
     * ]
     *
     * @method /mobile/domain/sync
     * @instance
     */

    router.get('/sync', handler.getAllForSync);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/domain/:id`
     *
     * Returns existing `domain` by id
     * @see {@link DomainModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/domain/56c495e48f40aa0e41615cd1'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56c495e48f40aa0e41615cd1",
     *      "ID": "9",
     *      "currency": null,
     *      "type": "country",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-17T15:46:44.689Z",
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-02-17T15:46:44.689Z",
     *          "user": null
     *      },
     *      "parent": null,
     *      "topArchived": false,
     *      "archived": false,
     *      "imageSrc": "data:image/png;base64,iVBORw0KGgoAA...AElFTkSuQmCC",
     *      "name": {
     *          "en": "Iraq"
     *      }
     *  }
     *
     * @method /mobile/domain/:id
     * @instance
     */

    router.get('/:id', handler.getById);
    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/domain`
     *
     * Returns the all existing `domain`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link DomainModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/domain'
     *
     * @example Response example:
     *
     *  {
     *  "total": 37,
     *  "data": [{
     *              "_id": "56c495e48f40aa0e41615cd1",
     *              "ID": "9",
     *              "currency": null,
     *              "type": "country",
     *              "__v": 0,
     *              "editedBy": {
     *                  "date": "2016-02-17T15:46:44.689Z",
     *                  "user": null
     *              },
     *              "createdBy": {
     *                  "date": "2016-02-17T15:46:44.689Z",
     *                  "user": null
     *              },
     *              "parent": null,
     *              "topArchived": false,
     *              "archived": false,
     *              "imageSrc": "data:image/png;base64,iVBORw0...AAAAAElFTkSuQmCC",
     *              "name": {
     *                  "en": "Iraq"
     *              }
     *          }]
     *  }
     *
     * @method /mobile/domain
     * @instance
     */

    router.get('/', handler.getAll);
    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/domain`
     *
     * Returns the all existing `domain`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link DomainModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/domain'
     *
     * @example Response example:
     *
     *  {
     *  "total": 37,
     *  "data": [{
     *              "_id": "56c495e48f40aa0e41615cd1",
     *              "ID": "9",
     *              "currency": null,
     *              "type": "country",
     *              "__v": 0,
     *              "editedBy": {
     *                  "date": "2016-02-17T15:46:44.689Z",
     *                  "user": null
     *              },
     *              "createdBy": {
     *                  "date": "2016-02-17T15:46:44.689Z",
     *                  "user": null
     *              },
     *              "parent": null,
     *              "topArchived": false,
     *              "archived": false,
     *              "imageSrc": "data:image/png;base64,iVBORw0...AAAAAElFTkSuQmCC",
     *              "name": {
     *                  "en": "Iraq"
     *              }
     *          }]
     *  }
     *
     * @method /mobile/domain
     * @instance
     */

    return router;
};
