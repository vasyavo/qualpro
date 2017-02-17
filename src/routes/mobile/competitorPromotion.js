/**
 * @module Mobile - CompetitorPromotion
 */

var express = require('express');
var router = express.Router();
var CompetitorPromotion = require('../../handlers/competitorPromotion');
var access = require('../../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function () {
    var handler = new CompetitorPromotion();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/competitorPromotion`
     *
     * Creates new Competitor promotion activity. Put competitor promotion in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/competitorPromotion/'
     *
     * BODY:
     * {
     *   data : {
     *      "description": {
     *          "en": "enDescription",
     *          "ar": "arDescription"
     *      },
     *      "category": ["5749b463839e4a5957578d07"],
     *      "brand": "5749b461839e4a5957578c1e",
     *      "country": "572b50362d3a970436e3acf8",
     *      "region": "572b50362d3a970436e3ad10",
     *      "subRegion": "572b50362d3a970436e3ad1e",
     *      "retailSegment": "572b50372d3a970436e3ad4d",
     *      "outlet": "572b50372d3a970436e3af9a",
     *      "branch": "5746f4c27da4c45d13997337",
     *      "origin": ["5749b3fa839e4a5957578bf0"],
     *      "promotion": "3 + 1",
     *      "price": "11.25",
     *      "packing": "340g",
     *      "expiry": "2016-07-17T15:46:44.692Z",
     *      "displayType": "3",
     *      "dateStart": "2016-06-17T15:46:44.692Z",
     *      "dateEnd": "2016-06-29T15:46:44.692Z",
     *      "commentText": "Some comment from mobile"
     *  },
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     *  {
     *    "_id": "576bc5024e092f9535de43e7",
     *    "brand": "5749b461839e4a5957578c1e",
     *    "country": "572b50362d3a970436e3acf8",
     *    "region": "572b50362d3a970436e3ad10",
     *    "subRegion": "572b50362d3a970436e3ad1e",
     *    "retailSegment": "572b50372d3a970436e3ad4d",
     *    "outlet": "572b50372d3a970436e3af9a",
     *    "branch": "5746f4c27da4c45d13997337",
     *    "expiry": "2016-07-17T15:46:44.692Z",
     *    "dateStart": "2016-06-17T15:46:44.692Z",
     *    "dateEnd": "2016-06-29T15:46:44.692Z",
     *    "__v": 0,
     *    "editedBy": {
     *      "date": "2016-06-23T11:16:18.392Z",
     *      "user": null
     *    },
     *    "createdBy": {
     *      "date": "2016-06-23T11:16:18.382Z",
     *      "user": "572b78d23e8b657506a4a9a6"
     *    },
     *    "archived": false,
     *    "attachments": [],
     *    "comments": [
     *      "576bc5024e092f9535de43e8"
     *    ],
     *    "displayType": "3",
     *    "packing": "340g",
     *    "price": "11.25",
     *    "promotion": "3 + 1",
     *    "origin": [
     *      "5749b3fa839e4a5957578bf0"
     *    ],
     *    "category": [
     *      "5749b463839e4a5957578d07"
     *    ],
     *    "description": {
     *      "ar": "arDescription",
     *      "en": "enDescription"
     *    }
     *  }
     *
     * @method /mobile/competitorPromotion/
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);

    router.get('/', handler.getAll);

    return router;
};

