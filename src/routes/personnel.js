/**
 * @module Personnel
 */

var express = require('express');
var router = express.Router();
var PersonnelHandler = require('../handlers/personnel');
var access = require('../helpers/access');

module.exports = function (db, app, event, redis) {
    var handler = new PersonnelHandler(db, redis, event);
    var csrfProtection = app.get('csrfProtection');
    var checkAuth = access.checkAuth;

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/personnel`
     *
     * Returns the all existing `personnel`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link PersonnelModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/personnel'
     *
     * @example Response example:
     *
     *  {
     *  "total": 32,
     *  "data": [{
     *          "_id": "56c495e58f40aa0e41615d46",
     *          "position": {
     *              "_id": "56c495e58f40aa0e41615d26",
     *              "name": {
     *                  "en": "Merchandiser"
     *              }
     *          },
     *          "avgRating": null,
     *          "manager": {
     *              "_id": "56c495e58f40aa0e41615d40",
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Koch"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Robert"
     *              }
     *          },
     *          "lastAccess": null,
     *          "firstName": {
     *              "ar": "طائر شجاع",
     *              "en": "Hans"
     *          },
     *          "lastName": {
     *              "ar": "طائر شجاع",
     *              "en": "Andersen"
     *          },
     *          "imageSrc": "data:image/png;base64,iVBORw0KG...ElFTkSuQmCC",
     *          "email": "",
     *          "phoneNumber": "966505555599",
     *          "accessRole": {
     *              "_id": "56c495e58f40aa0e41615d2f",
     *              "name": {
     *                  "en": "Salesman"
     *              }
     *          },
     *          "createdBy": {
     *              "date": "2016-02-17T10:09:29.661Z"
     *          },
     *          "vacation": {
     *              "onLeave": false
     *          },
     *          "status": "",
     *          "region": [{
     *              "_id": "56c495e48f40aa0e41615ce4",
     *              "name": {
     *                  "en": "Riyadh"
     *              }
     *          }],
     *          "subRegion": [{
     *              "_id": "56c495e58f40aa0e41615ceb",
     *              "name": {
     *                  "en": "Al Ghat"
     *              }
     *          }],
     *          "retailSegment": [{
     *              "_id": "56c495e58f40aa0e41615cf7",
     *              "name": {
     *                  "en": "Wholesale",
     *                  "ar": "الجملة"
     *              }
     *          }],
     *          "outlet": [{
     *              "_id": "56c495e58f40aa0e41615cfc",
     *              "name": {
     *                  "en": "Choithrams"
     *              }
     *          }],
     *          "branch": [{
     *              "_id": "56c495e58f40aa0e41615d11",
     *              "name": {
     *                  "en": "Choithrams Al Ghat"
     *              }
     *          }],
     *          "country": [{
     *              "_id": "56c495e48f40aa0e41615cd4",
     *              "name": {
     *                  "en": "Kingdom of Saudi Arabia"
     *              }
     *          }],
     *          "currentLanguage": "en",
     *          "super": false
     *          }]
     *  }
     *
     * @method /personnel
     * @instance
     */

    router.get('/', checkAuth, handler.getAll);
    router.get('/getForTree', checkAuth, handler.getForTree);
    router.get('/getForDd', checkAuth, handler.getForDD);
    router.get('/getStatusForDd', checkAuth, handler.getStatusForDD);
    router.get('/personnelFroSelection', checkAuth, handler.getAll);
    router.get('/personnelTasks', handler.getPersonnelTasks);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/personnel/currentUser`
     *
     * Returns current `personnel`
     * @see {@link PersonnelModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/personnel/currentUser'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56c495e58f40aa0e41615d46",
     *      "position": {
     *          "_id": "56c495e58f40aa0e41615d26",
     *          "name": {
     *              "en": "Merchandiser"
     *          }
     *      },
     *      "avgRating": null,
     *      "manager": {
     *          "_id": "56c495e58f40aa0e41615d40",
     *          "lastName": {
     *              "ar": "",
     *              "en": "Koch"
     *          },
     *          "firstName": {
     *              "ar": "",
     *              "en": "Robert"
     *          }
     *      },
     *      "lastAccess": null,
     *      "firstName": {
     *          "ar": "طائر شجاع",
     *          "en": "Hans"
     *      },
     *      "lastName": {
     *          "ar": "طائر شجاع",
     *          "en": "Andersen"
     *      },
     *      "imageSrc": "data:image/png;base64,iVBOR...AAAAAElFTkSuQmCC",
     *      "email": "",
     *      "phoneNumber": "966505555599",
     *      "accessRole": {
     *          "_id": "56c495e58f40aa0e41615d2f",
     *          "name": {
     *              "en": "Salesman"
     *          }
     *      },
     *      "createdBy": {
     *          "date": "2016-02-17T10:09:29.661Z"
     *      },
     *      "vacation": {
     *          "onLeave": false
     *      },
     *      "status": "",
     *      "region": [{
     *          "_id": "56c495e48f40aa0e41615ce4",
     *          "name": {
     *              "en": "Riyadh"
     *          }
     *      }],
     *      "subRegion": [{
     *          "_id": "56c495e58f40aa0e41615ceb",
     *          "name": {
     *              "en": "Al Ghat"
     *          }
     *      }],
     *      "retailSegment": [{
     *          "_id": "56c495e58f40aa0e41615cf7",
     *          "name": {
     *              "en": "Wholesale",
     *              "ar": "الجملة"
     *          }
     *      }],
     *      "outlet": [{
     *          "_id": "56c495e58f40aa0e41615cfc",
     *          "name": {
     *              "en": "Choithrams"
     *          }
     *      }],
     *      "branch": [{
     *          "_id": "56c495e58f40aa0e41615d11",
     *          "name": {
     *              "en": "Choithrams Al Ghat"
     *          }
     *      }],
     *      "country": [{
     *          "_id": "56c495e48f40aa0e41615cd4",
     *          "name": {
     *              "en": "Kingdom of Saudi Arabia"
     *          }
     *      }],
     *      "currentLanguage": "en",
     *      "super": false
     *  }
     *
     * @method /personnel/currentUser
     * @instance
     */

    router.get('/currentUser', checkAuth, handler.getById);
    router.get('/existSuperAdmin', handler.existSuperAdmin);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/personnel/:id`
     *
     * Returns existing `personnel` by id
     * @see {@link PersonnelModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/personnel/56c495e58f40aa0e41615d46'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56c495e58f40aa0e41615d46",
     *      "position": {
     *          "_id": "56c495e58f40aa0e41615d26",
     *          "name": {
     *              "en": "Merchandiser"
     *          }
     *      },
     *      "avgRating": null,
     *      "manager": {
     *          "_id": "56c495e58f40aa0e41615d40",
     *          "lastName": {
     *              "ar": "",
     *              "en": "Koch"
     *          },
     *          "firstName": {
     *              "ar": "",
     *              "en": "Robert"
     *          }
     *      },
     *      "lastAccess": null,
     *      "firstName": {
     *          "ar": "طائر شجاع",
     *          "en": "Hans"
     *      },
     *      "lastName": {
     *          "ar": "طائر شجاع",
     *          "en": "Andersen"
     *      },
     *      "imageSrc": "data:image/png;base64,iVBOR...AAAAAElFTkSuQmCC",
     *      "email": "",
     *      "phoneNumber": "966505555599",
     *      "accessRole": {
     *          "_id": "56c495e58f40aa0e41615d2f",
     *          "name": {
     *              "en": "Salesman"
     *          }
     *      },
     *      "createdBy": {
     *          "date": "2016-02-17T10:09:29.661Z"
     *      },
     *      "vacation": {
     *          "onLeave": false
     *      },
     *      "status": "",
     *      "region": [{
     *          "_id": "56c495e48f40aa0e41615ce4",
     *          "name": {
     *              "en": "Riyadh"
     *          }
     *      }],
     *      "subRegion": [{
     *          "_id": "56c495e58f40aa0e41615ceb",
     *          "name": {
     *              "en": "Al Ghat"
     *          }
     *      }],
     *      "retailSegment": [{
     *          "_id": "56c495e58f40aa0e41615cf7",
     *          "name": {
     *              "en": "Wholesale",
     *              "ar": "الجملة"
     *          }
     *      }],
     *      "outlet": [{
     *          "_id": "56c495e58f40aa0e41615cfc",
     *          "name": {
     *              "en": "Choithrams"
     *          }
     *      }],
     *      "branch": [{
     *          "_id": "56c495e58f40aa0e41615d11",
     *          "name": {
     *              "en": "Choithrams Al Ghat"
     *          }
     *      }],
     *      "country": [{
     *          "_id": "56c495e48f40aa0e41615cd4",
     *          "name": {
     *              "en": "Kingdom of Saudi Arabia"
     *          }
     *      }],
     *      "currentLanguage": "en",
     *      "super": false
     *  }
     *
     * @method /personnel/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', checkAuth, handler.getById);
    router.post('/passwordChange/:forgotToken', csrfProtection, handler.changePassword);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/personnel/forgotPass`
     *
     * Searches for user with specific email or phone end send him/her mail with istructions of reseting password
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/personnel/forgotPass'
     *
     * BODY:
     * {
     *      login:'somebody@mail.com'
     * }
     *
     * 'OR'
     *
     * BODY:
     * {
     *      login:'+191126565123',
     *      ifPhone: 'true'
     * }
     *
     * RESPONSE : status
     *
     * @method /personnel/forgotPass
     * @instance
     */

    router.post('/forgotPass', csrfProtection, handler.forgotPassword);
    router.post('/checkVerificationCode', csrfProtection, handler.checkVerifCode);
    router.get('/confirm/:token', handler.confirm);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/personnel`
     *
     * Creates new personnel. Put personnel in body. Date in format YYYY/MM/DD or YYYY-MM-DD
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/personnel/'
     *
     * BODY:
     * {
     *   "imageSrc" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAA",
     *   "firstName" : "Somebody777",
     *   "lastName" : "Familyname",
     *   "country" : ["56c495e48f40aa0e41615cd1"],
     *   "email" : "someemail@mail.com",
     *   "phoneNumber" : "98345873458",
     *   "manager" : "56c495e58f40aa0e41615d34",
     *   "position" : "56c495e58f40aa0e41615d2a",
     *   "dateJoined" : "1934/07/24",
     *   "description" : "Really great guy"
     * }
     *
     * @example Response example:
     *
     * {
     *  "_id": "56cdc913f333a9cc29ac2945",
     *  "position": {
     *      "_id": "56c495e58f40aa0e41615d2a",
     *      "name": {
     *          "en": "Managing director"
     *      }
     *  },
     *  "avgRating": null,
     *  "manager": {
     *      "_id": "56c495e58f40aa0e41615d34",
     *      "lastName": {
     *          "ar": "ماء",
     *          "en": "Ali"
     *      },
     *      "firstName": {
     *          "ar": "ماء",
     *          "en": "Mohammad"
     *      }
     *  },
     *  "lastAccess": null,
     *  "firstName": {
     *      "ar": "",
     *      "en": ""
     *  },
     *  "lastName": {
     *      "ar": "",
     *      "en": ""
     *  },
     *  "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAA",
     *  "email": "someemail@mail.com",
     *  "phoneNumber": "98345873458",
     *  "accessRole": null,
     *  "createdBy": {
     *      "date": "2016-02-24T15:15:31.331Z",
     *      "user": {
     *          "_id": "56c4961e8f40aa0e41615d53"
     *      }
     *  },
     *  "vacation": {
     *      "onLeave": false
     *  },
     *  "status": "sendPass",
     *  "region": [],
     *  "subRegion": [],
     *  "retailSegment": [],
     *  "outlet": [],
     *  "branch": [],
     *  "country": [
     *      {
     *          "_id": "56c495e48f40aa0e41615cd1",
     *          "name": {
     *              "en": "Iraq"
     *          }
     *      }
     *  ],
     *  "currentLanguage": "en",
     *  "super": false
     * }
     *
     * @method /personnel/create
     * @instance
     */
    router.post('/', checkAuth, handler.create);
    router.post('/createSuper', handler.createSuper);
    router.put('/remove', handler.archive);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/personnel/deviceId`
     *
     * Add deviceId to user session
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/personnel/deviceId'
     *
     * BODY:
     * {
     *   deviceId: "eIAnMDJE74Y:APA91bElb132Lw2rPxfwVW60PhkfxJ8vvOqhtXlqTBVp_w2L41psZP0tgRjfiIt2AoQBt-22oyq1mx9IoYzccEEQFd967e8Q3vPpl1zh1BhYZEyfXyNp4keDLiFhOxf72EEJPKKr9LrT"
     * }
     *
     * @example Response example: status
     *
     * @method /personnel/deviceId
     * @instance
     */

    router.post('/deviceId', handler.deviceId);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/personnel/:id`
     *
     * Updated personnel with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/personnel/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     * {
     *   "imageSrc" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAA",
     *   "firstName" : "Somebody777",
     *   "lastName" : "Familyname",
     *   "country" : ["56c495e48f40aa0e41615cd1"],
     *   "manager" : "56c495e58f40aa0e41615d34",
     *   "position" : "56c495e58f40aa0e41615d2a",
     *   "dateJoined" : "1934/07/24",
     *   "description" : "Really great guy"
     *   ...
     * }
     *
     * @example Response example: status
     *
     * @method /personnel/:id
     * @instance
     */

    router.put('/:id([0-9a-fA-F]{24})', checkAuth, handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/personnel/`
     *
     * Updated personnel with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/personnel/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     * {
     *   firstName : "Strangeguy",
     *   phoneNumber : "98347773458"
     * }
     *
     * @example Response example: status
     *
     * @method /personnel/:id
     * @instance
     */

    router.patch('/:id([0-9a-fA-F]{24})', checkAuth, handler.update);

    router.delete('/:id([0-9a-fA-F]{24})', checkAuth, handler.remove);

    return router;
};
