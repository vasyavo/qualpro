/**
 * @module ShelfShare
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');
var Handler = require('../../handlers/shelfShare');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/shelfShares`
     *
     * Creates answer for questionnary
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/shelfShares'
     *
     * BODY:
     *
     * {
     *                "country"      : "56c495e48f40aa0e41615cd1",
     *                "region"       : "56c495e48f40aa0e41615ce7",
     *                "subRegion"    : "56c495e58f40aa0e41615ce8",
     *                "retailSegment": "56c495e58f40aa0e41615cfb",
     *                "outlet"       : "56c495e58f40aa0e41615d04",
     *                "branch"       : "572b6a5f6ea998ff3dd9e08e",
     *                "category"     : "56a36686446815602bf6bc17",
     *                "brands": [
     *                    {
     *                        "brand": "56f55f18f0630dc81fdd8da9",
     *                        "length": 80,
     *                        "percent": 40
     *                    },
     *                    {
     *                        "brand": "56fa8ee557eb934019e9e75d",
     *                        "length": 120,
     *                        "percent": 60
     *                    }
     *                ]
     *  }
     *
     *  @example Response example:
     *
     * [
     *   {
     *       "__v": 0,
     *       "_id": "5731a6a0877ffdf337d25363",
     *       "editedBy": {
     *           "date": "2016-05-10T09:15:12.340Z",
     *           "user": null
     *       },
     *       "createdBy": {
     *           "date": "2016-05-10T09:15:12.337Z",
     *           "user": "56c4961e8f40aa0e41615d53"
     *       },
     *       "brands": [
     *           {
     *               "length": 80,
     *               "percent": 40,
     *               "_id": "5731a6a0877ffdf337d25365",
     *               "brand": "56f55f18f0630dc81fdd8da9"
     *           },
     *           {
     *               "length": 120,
     *               "percent": 60,
     *               "_id": "5731a6a0877ffdf337d25364",
     *               "brand": "56fa8ee557eb934019e9e75d"
     *           }
     *       ],
     *       "category": "56a36686446815602bf6bc17",
     *       "branch": "572b6a5f6ea998ff3dd9e08e",
     *       "outlet": "56c495e58f40aa0e41615d04",
     *       "retailSegment": "56c495e58f40aa0e41615cfb",
     *       "subRegion": "56c495e58f40aa0e41615ce8",
     *       "region": "56c495e48f40aa0e41615ce7",
     *       "country": "56c495e48f40aa0e41615cd1"
     *   }
     * ]
     *
     *
     * @method /shelfShares
     * @instance
     */

    router.post('/', handler.create);

    return router;
};
