/**
 * @module Domain
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var Handler = require('../handlers/domain');


module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    function midMiddleware(req, res, next) {
        var mid;
        var level = req.session.level;
        var type = req.body.type;
        var levelsNotAllowed = [2, 9];
        var typesAllowed = ['region', 'subRegion'];

        if (levelsNotAllowed.indexOf(level) === -1) {
            mid = 3;
        } else {
            if (typesAllowed.indexOf(type) === -1) {
                mid = 3;
            } else if (type === 'region') {
                mid = 103;
            } else {
                mid = 104;
            }
        }

        req.mid = mid;
        next();
    };

    router.use(checkAuth);
    router.use(midMiddleware);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/domain`
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
     *     'http://192.168.88.15:9797/domain'
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
     * @method /domain
     * @instance
     */

    router.get('/', handler.getAll);
    //router.get('/:parentContentType', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/domain/getForDD`
     *
     * Returns the all existing `domain`
     *
     * @see {@link DomainModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/domain/getForDD'
     *
     * @example Response example:
     *
     *  [{
     *      "_id": "56c495e48f40aa0e41615cd1",
     *      "parent": null,
     *      "name": {
     *          "en": "Iraq"
     *      }
     *  },
     *  {
     *      "_id": "56c495e48f40aa0e41615cd2",
     *      "parent": null,
     *      "name": {
     *          "en": "Sudan"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615cf5",
     *      "parent": "56c495e48f40aa0e41615cda",
     *      "name": {
     *          "en": "Abu Dhabi",
     *          "ar": "أبوضبي"
     *      }
     *  }]
     *
     * @method /domain/getForDD
     * @instance
     */

    router.get('/getForDD', handler.getForDD);
    // router.get('/names', handler.getNames);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/domain/:id`
     *
     * Returns existing `domain` by id
     * @see {@link DomainModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/domain/56c495e48f40aa0e41615cd1'
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
     * @method /domain/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/domain`
     *
     * Creates new domain.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/domain/'
     *
     * BODY:
     *  {
     *     "name"     : {
     *         "en": "enName",
     *         "ar": "arName"
     *     },
     *     "imageSrc" : "data:image/png;base64,iVBORw0KGgoA...xyWU8AAAAAElFTkSuQmCC",
     *     "currency" : "AED",
     *     "archived" : false,
     *     "topArchived" : false,
     *     "type"     : "country",
     *     "parent"   : null
     *  }
     *
     * @example Response example:
     *
     *  {
     *    "__v": 0,
     *    "currency": "AED",
     *    "type": "country",
     *    "_id": "56d07bd4bfb772b418871e6f",
     *    "editedBy": {
     *        "date": "2016-02-26T16:22:44.612Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "createdBy": {
     *        "date": "2016-02-26T16:22:44.612Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "parent": null,
     *    "topArchived": false,
     *    "archived": false,
     *    "imageSrc": "data:image/png;base64,iVBORw0KGgo...AAAElFTkSuQmCC",
     *    "name": {
     *        "en": "enName",
     *        "ar": "arName"
     *    }
     *  }
     *
     * @method /domain
     * @instance
     */

    router.post('/', handler.create);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/domain/remove`
     *
     * Archive domain with ids in body
     *
     * @param {array} ids - array of domain ids
     * @param {string} archived - true if domain need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/domain/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56d07bd4bfb772b418871e6f"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /domain/remove
     * @instance
     */

    router.put('/remove', handler.archive);
    //router.get('/archive/:id', handler.remove);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/domain/:id`
     *
     * Updated domain with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/domain/56d07bd4bfb772b418871e6f'
     *
     * BODY:
     *  {
     *     "name"     : {
     *         "en": "enName",
     *         "ar": "arName"
     *     },
     *     "imageSrc" : "data:image/png;base64,iVBORw0KG...AAAAAElFTkSuQmCC",
     *     "currency" : "AED",
     *     "archived" : false,
     *     "topArchived" : false,
     *     "type"     : "country",
     *     "parent"   : null
     *  }
     *
     * @example Response example:
     *  {
     *    "_id": "56d07bd4bfb772b418871e6f",
     *    "currency": {
     *        "_id": "AED",
     *        "name": "Dirham (AED)"
     *    },
     *    "type": "country",
     *    "__v": 0,
     *    "editedBy": {
     *        "date": "2016-02-26T16:24:55.751Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "createdBy": {
     *        "date": "2016-02-26T16:22:44.612Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "parent": null,
     *    "topArchived": false,
     *    "archived": false,
     *    "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAA...hZHlxyWU8AAAAAElFTkSuQmCC",
     *    "name": {
     *        "ar": "arName",
     *        "en": "enName"
     *    }
     *  }
     *
     * @method /domain/:id
     * @instance
     */

    router.put('/:id', handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/domain/:id`
     *
     * Updated domain with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/domain/56d07bd4bfb772b418871e6f'
     *
     * BODY:
     *  {
     *     "name"     : {
     *         "en": "enName",
     *         "ar": "arName"
     *     }
     *  }
     *
     * @example Response example:
     *  {
     *    "_id": "56d07bd4bfb772b418871e6f",
     *    "currency": {
     *        "_id": "AED",
     *        "name": "Dirham (AED)"
     *    },
     *    "type": "country",
     *    "__v": 0,
     *    "editedBy": {
     *        "date": "2016-02-26T16:24:55.751Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "createdBy": {
     *        "date": "2016-02-26T16:22:44.612Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "parent": null,
     *    "topArchived": false,
     *    "archived": false,
     *    "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAA...hZHlxyWU8AAAAAElFTkSuQmCC",
     *    "name": {
     *        "ar": "arName",
     *        "en": "enName"
     *    }
     *  }
     *
     * @method /domain/:id
     * @instance
     */

    router.patch('/:id', handler.update);

    /**
     * __Type__ 'DELETE'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/domain/:id`
     *
     * Removes domain with specific id.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/domain/56d07814bfb772b418871e6e'
     *
     * @example Response example: status
     *
     * @method /domain/:id
     * @instance
     */

    router.delete('/:id', handler.remove);

    return router;
};
