var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/competitorVariant');

module.exports = function(db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorVariant`
     *
     * Creates new competitorVariant.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorVariant/'
     *
     * BODY:
     *  {
     *      "name": {
     *          "en": "envar",
     *          "ar": "arvar"
     *      },
     *      "category": "56cf1dfb40cc83e025836d50",
     *      "archived": false
     *  }
     *
     * @example Response example:
     *
     *  {
     *      "__v": 0,
     *      "category": "56cf1dfb40cc83e025836d50",
     *      "_id": "56d06f8dbfb772b418871e6d",
     *      "editedBy": {
     *          "date": "2016-02-26T15:30:21.806Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-26T15:30:21.806Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "archived": false,
     *      "name": {
     *          "en": "envar",
     *          "ar": "arvar"
     *      }
     *  }
     *
     * @method /competitorVariant
     * @instance
     */

    router.post('/', handler.create);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorVariant`
     *
     * Returns the all existing `competitorVariant`
     *
     * @see {@link CompetitorVariantModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorVariant'
     *
     * @example Response example:
     *
     *  [{
     *      "_id": "56bb4ad75c151aa009e30a17",
     *      "category": "56a36686446815602bf6bc17",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-10T14:36:07.294Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-10T14:36:07.294Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "archived": false,
     *      "name": {
     *          "en": "dfgdfg",
     *          "ar": "fdgdfgd"
     *      }
     *  },
     *  {
     *      "_id": "56d06f8dbfb772b418871e6d",
     *      "category": "56cf1dfb40cc83e025836d50",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-26T15:30:21.806Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-26T15:30:21.806Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "archived": false,
     *      "name": {
     *          "en": "envar",
     *          "ar": "arvar"
     *      }
     *  }]
     *
     * @method /competitorVariant
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorVariant/:id`
     *
     * Returns existing `competitorVariant` by id
     * @see {@link CompetitorVariantModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorVariant/56d06f8dbfb772b418871e6d'
     *
     * @example Response example:
     *
     *  {
     *    "_id": "56d06f8dbfb772b418871e6d",
     *    "category": "56cf1dfb40cc83e025836d50",
     *    "__v": 0,
     *    "editedBy": {
     *        "date": "2016-02-26T15:30:21.806Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "createdBy": {
     *        "date": "2016-02-26T15:30:21.806Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "archived": false,
     *    "name": {
     *        "en": "envar",
     *        "ar": "arvar"
     *    }
     *  }
     *
     * @method /competitorVariant/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorVariant/remove`
     *
     * Archive CompetitorVariant with ids in body
     *
     * @param {array} ids - array of competitorVariant ids
     * @param {string} archived - true if competitorVariant need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorVariant/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56cef0364dc2fdac2836f747"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /competitorVariant/remove
     * @instance
     */

    router.put('/remove', handler.archive);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorVariant/:id`
     *
     * Updated competitorVariant with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorVariant/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     *  {
     *      "name": {
     *          "en": "envar1",
     *          "ar": "arvar1"
     *      },
     *      "category": "56cf1dfb40cc83e025836d50",
     *      "archived": false
     *  }
     *
     * @example Response example:
     *
     *  {
     *    "_id": "56d06f8dbfb772b418871e6d",
     *    "category": "56cf1dfb40cc83e025836d50",
     *    "__v": 0,
     *    "editedBy": {
     *        "date": "2016-02-26T15:42:14.822Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "createdBy": {
     *        "date": "2016-02-26T15:30:21.806Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "archived": false,
     *    "name": {
     *        "ar": "arvar",
     *        "en": "envar"
     *    }
     *  }
     *
     * @method /competitorVariant/:id
     * @instance
     */

    router.put('/:id', handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/competitorVariant/:id`
     *
     * Updated competitorVariant with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/competitorVariant/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     *  {
     *      "name": {
     *          "en": "envar2"
     *      }
     *  }
     *
     * @example Response example:
     *
     *  {
     *    "_id": "56d06f8dbfb772b418871e6d",
     *    "category": "56cf1dfb40cc83e025836d50",
     *    "__v": 0,
     *    "editedBy": {
     *        "date": "2016-02-26T15:42:14.822Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "createdBy": {
     *        "date": "2016-02-26T15:30:21.806Z",
     *        "user": "56c4961e8f40aa0e41615d53"
     *    },
     *    "archived": false,
     *    "name": {
     *        "ar": "arvar",
     *        "en": "envar2"
     *    }
     *  }
     *
     * @method /competitorVariant/:id
     * @instance
     */

    router.patch('/:id', handler.update);

    return router;
};
