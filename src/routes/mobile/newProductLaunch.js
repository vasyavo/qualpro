/**
 * @module Mobile - NewProductLaunch
 */

const express = require('express');
const router = express.Router();
const NewProductLaunch = require('../../handlers/newProductLaunch');
const access = require('../../helpers/access');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

const ACL_MODULES = require('../../constants/aclModulesNames');

module.exports = function() {
    const handler = new NewProductLaunch();
    const access = require('../../helpers/access')();
    const checkAuth = require('../../helpers/access').checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/newProductLaunch`
     *
     * Creates new product launch. Put new product launch in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/newProductLaunch/'
     *
     * BODY:
     * {
     *   data :{
     *           "additionalComment"  : {
     *             "en":"enComment",
     *             "ar":"arComment"
     *           },
     *           "category"     : "56a0d3062c9618d142f45479",
     *           "variant"      : {
     *             "name":"blaBlaVariant"
     *           },
     *           "brand"        : {
     *             "_id": "56e6af4d2973c06c2336becc",
     *             "name":""
     *           },
     *           "country"      : "56c495e48f40aa0e41615cd4",
     *           "region"       : "56c495e48f40aa0e41615ce4",
     *           "subRegion"    : "56c495e58f40aa0e41615ceb",
     *           "retailSegment": "56c495e58f40aa0e41615cf9",
     *           "outlet"       : "56c495e58f40aa0e41615d00",
     *           "branch"       : "56c495e58f40aa0e41615d11",
     *           "origin"       : "56bb0545631d7f8e4166b8bc",
     *           "price"        : "18 AED",
     *           "packing"      : "200g",
     *           "location"     : {
     *             "en":"english Country > Region > Sub region > Trade channel> outlet > branch",
     *             "ar":"arabic Country > Region > Sub region > Trade channel> outlet > branch"
     *           },
     *           "distributor"     : {
     *             "en":"englishDistributor",
     *             "ar":"arabicDistributor"
     *           },
     *           "displayType"  : "3",
     *           "shelfLifeStart"    : "2016-04-17T15:46:44.692Z",
     *           "shelfLifeEnd"      : "2016-04-19T15:46:44.692Z"
     *         }
     *  },
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "572761a0dc8a94e8189fc9b2",
     *      "additionalComment": {
     *          "ar": "arComment",
     *          "en": "enComment"
     *      },
     *      "category": {
     *          "_id": "56a0d3062c9618d142f45479",
     *          "name": {
     *              "ar": "testar",
     *              "en": "test"
     *          }
     *      },
     *      "variant": {
     *          "name": "blaBlaVariant",
     *          "_id": "blaBlaVariant"
     *      },
     *      "brand": {
     *          "_id": "56e6af4d2973c06c2336becc",
     *          "name": {
     *              "en": "bdbdf",
     *              "ar": "bddbf"
     *          }
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
     *      "origin": {
     *          "_id": "56bb0545631d7f8e4166b8bc",
     *          "name": "Central African Republic"
     *      },
     *      "price": "18 AED",
     *      "packing": "200g",
     *      "location": {
     *          "ar": "arabic Country > Region > Sub region > Trade channel> outlet > branch",
     *          "en": "english Country > Region > Sub region > Trade channel> outlet > branch"
     *      },
     *      "displayType": {
     *          _id: 3,
     *          name: {
     *              en: "Gondola Head",
     *              ar: "جندولة أمامية"
     *          }
     *      },
     *      "distributor": {
     *          "ar": "arabicDistributor",
     *          "en": "englishDistributor"
     *      },
     *      "shelfLifeStart": "2016-04-17T15:46:44.692Z",
     *      "shelfLifeEnd": "2016-04-19T15:46:44.692Z",
     *      "archived": false,
     *      "createdBy": {
     *          "date": "2016-05-02T14:18:08.903Z",
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
     *              "imageSrc": "data:image/png;base64,iVBORw0KGgo...FTkSuQmCC"
     *          }
     *      },
     *      "editedBy": {
     *          "date": "2016-05-02T14:18:08.905Z",
     *          "user": null
     *      },
     *      "attachments": []
     *  }
     *
     * @method /mobile/newProductLaunch/
     * @instance
     */

    router.post('/', function(req, res, next) {
        access.getWriteAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, function(err) {
            err ? next(err) : next();
        })
    }, multipartMiddleware, handler.create);

    router.get('/', function(req, res, next) {
        access.getReadAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, function(err) {
            err ? next(err) : next();
        })
    }, handler.getAll);

    return router;
};

