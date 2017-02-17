/**
 * @module Mobile - Personnel
 */

var express = require('express');
var router = express.Router();
var personnelHandler = require('../../handlers/personnel');
var access = require('../../helpers/access');

module.exports = function () {
    var handler = new personnelHandler();
    var checkAuth = access.checkAuth;

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel`
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
     *     'http://192.168.88.15:9797/mobile/personnel'
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
     * @method /mobile/personnel
     * @instance
     */

    router.get('/', checkAuth, handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel/currentUser`
     *
     * Returns current `personnel`
     * @see {@link PersonnelModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/currentUser'
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
     * @method /mobile/personnel/currentUser
     * @instance
     */

    router.get('/currentUser', checkAuth, handler.getById);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel/sync`
     *
     * Returns the all changed and created `personnel`
     *
     * @param {data} lastLogOut - last log out date
     *
     * @see {@link PersonnelModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/sync?lastLogOut=2016'
     *
     * @example Response example:
     *
     *  [
     *       {
     *          "_id":"56c495e58f40aa0e41615d44",
     *          "position":{
     *             "_id":"56c495e58f40aa0e41615d28",
     *             "name":{
     *                "en":"Sales manager"
     *             }
     *          },
     *          "avgRating":null,
     *          "manager":{
     *             "_id":"56c495e58f40aa0e41615d42",
     *             "lastName":{
     *                "ar":"",
     *                "en":"Ivanov"
     *             },
     *             "firstName":{
     *                "ar":"",
     *                "en":"Imran"
     *             }
     *          },
     *          "lastAccess":null,
     *          "firstName":{
     *             "ar":"",
     *             "en":"Albert"
     *          },
     *          "lastName":{
     *             "ar":"",
     *             "en":"Einstein"
     *          },
     *          "imageSrc":"data:image/png;base64,iVBORw0KGgoAAAANSUhE...FTkSuQmCC",
     *          "email":"albert@alalali.com",
     *          "phoneNumber":"971502140019",
     *          "accessRole":{
     *             "_id":"56c495e58f40aa0e41615d30",
     *             "name":{
     *                "en":"Area in charge Manager"
     *             },
     *             "level":4
     *          },
     *          "createdBy":{
     *             "date":"2016-02-17T10:09:29.661Z"
     *          },
     *          "vacation":{
     *             "onLeave":false
     *          },
     *          "status":"",
     *          "region":[
     *             {
     *                "_id":"56c495e48f40aa0e41615cda",
     *                "name":{
     *                   "en":"Abu Dhabi & Al Ain",
     *                   "ar":"أبوضبي و العين"
     *                }
     *             }
     *          ],
     *          "subRegion":[
     *
     *          ],
     *          "retailSegment":[
     *
     *          ],
     *          "outlet":[
     *
     *          ],
     *          "branch":[
     *
     *          ],
     *          "country":[
     *             {
     *                "_id":"56c495e48f40aa0e41615cd9",
     *                "name":{
     *                   "en":"United Arab Emirates",
     *                   "ar":"الإمارات العربية المتحدة"
     *                }
     *             }
     *          ],
     *          "currentLanguage":"en",
     *          "super":false,
     *          "archived":false,
     *          "temp":null,
     *          "confirmed":null,
     *          "translated":null
     *       }
     *   ]
     *
     * @method /mobile/personnel/sync
     * @instance
     */

    router.get('/sync', checkAuth, handler.getAllForSync);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel/:id`
     *
     * Returns existing `personnel` by id
     * @see {@link PersonnelModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/56c495e58f40aa0e41615d46'
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
     * @method /mobile/personnel/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', checkAuth, handler.getById);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel/forgotPass`
     *
     * Searches for user with specific email or phone end send him/her mail with istructions of reseting password
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/forgotPass'
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
     * @method /mobile/personnel/forgotPass
     * @instance
     */

    router.post('/forgotPass', handler.forgotPassword);
    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel/checkVerificationCode`
     *
     * Searches for user with specific phone and code. As a result return error or url for new change password request
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/checkVerificationCode'
     *
     * BODY:
     * {
     *      phone:'380509999999',
     *      code:'111111'
     * }
     *
     * RESPONSE : url
     *
     * @method /mobile/personnel/checkVerificationCode
     * @instance
     */

    router.post('/checkVerificationCode', handler.checkVerifCode);
    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel/passwordChange/:forgotToken`
     *
     * Searches for user with specific token. As a result return error or url to login page
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/passwordChange/:forgotToken'
     *
     * BODY:
     * {
     *      pass:'newPass'
     * }
     *
     * RESPONSE : url
     *
     * @method /mobile/personnel/passwordChange/:forgotToken
     * @instance
     */

    router.post('/passwordChange/:forgotToken', handler.changePassword);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel`
     *
     * Creates new personnel. Put personnel in body. Date in format YYYY/MM/DD or YYYY-MM-DD
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/'
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
     * @method /mobile/personnel/
     * @instance
     */

    router.post('/', checkAuth, handler.create);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel/:id`
     *
     * Updated personnel with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/55eeb7b58f9c1deb19000005'
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
     * @method /mobile/personnel/:id
     * @instance
     */

    router.put('/:id', checkAuth, handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/personnel/`
     *
     * Updated personnel with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/personnel/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     * {
     *   firstName : "Strangeguy",
     *   phoneNumber : "98347773458"
     * }
     *
     * @example Response example: status
     *
     * @method /mobile/personnel/:id
     * @instance
     */

    router.patch('/:id', checkAuth, handler.update);

    return router;
};