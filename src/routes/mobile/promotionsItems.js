/**
 * @module Mobile - PromotionsItems
 */

var express = require('express');
var router = express.Router();
var PromotionsHandler = require('../../handlers/promotionsItems');
var access = require('../../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    var handler = new PromotionsHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);


    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/promotionsItems`
     *
     * Creates new al alali promo evaluation report. Put al alali promo evaluation report in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/promotionsItems/'
     *
     * BODY:
     * {
     *     "data": {
     *         "promotion"   : "572310c4ac9279481a31d907",
     *         "outlet"      : "56c495e58f40aa0e41615d04",
     *         "branch"      : "56c495e58f40aa0e41615d19",
     *         "dateStart"   : "2016-04-05T00:00:00.000+03:00",
     *         "dateEnd"     : "2016-04-30T00:00:00.000+03:00",
     *         "rsp"         : "12.5",
     *         "status"      : "active",
     *         "opening"     : ["5", "3"],
     *         "sellIn"      : ["6", "5"],
     *         "closingStock": ["7", "6"],
     *         "sellOut"     : ["3", "7"],
     *         "displayType" : "2",
     *         "commentText" : "Another test comment"
     *     },
     *     "files": "encoded by form, files here"
     * }
     *
     * @example Response example:
     *
     * {
     *     "_id": "57347755cbdda9ae569bb76a",
     *     "dateStart": "2016-04-04T21:00:00.000Z",
     *     "dateEnd": "2016-04-29T21:00:00.000Z",
     *     "__v": 0,
     *     "editedBy": {
     *         "user": null
     *     },
     *     "createdBy": {
     *         "date": "2016-05-12T12:30:13.046Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "comment": "57347755cbdda9ae569bb76b",
     *     "displayType": "2",
     *     "sellOut": [
     *         3,
     *         7,
     *         10
     *     ],
     *     "closingStock": [
     *         7,
     *         6,
     *         13
     *     ],
     *     "sellIn": [
     *         6,
     *         5,
     *         11
     *     ],
     *     "opening": [
     *         5,
     *         3
     *     ],
     *     "status": "active",
     *     "rsp": 12.5,
     *     "branch": "56c495e58f40aa0e41615d19",
     *     "outlet": "56c495e58f40aa0e41615d04",
     *     "promotion": "572310c4ac9279481a31d907"
     * }
     *
     * @method /mobile/promotionsItems/
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);

    return router;
};