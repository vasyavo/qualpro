/**
 * @module Mobile - AchievementForm
 */

var express = require('express');
var router = express.Router();
var AchievementForm = require('../../handlers/achievementForm');
var access = require('../../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    var handler = new AchievementForm(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/achievementForm`
     *
     * Creates new Achievement form. Put achievement form in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/achievementForm/'
     *
     * BODY:
     * {
     *   data :{
     *           "description"  : {
     *             "en":"enDescription",
     *             "ar":"arDescription"
     *           },
     *           "additionalComment"  : {
     *             "en":"enComment",
     *             "ar":"arComment"
     *           },
     *           "country"      : "56c495e48f40aa0e41615cd4",
     *           "region"       : "56c495e48f40aa0e41615ce4",
     *           "subRegion"    : "56c495e58f40aa0e41615ceb",
     *           "retailSegment": "56c495e58f40aa0e41615cf9",
     *           "outlet"       : "56c495e58f40aa0e41615d00",
     *           "branch"       : "56c495e58f40aa0e41615d11",
     *           "location"     : {
     *             "en":"english Country > Region > Sub region > Trade channel> outlet > branch",
     *             "ar":"arabic Country > Region > Sub region > Trade channel> outlet > branch"
     *           }
     *         }
     *  },
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "57265087a66ff2102abc05df",
     *      "description": {
     *          "ar": "arDescription",
     *          "en": "enDescription"
     *      },
     *      "additionalComment": {
     *          "ar": "arComment",
     *          "en": "enComment"
     *      },
     *      "country": {
     *          "_id": "56c495e48f40aa0e41615cd4",
     *          "name": {
     *              "en": "Kingdom of Saudi Arabia"
     *          }
     *      },
     *      "region": {
     *          "_id": "56c495e48f40aa0e41615ce4",
     *          "name": {
     *              "en": "Riyadh"
     *          }
     *      },
     *      "subRegion": {
     *          "_id": "56c495e58f40aa0e41615ceb",
     *          "name": {
     *              "en": "Al Ghat"
     *          }
     *      },
     *      "retailSegment": {
     *          "_id": "56c495e58f40aa0e41615cf9",
     *          "name": {
     *              "en": "B-class shops",
     *              "ar": "المحلات التجارية فئة-ب"
     *          }
     *      },
     *      "outlet": {
     *          "_id": "56c495e58f40aa0e41615d00",
     *          "name": {
     *              "en": "Waitrose"
     *          }
     *      },
     *      "branch": {
     *          "_id": "56c495e58f40aa0e41615d11",
     *          "name": {
     *              "ar": "",
     *              "en": "Choithrams Al Ghat"
     *          }
     *      },
     *      "location": {
     *          "ar": "arabic Country > Region > Sub region > Trade channel> outlet > branch",
     *          "en": "english Country > Region > Sub region > Trade channel> outlet > branch"
     *      },
     *      "archived": false,
     *      "createdBy": {
     *          "date": "2016-05-01T18:52:55.923Z",
     *          "user": {
     *              "_id": "56c4961e8f40aa0e41615d53",
     *              "accessRole": {
     *                  "_id": "56c495e58f40aa0e41615d33",
     *                  "name": {
     *                      "en": "Master Admin"
     *                  },
     *                  "level": 1
     *              },
     *              "position": {
     *                  "_id": "56c495e58f40aa0e41615d29",
     *                  "name": {
     *                      "en": "General manager"
     *                  }
     *              },
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Admin"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Super"
     *              },
     *              "imageSrc": "data:image/png;base64,iVBORw0KGgo...ElFTkSuQmCC"
     *          }
     *      },
     *      "editedBy": {
     *          "date": "2016-05-01T18:52:55.925Z",
     *          "user": null
     *      },
     *      "attachments": []
     *  }
     *
     * @method /mobile/achievementForm/
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);

    router.get('/', handler.getAll);

    return router;
};

