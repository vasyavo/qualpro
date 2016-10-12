/**
 * @module Mobile - Promotions
 */

var express = require('express');
var router = express.Router();
var promotionsHandler = require('../../handlers/promotions');
var access = require('../../helpers/access');

module.exports = function (db) {
    var handler = new promotionsHandler(db);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/promotions/sync`
     *
     * Returns the all existing `promotions`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {date} lastLogOut - last logout date
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/promotions/sync'
     *
     * @example Response example:
     *
     *     [{
     *         "_id": "57230ee5e678b4770b65abcc",
     *         "total": 28,
     *         "promotionType": {
     *             "ar": "<p>afwefadaf</p>\n",
     *             "en": "<p>adfcvdav</p>\n"
     *         },
     *         "category": {
     *             "_id": "56fa9edc6028f9b45811e47b",
     *             "name": {
     *                 "en": "NewCategory",
     *                 "ar": ""
     *             }
     *         },
     *         "country": {
     *             "_id": "56c495e48f40aa0e41615cd9",
     *             "name": {
     *                 "en": "United Arab Emirates",
     *                 "ar": "الإمارات العربية المتحدة"
     *             }
     *         },
     *         "region": {
     *             "_id": "56c495e48f40aa0e41615cda",
     *             "name": {
     *                 "en": "Abu Dhabi & Al Ain",
     *                 "ar": "أبوضبي و العين"
     *             }
     *         },
     *         "subRegion": {
     *             "_id": "56c495e58f40aa0e41615cf5",
     *             "name": {
     *                 "en": "Abu Dhabi",
     *                 "ar": "أبوضبي"
     *             }
     *         },
     *         "retailSegment": {
     *             "_id": "56c495e58f40aa0e41615cfb",
     *             "name": {
     *                 "en": "Hypermarket",
     *                 "ar": "هايبر ماركيت"
     *             }
     *         },
     *         "outlet": [{
     *             "_id": "56c495e58f40aa0e41615d03",
     *             "name": {
     *                 "en": "Spinneys",
     *                 "ar": "سبينيس"
     *             }
     *         }, {
     *             "_id": "56c495e58f40aa0e41615d01",
     *             "name": {
     *                 "en": "Union COOP",
     *                 "ar": "جمعية الإتحاد"
     *             }
     *         }],
     *         "branch": [{
     *             "_id": "56c495e58f40aa0e41615d1f",
     *             "name": {
     *                 "en": "Spinneys Yas Mall",
     *                 "ar": "سبينيس ياس مول"
     *             }
     *         }, {
     *             "_id": "56c495e58f40aa0e41615d1d",
     *             "name": {
     *                 "en": "Union COOP Marina Mall",
     *                 "ar": "جمعية الإتحاد مارينا مول"
     *             }
     *         }],
     *         "displayType": {
     *             _id: 3,
     *             name: {
     *                 en: "Gondola Head",
     *                 ar: "جندولة أمامية"
     *             }
     *         },
     *         "barcode": "1234",
     *         "packing": "141324",
     *         "ppt": 341324,
     *         "quantity": 134132,
     *         "dateStart": "2016-04-27T21:00:00.000Z",
     *         "dateEnd": "2016-04-27T21:00:00.000Z",
     *         "attachments": [],
     *         "status": "active",
     *         "createdBy": {
     *             "date": "2016-04-29T07:36:05.467Z",
     *             "user": {
     *                 "_id": "56c4961e8f40aa0e41615d53",
     *                 "accessRole": {
     *                     "_id": "56c495e58f40aa0e41615d33",
     *                     "name": {
     *                         "en": "Master Admin"
     *                     },
     *                     "level": 1
     *                 },
     *                 "position": {
     *                     "_id": "56c495e58f40aa0e41615d24",
     *                     "name": {
     *                         "en": "Project manager"
     *                     }
     *                 },
     *                 "lastName": {
     *                     "ar": "مشرف",
     *                     "en": "Admin"
     *                 },
     *                 "firstName": {
     *                     "ar": "فائق",
     *                     "en": "Super"
     *                 },
     *                 "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAgAElEQVR4=="
     *             }
     *         },
     *         "editedBy": {
     *             "user": "56c4961e8f40aa0e41615d53",
     *             "date": "2016-04-29T07:36:16.857Z"
     *         }
     *     }]
     *
     * @method /mobile/promotions/sync
     * @instance
     */

    router.get('/sync', handler.getAllForSync);
    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/promotions`
     *
     * Returns the all existing `promotions`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/promotions'
     *
     * @example Response example:
     *
     * {
     *     "data": [{
     *         "_id": "57230ee5e678b4770b65abcc",
     *         "total": 28,
     *         "promotionType": {
     *             "ar": "<p>afwefadaf</p>\n",
     *             "en": "<p>adfcvdav</p>\n"
     *         },
     *         "category": {
     *             "_id": "56fa9edc6028f9b45811e47b",
     *             "name": {
     *                 "en": "NewCategory",
     *                 "ar": ""
     *             }
     *         },
     *         "country": {
     *             "_id": "56c495e48f40aa0e41615cd9",
     *             "name": {
     *                 "en": "United Arab Emirates",
     *                 "ar": "الإمارات العربية المتحدة"
     *             }
     *         },
     *         "region": {
     *             "_id": "56c495e48f40aa0e41615cda",
     *             "name": {
     *                 "en": "Abu Dhabi & Al Ain",
     *                 "ar": "أبوضبي و العين"
     *             }
     *         },
     *         "subRegion": {
     *             "_id": "56c495e58f40aa0e41615cf5",
     *             "name": {
     *                 "en": "Abu Dhabi",
     *                 "ar": "أبوضبي"
     *             }
     *         },
     *         "retailSegment": {
     *             "_id": "56c495e58f40aa0e41615cfb",
     *             "name": {
     *                 "en": "Hypermarket",
     *                 "ar": "هايبر ماركيت"
     *             }
     *         },
     *         "outlet": [{
     *             "_id": "56c495e58f40aa0e41615d03",
     *             "name": {
     *                 "en": "Spinneys",
     *                 "ar": "سبينيس"
     *             }
     *         }, {
     *             "_id": "56c495e58f40aa0e41615d01",
     *             "name": {
     *                 "en": "Union COOP",
     *                 "ar": "جمعية الإتحاد"
     *             }
     *         }],
     *         "branch": [{
     *             "_id": "56c495e58f40aa0e41615d1f",
     *             "name": {
     *                 "en": "Spinneys Yas Mall",
     *                 "ar": "سبينيس ياس مول"
     *             }
     *         }, {
     *             "_id": "56c495e58f40aa0e41615d1d",
     *             "name": {
     *                 "en": "Union COOP Marina Mall",
     *                 "ar": "جمعية الإتحاد مارينا مول"
     *             }
     *         }],
     *         "displayType": {
     *             _id: 3,
     *             name: {
     *                 en: "Gondola Head",
     *                 ar: "جندولة أمامية"
     *             }
     *         },
     *         "barcode": "1234",
     *         "packing": "141324",
     *         "ppt": 341324,
     *         "quantity": 134132,
     *         "dateStart": "2016-04-27T21:00:00.000Z",
     *         "dateEnd": "2016-04-27T21:00:00.000Z",
     *         "attachments": [],
     *         "status": "active",
     *         "createdBy": {
     *             "date": "2016-04-29T07:36:05.467Z",
     *             "user": {
     *                 "_id": "56c4961e8f40aa0e41615d53",
     *                 "accessRole": {
     *                     "_id": "56c495e58f40aa0e41615d33",
     *                     "name": {
     *                         "en": "Master Admin"
     *                     },
     *                     "level": 1
     *                 },
     *                 "position": {
     *                     "_id": "56c495e58f40aa0e41615d24",
     *                     "name": {
     *                         "en": "Project manager"
     *                     }
     *                 },
     *                 "lastName": {
     *                     "ar": "مشرف",
     *                     "en": "Admin"
     *                 },
     *                 "firstName": {
     *                     "ar": "فائق",
     *                     "en": "Super"
     *                 },
     *                 "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAgAElEQVR4=="
     *             }
     *         },
     *         "editedBy": {
     *             "user": "56c4961e8f40aa0e41615d53",
     *             "date": "2016-04-29T07:36:16.857Z"
     *         }
     *     }],
     *     "total": 28
     * }
     *
     * @method /mobile/promotions
     * @instance
     */

    router.get('/', handler.getAll);

    return router;
};