var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');
var Handler = require('../../handlers/competitorVariant');

module.exports = function(db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/competitorVariant`
     *
     * Returns the all existing `competitorVariant`
     *
     * @see {@link CompetitorVariantModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/competitorVariant'
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
     * @method /mobile/competitorVariant
     * @instance
     */

    router.get('/', handler.getAll);

    router.get('/sync', handler.getAllForSync);

    return router;
};
