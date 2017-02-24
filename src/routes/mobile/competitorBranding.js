/**
 * @module Mobile - CompetitorBranding
 */

const express = require('express');
const router = express.Router();
const CompetitorBranding = require('../../handlers/competitorBranding');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

const ACL_MODULES = require('../../constants/aclModulesNames');

module.exports = function () {
    const access = require('../../helpers/access')();
    const handler = new CompetitorBranding();
    const checkAuth = require('../../helpers/access').checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/competitorBranding`
     *
     * Creates new Competitor branding. Put competitor branding in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/competitorBranding/'
     *
     * BODY:
     * {
     *   data :{
     *          "description"  : {
     *            "en":"enDescription",
     *            "ar":"arDescription"
     *          },
     *          "category"     : ["56a0d3062c9618d142f45479"],
     *          "brand"        : "56e6af4d2973c06c2336becc",
     *          "country"      : "56c495e48f40aa0e41615cd4",
     *          "region"       : "56c495e48f40aa0e41615ce4",
     *          "subRegion"    : "56c495e58f40aa0e41615ceb",
     *          "retailSegment": "56c495e58f40aa0e41615cf9",
     *          "outlet"       : "56c495e58f40aa0e41615d00",
     *          "branch"       : "56c495e58f40aa0e41615d11",
     *          "location": {
     *              "en":"english Country > Region > Sub region > Trade channeloutlet > outlet > branch",
     *              "ar":"arabic Country > Region > Sub region > Trade channeloutlet > outlet > branch"
     *          },
     *          "displayType"  : "3",
     *          "dateStart"    : "2016-04-17T15:46:44.692Z",
     *          "dateEnd"      : "2016-04-19T15:46:44.692Z"
     *        }
     *  },
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     *  {
     *    "_id": "5719f60b218ed22c1b812fe5",
     *    "description": {
     *        "ar": "arDescription",
     *        "en": "enDescription"
     *    },
     *    "category": [{
     *            "_id": "56a0d3062c9618d142f45479",
     *            "name": {
     *                "ar": "testar",
     *                "en": "test"
     *            }
     *    }],
     *    "brand": {
     *            "_id": "56e6af4d2973c06c2336becc",
     *            "name": {
     *                "en": "bdbdf",
     *                "ar": "bddbf"
     *            }
     *    },
     *    "country": {
     *            "_id": "56c495e48f40aa0e41615cd4",
     *            "name": {
     *                "en": "Kingdom of Saudi Arabia"
     *            }
     *    },
     *    "region": {
     *            "_id": "56c495e48f40aa0e41615ce4",
     *            "name": {
     *                "en": "Riyadh"
     *            }
     *    },
     *    "subRegion": {
     *            "_id": "56c495e58f40aa0e41615ceb",
     *            "name": {
     *                "en": "Al Ghat"
     *            }
     *    },
     *    "retailSegment": {
     *            "_id": "56c495e58f40aa0e41615cf9",
     *            "name": {
     *                "en": "B-class shops",
     *                "ar": "المحلات التجارية فئة-ب"
     *            }
     *    },
     *    "outlet": {
     *            "_id": "56c495e58f40aa0e41615d00",
     *            "name": {
     *                "en": "Waitrose"
     *            }
     *    },
     *    "branch": {
     *            "_id": "56c495e58f40aa0e41615d11",
     *            "name": {
     *                "ar": "",
     *                "en": "Choithrams Al Ghat"
     *            }
     *    },
     *    "location": {
     *        "en":"english Country > Region > Sub region > Trade channeloutlet > outlet > branch",
     *        "ar":"arabic Country > Region > Sub region > Trade channeloutlet > outlet > branch"
     *    },
     *    "displayType": {
     *        _id: 3,
     *        name: {
     *            en: "Gondola Head",
     *            ar: "جندولة أمامية"
     *        }
     *    },
     *    "dateStart": "2016-04-17T15:46:44.692Z",
     *    "dateEnd": "2016-04-19T15:46:44.692Z",
     *    "archived": false,
     *    "createdBy": {
     *        "date": "2016-04-22T09:59:39.921Z",
     *        "user": {
     *            "_id": "56c4961e8f40aa0e41615d53",
     *            "accessRole": {
     *                "_id": "56c495e58f40aa0e41615d33",
     *                "name": {
     *                    "en": "Master Admin"
     *                },
     *                "level": 1
     *            },
     *            "position": {
     *                "_id": "56c495e58f40aa0e41615d29",
     *                "name": {
     *                    "en": "General manager"
     *                }
     *            },
     *            "lastName": {
     *                "ar": "",
     *                "en": "Admin"
     *            },
     *            "firstName": {
     *                "ar": "",
     *                "en": "Super"
     *            },
     *            "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAAN...ElFTkSuQmCC"
     *        }
     *    },
     *    "editedBy": {
     *        "date": "2016-04-22T09:59:39.922Z",
     *        "user": null
     *    },
     *    "attachments": [],
     *    "comments": []
     *  }
     *
     * @method /mobile/competitorBranding/
     * @instance
     */

    router.post('/', multipartMiddleware, function(req, res, next) {
        access.getWriteAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function(err) {
            err ? next(err) : next();
        })
    }, handler.create);

    router.get('/', function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function(err) {
            err ? next(err) : next();
        })
    }, handler.getAll);

    return router;
};
