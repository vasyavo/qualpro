/**
 * @module Planogram
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/planogram');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/planogram`
     *
     * Returns the all existing `planogram`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link PlanogramModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/planogram'
     *
     * @example Response example:
     *
     *  {
     *  "total": 1,
     *  "data": [{
     *          "_id": "56cb23bc27420dcc06bed2aa",
     *          "country": {
     *              "_id": "56c495e48f40aa0e41615cd1",
     *              "archived": false,
     *              "name": {
     *                  "en": "Iraq"
     *              }
     *          },
     *          "retailSegment": {
     *              "_id": "56c495e58f40aa0e41615cfa",
     *              "archived": false,
     *              "name": {
     *                  "en": "A-class shops",
     *                  "ar": "المحلات التجارية فئة-أ"
     *              }
     *          },
     *          "product": {
     *              "_id": "56a36686446815602bf6bc17",
     *              "archived": false,
     *              "name": {
     *                  "en": "something",
     *                  "ar": "arSomething"
     *              }
     *          },
     *          "configuration": {
     *              "_id": "56cc5fedb5820a9c0334849b",
     *              "name": "666x98"
     *          },
     *          "editedBy": {
     *              "date": "2016-02-24T10:51:43.222Z",
     *              "user": "56c4961e8f40aa0e41615d53"
     *          },
     *          "createdBy": {
     *              "date": "2016-02-22T15:05:32.622Z",
     *              "user": null
     *          },
     *          "archived": false,
     *          "fileID": {
     *              "_id": "577e45e5f61352e825899f6f",
     *              "name": "577e45e3f61352e825899f6e.jpg",
     *              "contentType": "image/jpeg",
     *              "originalName": "porsche-normal.jpg",
     *              "createdBy": {
     *                  "date": "2016-07-07T12:07:01.006Z",
     *                  "user": "572b78d23e8b657506a4a9a6"
     *              },
     *              "preview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...INwyT9elFFFAH//2Q=="
     *           }
     *          "configurations": [{
     *                              "configuration": "55x12",
     *                              "_id": "56cb23ac27420dcc06bed2a8",
     *                              "archived": false
     *                            },
     *                            {
     *                              "configuration": "666x98",
     *                              "_id": "56cc5fedb5820a9c0334849b",
     *                              "archived": false
     *                            }]
     *          }]
     *  }
     *
     * @method /planogram
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/planogram/:id`
     *
     * Returns existing `planogram` by id
     * @see {@link PlanogramModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/planogram/56cb23bc27420dcc06bed2aa'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56cb23bc27420dcc06bed2aa",
     *      "country": "56c495e48f40aa0e41615cd1",
     *      "retailSegment": "56c495e58f40aa0e41615cfa",
     *      "product": "56a36686446815602bf6bc17",
     *      "configuration": "56cc5fedb5820a9c0334849b",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-24T10:51:43.222Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-22T15:05:32.622Z",
     *          "user": null
     *      },
     *      "archived": false,
     *      "fileID": {
     *          "_id": "578340108a0822c968519d9c",
     *          "name": "5783400f8a0822c968519d9b.png",
     *          "contentType": "image/png",
     *          "originalName": "background.png",
     *          "createdBy": {
     *              "date": "2016-07-11T06:43:28.275Z",
     *              "user": "572b78d23e8b657506a4a9a6"
     *          },
     *          "prview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQAB...FxINwyT9elFFFAH//2Q=="
     *      }
     *  }
     *
     * @method /planogram/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/planogram`
     *
     * Creates new planogram.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/planogram/'
     *
     * BODY:
     *  {
     *      data: {
     *         "countryId": "56c495e48f40aa0e41615cd1",
     *         "retailSegmentId": "56c495e58f40aa0e41615cfa",
     *         "productId": "56a36686446815602bf6bc17",
     *         "configurationId": "56cb23ac27420dcc06bed2a8"
     *      }
     *  }
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     *  {
     *  "_id": "578340108a0822c968519d9d",
     *  "country": {
     *      "_id": "572b50362d3a970436e3acfa",
     *      "name": {
     *          "ar": "سلطنة عمان",
     *          "en": "OMAN"
     *      }
     *  },
     *  "retailSegment": {
     *      "_id": "572b50372d3a970436e3ad4c",
     *      "name": {
     *          "en": "A - CLASS",
     *          "ar": "المحلات التجارية الكبيرة فئة-أ"
     *      },
     *      "configurations": [
     *          {
     *              "configuration": "123x45",
     *              "_id": "574dc5e25eb89d4a302a0d02",
     *              "archived": false
     *          },
     *          {
     *              "configuration": "22_x__",
     *              "_id": "574dc5e65eb89d4a302a0d03",
     *              "archived": false
     *          },
     *          {
     *              "configuration": "123x12",
     *              "_id": "574dc5eb5eb89d4a302a0d04",
     *              "archived": false
     *          }
     *      ]
     *  },
     *  "product": {
     *      "_id": "5749b463839e4a5957578d1d",
     *      "name": {
     *          "ar": "ذرة صغيرة",
     *          "en": "BABY CORN COBS"
     *      }
     *  },
     *  "configuration": {
     *      "_id": "574dc5eb5eb89d4a302a0d04",
     *      "name": "123x12"
     *  },
     *  "editedBy": {
     *      "date": "2016-07-11T06:43:28.336Z",
     *      "user": null
     *  },
     *  "createdBy": {
     *      "date": "2016-07-11T06:43:28.335Z",
     *      "user": {
     *          "_id": "572b78d23e8b657506a4a9a6",
     *          "accessRole": {
     *              "_id": "572b50412d3a970436e3b516",
     *              "name": {
     *                  "en": "Master Admin",
     *                  "ar": "مسؤول التطبيق الرئيسي"
     *              },
     *              "level": 1
     *          },
     *          "position": {
     *              "_id": "572b50412d3a970436e3b528",
     *              "name": {
     *                  "en": "MANAGING DIRECTOR",
     *                  "ar": "المدير العام"
     *              }
     *          },
     *          "lastName": {
     *              "ar": "",
     *              "en": "MasterAdmin"
     *          },
     *          "firstName": {
     *              "ar": "",
     *              "en": "Testera"
     *          }
     *      }
     *  },
     *  "archived": false,
     *  "fileID": {
     *      "_id": "578340108a0822c968519d9c",
     *      "name": "5783400f8a0822c968519d9b.png",
     *      "contentType": "image/png",
     *      "originalName": "background.png",
     *      "createdBy": {
     *          "date": "2016-07-11T06:43:28.275Z",
     *          "user": "572b78d23e8b657506a4a9a6"
     *      },
     *      "prview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQAB...FxINwyT9elFFFAH//2Q=="
     *  }
     *}
     *
     * @method /planogram
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/planogram/remove`
     *
     * Archive planograms with ids in body
     *
     * @param {array} ids - array of planogram ids
     * @param {string} archived - true if planogram need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/planogram/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56d5aec65320a1a0243e7555"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /planogram/remove
     * @instance
     */

    router.put('/remove', handler.archive);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/planogram/:id`
     *
     * Updated planogram with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/planogram/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     *  {
     *     "countryId": "56c495e48f40aa0e41615cd1",
     *     "retailSegmentId": "56c495e58f40aa0e41615cfa",
     *     "productId": "56a36686446815602bf6bc17",
     *     "configurationId": "56cb23ac27420dcc06bed2a8",
     *     "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQAB...FxINwyT9elFFFAH//2Q=="
     *  }
     *
     * @example Response example:
     * BODY:
     *  {
     *     "_id": "56d5aec65320a1a0243e7555",
     *     "country": {
     *         "_id": "56c495e48f40aa0e41615cd1",
     *         "name": {
     *             "en": "Iraq"
     *         }
     *     },
     *     "retailSegment": {
     *         "_id": "56c495e58f40aa0e41615cfa",
     *         "name": {
     *             "en": "A-class shops",
     *             "ar": "المحلات التجارية فئة-أ"
     *         }
     *     },
     *     "configuration": {
     *         "_id": "56cb23ac27420dcc06bed2a8",
     *         "name": [
     *             "55x12"
     *         ]
     *     },
     *     "editedBy": {
     *         "date": "2016-03-01T15:08:04.723Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-01T15:01:26.993Z",
     *         "user": null
     *     },
     *     "archived": false,
     *      "fileID": {
     *          "_id": "578340108a0822c968519d9c",
     *          "name": "5783400f8a0822c968519d9b.png",
     *          "contentType": "image/png",
     *          "originalName": "background.png",
     *          "createdBy": {
     *              "date": "2016-07-11T06:43:28.275Z",
     *              "user": "572b78d23e8b657506a4a9a6"
     *          },
     *          "prview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQAB...FxINwyT9elFFFAH//2Q=="
     *      }
     *  }
     *
     * @method /planogram/:id
     * @instance
     */

    router.put('/:id', multipartMiddleware, handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/planogram/:id`
     *
     * Updated planogram with specific id. Put into body only properties to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/planogram/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     *  {
     *      data: {
     *          "countryId": "56c495e48f40aa0e41615cd1",
     *          "retailSegmentId": "56c495e58f40aa0e41615cfa"
     *      }
     *  }
     *
     * @example Response example:
     * BODY:
     *  {
     *     "_id": "56d5aec65320a1a0243e7555",
     *     "country": {
     *         "_id": "56c495e48f40aa0e41615cd1",
     *         "name": {
     *             "en": "Iraq"
     *         }
     *     },
     *     "retailSegment": {
     *         "_id": "56c495e58f40aa0e41615cfa",
     *         "name": {
     *             "en": "A-class shops",
     *             "ar": "المحلات التجارية فئة-أ"
     *         }
     *     },
     *     "configuration": {
     *         "_id": "56cb23ac27420dcc06bed2a8",
     *         "name": [
     *             "55x12"
     *         ]
     *     },
     *     "editedBy": {
     *         "date": "2016-03-01T15:08:04.723Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-01T15:01:26.993Z",
     *         "user": null
     *     },
     *     "archived": false,
     *      "fileID": {
     *          "_id": "578340108a0822c968519d9c",
     *          "name": "5783400f8a0822c968519d9b.png",
     *          "contentType": "image/png",
     *          "originalName": "background.png",
     *          "createdBy": {
     *              "date": "2016-07-11T06:43:28.275Z",
     *              "user": "572b78d23e8b657506a4a9a6"
     *          },
     *          "prview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQAB...FxINwyT9elFFFAH//2Q=="
     *      }
     *  }
     *
     * @method /planogram/:id
     * @instance
     */

    router.patch('/:id', multipartMiddleware, handler.update);

    return router;
};
