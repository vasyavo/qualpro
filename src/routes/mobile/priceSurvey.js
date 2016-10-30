/**
 * @module Mobile - PriceSurvey
 */

var express = require('express');
var router = express.Router();
var PriceSurvey = require('../../handlers/priceSurvey');
var access = require('../../helpers/access');

module.exports = function (db, redis, event) {
    var handler = new PriceSurvey(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     * Content-Type: 'application/json'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/priceSurvey`
     *
     * Creates new price survey. Put price survey in body.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/priceSurvey/'
     *
     * BODY:
     * {
     *      "category"     : "56a36686446815602bf6bc17",
     *      "variant"      : "56bb4ad75c151aa009e30a17",
     *      "country"      : "56c495e48f40aa0e41615cd4",
     *      "region"       : "56c495e48f40aa0e41615ce4",
     *      "subRegion"    : "56c495e58f40aa0e41615ceb",
     *      "retailSegment": "56c495e58f40aa0e41615cf9",
     *      "outlet"       : "56c495e58f40aa0e41615d00",
     *      "branch"       : "56c495e58f40aa0e41615d11",
     *      "total"        : 118,
     *      "items"        : [{
     *          "brand" : "5749b461839e4a5957578c1d",
     *          "size" : "6 x 7",
     *          "price": "530",
     *          "origins": [
     *            {
     *                "ar" : "عمان",
     *                "en" : "OMAN"
     *            },
     *            {
     *                "ar" : "تايلند",
     *                "en" : "THAILAND"
     *            }
     *          ]
     *      },
     *      {
     *          "brand" : "5749b461839e4a5957578c1e",
     *          "size" : "4 x 4",
     *          "price": "420",
     *          "origins": [
     *            {
     *                "ar" : "عمان",
     *                "en" : "OMAN"
     *            },
     *            {
     *                "ar" : "تايلند",
     *                "en" : "THAILAND"
     *            }
     *          ]
     *      }]
     * }
     *
     * @example Response example: Status
     *
     * @method /mobile/priceSurvey/
     * @instance
     */

    router.post('/', handler.create);

    router.get('/', handler.getAll);

    return router;
};

