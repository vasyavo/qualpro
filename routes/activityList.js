var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var Handler = require('../handlers/activityList');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/activityList`
     *
     * Returns the all existing `activityList`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     *
     * @see {@link activityListModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/activityList'
     *
     * @example Response example:
     *
     *{
     *    "data":
     *    [{"_id"              : "574ef24b979cc33c34fa41ba",
     *        "total"          : 4,
     *        "module"         : {"_id": 6, "name": {"en": "Personnel", "ar": "AR_ Personnel"}},
     *        "actionType"     : "Updated",
     *        "itemType"       : "personnel",
     *        "itemDetails"    : "",
     *        "createdBy"      : {
     *            "date"    : "2016-06-01T14:33:47.669Z",
     *            "user"    : {
     *                "_id"       : "572c308b0ea95de030962619",
     *                "accessRole": {"name": {"en": "Country Admin", "ar": "مسؤول التطبيق"}, "level": 2},
     *                "position"  : {"name": {"en": "COUNTRY MANAGER", "ar": "مدير سوق"}},
     *                "lastName"  : {"ar": "", "en": "Country Admin"},
     *                "firstName" : {"ar": "", "en": "Tester"}
     *            },
     *            "diffDate": 407078068
     *        },
     *        "country"        : [{"_id": "572b60d432f3d0985041994c", "name": {"ar": "7", "en": "TestCountry"}}],
     *        "region"         : [{"_id": "572b64054e98a154501aa81c", "name": {"ar": "RegionAR", "en": "RegionTest"}}],
     *        "subRegion"      : [],
     *        "branch"         : [],
     *        "itemId"         : "5731fe1b766635104deb6270",
     *        "itemName"       : {"en": "Teste NewAM", "ar": " "},
     *        "accessRoleLevel": 3,
     *        "assignedTo"     : [],
     *        "creationDate"   : "2016-06-01T14:33:47.669Z"
     *    }, {"_id"            : "574ef162d4395d1033ab20df",
     *        "total"          : 4,
     *        "module"         : {"_id": 6, "name": {"en": "Personnel", "ar": "AR_ Personnel"}},
     *        "actionType"     : "Updated",
     *        "itemType"       : "personnel",
     *        "itemDetails"    : "",
     *        "createdBy"      : {
     *            "date"    : "2016-06-01T14:29:54.036Z",
     *            "user"    : {
     *                "_id"       : "572c308b0ea95de030962619",
     *                "accessRole": {"name": {"en": "Country Admin", "ar": "مسؤول التطبيق"}, "level": 2},
     *                "position"  : {"name": {"en": "COUNTRY MANAGER", "ar": "مدير سوق"}},
     *                "lastName"  : {"ar": "", "en": "Country Admin"},
     *                "firstName" : {"ar": "", "en": "Tester"}
     *            },
     *            "diffDate": 407311701
     *        },
     *        "country"        : [{"_id": "572b60d432f3d0985041994c", "name": {"ar": "7", "en": "TestCountry"}}],
     *        "region"         : [],
     *        "subRegion"      : [],
     *        "branch"         : [],
     *        "itemId"         : "572c308b0ea95de030962619",
     *        "itemName"       : {"en": "Tester Country Admin", "ar": " "},
     *        "accessRoleLevel": 2,
     *        "assignedTo"     : [],
     *        "creationDate"   : "2016-06-01T14:29:54.036Z"
     *    }, {"_id"            : "574ef160d4395d1033ab20dc",
     *        "total"          : 4,
     *        "module"         : {"_id": 6, "name": {"en": "Personnel", "ar": "AR_ Personnel"}},
     *        "actionType"     : "Updated",
     *        "itemType"       : "personnel",
     *        "itemDetails"    : "",
     *        "createdBy"      : {
     *            "date"    : "2016-06-01T14:29:52.252Z",
     *            "user"    : {
     *                "_id"       : "572c308b0ea95de030962619",
     *                "accessRole": {"name": {"en": "Country Admin", "ar": "مسؤول التطبيق"}, "level": 2},
     *                "position"  : {"name": {"en": "COUNTRY MANAGER", "ar": "مدير سوق"}},
     *                "lastName"  : {"ar": "", "en": "Country Admin"},
     *                "firstName" : {"ar": "", "en": "Tester"}
     *            },
     *            "diffDate": 407313485
     *        },
     *        "country"        : [{"_id": "572b60d432f3d0985041994c", "name": {"ar": "7", "en": "TestCountry"}}],
     *        "region"         : [],
     *        "subRegion"      : [],
     *        "branch"         : [],
     *        "itemId"         : "572c308b0ea95de030962619",
     *        "itemName"       : {"en": "Tester Country Admin", "ar": " "},
     *        "accessRoleLevel": 2,
     *        "assignedTo"     : [],
     *        "creationDate"   : "2016-06-01T14:29:52.252Z"
     *    }, {"_id"            : "574dc81661ec170c98f5f430",
     *        "total"          : 4,
     *        "module"         : {"_id": 18, "name": {"en": "In-store Reporting", "ar": "AR_ In-store Reporting"}},
     *        "actionType"     : "Updated",
     *        "itemType"       : "inStoreTasks",
     *        "itemDetails"    : "",
     *        "createdBy"      : {
     *            "date"    : "2016-05-31T17:21:26.261Z",
     *            "user"    : {
     *                "_id"       : "572c308b0ea95de030962619",
     *                "accessRole": {"name": {"en": "Country Admin", "ar": "مسؤول التطبيق"}, "level": 2},
     *                "position"  : {"name": {"en": "COUNTRY MANAGER", "ar": "مدير سوق"}},
     *                "lastName"  : {"ar": "", "en": "Country Admin"},
     *                "firstName" : {"ar": "", "en": "Tester"}
     *            },
     *            "diffDate": 483419476
     *        },
     *        "country"        : [],
     *        "region"         : [],
     *        "subRegion"      : [],
     *        "branch"         : [],
     *        "itemId"         : "5739829fb206790723e5fb6c",
     *        "itemName"       : {"ar": "", "en": "test"},
     *        "accessRoleLevel": 2,
     *        "assignedTo"     : ["572b78d23e8b657506a4a9a6"],
     *        "creationDate"   : "2016-05-31T17:21:26.261Z"
     *    }],
     *        "total":4
     *}
     *
     * @method /activityList
     * @instance
     */


    router.get('/', handler.getAll);

/**
 * __Type__ `GET`
 *
 * Base ___url___ for build __requests__ is `http:/<host>:<port>/activityList/badge`
 *
 * Returns the number of badge count from currentUser `activityList`
 *
 *
 *
 * @example Request example:
 *     'http://192.168.88.15:9797/activityList/badge'
 *
 * @example Response example:
 *{"badge":"1"}
 *
 * @method activityList/badge
 * @instance
 */
    router.get('/badge', handler.getBadge);
    /**
     * __Type__ `DELETE`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/activityList/badge`
     *
     *  Reset the number of badge count from currentUser `activityList`
     *
     *
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/activityList/badge'
     *
     * @example Response example:
     *{"message": "OK Delete"}
     *
     * @method activityList/badge
     * @instance
     */
    router.delete('/badge', handler.deleteBadge);

    return router;
};

