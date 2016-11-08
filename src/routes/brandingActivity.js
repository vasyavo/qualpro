var express = require('express');
var router = express.Router();
var BrandingActivityHandler = require('../handlers/brandingActivity');
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    var handler = new BrandingActivityHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brandingActivity`
     *
     * Creates new outlet.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/brandingAndDisplay/'
     *
     * BODY:
     *
     *     {
     *         "save": false,
     *         "category": "5749b463839e4a5957578d42",
     *         "branch": [
     *         "57344cd35543a55616714a74"
     *     ],
     *         "displayType": "a",
     *         "dateStart": "2016-07-13T21:00:00.000Z",
     *         "dateEnd": "2016-07-30T21:00:00.000Z",
     *         "description": {
     *         "en": "<p>iiiiiii</p>\n",
     *         "ar": ""
     *     }
     * }
     *
     * @example Response example:
     *
     *  {
     *    "_id": "57752b888caaa5e21eed49b9",
     *    "dateStart": "2016-06-15T21:00:00.000Z",
     *    "dateEnd": "2016-07-30T21:00:00.000Z",
     *    "description": {
     *      "en": "<p>iiiiiiiii</p>\n",
     *      "ar": ""
     *    },
     *    "attachments": [
     *      {
     *        "_id": "57752b888caaa5e21eed49b8",
     *        "createdBy": {
     *          "date": "2016-06-30T14:24:08.377Z",
     *          "user": "572c308b0ea95de030962619"
     *        },
     *        "contentType": "application/pdf",
     *        "originalName": "Lec2.ppt.pdf"
     *      }
     *    ],
     *    "category": [
     *      {
     *        "_id": "5749b463839e4a5957578d42",
     *        "name": {
     *          "ar": "البسبوسة",
     *          "en": "BASBOUSAH"
     *        }
     *      }
     *    ],
     *    "retailSegment": [
     *      {
     *        "_id": "572b50372d3a970436e3ad4a",
     *        "name": {
     *          "en": "C - CLASS",
     *          "ar": "المحلات التجارية الصغيرة"
     *        }
     *      }
     *    ],
     *    "outlet": [
     *      {
     *        "_id": "572b50372d3a970436e3af9b",
     *        "name": {
     *          "en": "24x7 S/M (AL JAZIRA P/STATION SALWA ROAD)",
     *          "ar": "24/ 7 الجزيرة"
     *        }
     *      }
     *    ],
     *    "country": {
     *      "_id": "572b60d432f3d0985041994c",
     *      "name": {
     *        "ar": "7",
     *        "en": "TestCountry"
     *      }
     *    },
     *    "region": [
     *      {
     *        "_id": "572b64054e98a154501aa81c",
     *        "name": {
     *          "ar": "RegionAR",
     *          "en": "RegionTest"
     *        }
     *      }
     *    ],
     *    "subRegion": [
     *      {
     *        "_id": "572b64214e98a154501aa81d",
     *        "name": {
     *          "ar": "ARSubRegion",
     *          "en": "TestSubRegion"
     *        }
     *      }
     *    ],
     *    "branch": [
     *      {
     *        "_id": "57455fd551ea65ab13053633",
     *        "name": {
     *          "en": "Branchnew",
     *          "ar": ""
     *        }
     *      }
     *    ],
     *    "createdBy": {
     *      "date": "2016-06-30T14:24:08.387Z",
     *      "user": {
     *        "accessRole": {
     *          "_id": "572b50412d3a970436e3b515",
     *          "name": {
     *            "en": "Country Admin",
     *            "ar": "مسؤول التطبيق"
     *          }
     *        },
     *        "position": {
     *          "_id": "572b50412d3a970436e3b525",
     *          "name": {
     *            "en": "COUNTRY MANAGER",
     *            "ar": "مدير سوق"
     *          }
     *        },
     *        "lastName": {
     *          "ar": "",
     *          "en": "Country Admin"
     *        },
     *        "firstName": {
     *          "ar": "",
     *          "en": "Tester"
     *        },
     *        "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC"
     *      }
     *    },
     *    "displayType": "b",
     *    "status": "active"
     *  }
     *
     * @method /brandingActivity
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);
    router.put('/:id', multipartMiddleware, handler.update);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brandingActivity/:id`
     *
     * Updated branding activity with specific id. Put into body all model properties
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/brandingAndDisplay/56d5aa815320a1a0243e7553'
     *
     * BODY:
     *  {
     *    "save": false,
     *    "category": "5749b463839e4a5957578d42",
     *    "branch": [
     *      "57455fd551ea65ab13053633"
     *    ],
     *    "displayType": "b",
     *    "dateStart": "2016-06-15T21:00:00.000Z",
     *    "dateEnd": "2016-07-30T21:00:00.000Z",
     *    "description": {
     *      "en": "<p>iiiiiiiii</p>\n",
     *      "ar": ""
     *    },
     *    "attachments": [
     *      "57752b888caaa5e21eed49b8"
     *    ]
     *  }
     *
     * @example Response example:
     * BODY:
     *
     *  {
     *    "_id": "57752b888caaa5e21eed49b9",
     *    "dateStart": "2016-06-15T21:00:00.000Z",
     *    "dateEnd": "2016-07-30T21:00:00.000Z",
     *    "description": {
     *      "en": "<p>iiiiiiiii</p>\n",
     *      "ar": ""
     *    },
     *    "attachments": [
     *      {
     *        "_id": "57752b888caaa5e21eed49b8",
     *        "createdBy": {
     *          "date": "2016-06-30T14:24:08.377Z",
     *          "user": "572c308b0ea95de030962619"
     *        },
     *        "contentType": "application/pdf",
     *        "originalName": "Lec2.ppt.pdf"
     *      }
     *    ],
     *    "category": [
     *      {
     *        "_id": "5749b463839e4a5957578d42",
     *        "name": {
     *          "ar": "البسبوسة",
     *          "en": "BASBOUSAH"
     *        }
     *      }
     *    ],
     *    "retailSegment": [
     *      {
     *        "_id": "572b50372d3a970436e3ad4a",
     *        "name": {
     *          "en": "C - CLASS",
     *          "ar": "المحلات التجارية الصغيرة"
     *        }
     *      }
     *    ],
     *    "outlet": [
     *      {
     *        "_id": "572b50372d3a970436e3af9b",
     *        "name": {
     *          "en": "24x7 S/M (AL JAZIRA P/STATION SALWA ROAD)",
     *          "ar": "24/ 7 الجزيرة"
     *        }
     *      }
     *    ],
     *    "country": {
     *      "_id": "572b60d432f3d0985041994c",
     *      "name": {
     *        "ar": "7",
     *        "en": "TestCountry"
     *      }
     *    },
     *    "region": [
     *      {
     *        "_id": "572b64054e98a154501aa81c",
     *        "name": {
     *          "ar": "RegionAR",
     *          "en": "RegionTest"
     *        }
     *      }
     *    ],
     *    "subRegion": [
     *      {
     *        "_id": "572b64214e98a154501aa81d",
     *        "name": {
     *          "ar": "ARSubRegion",
     *          "en": "TestSubRegion"
     *        }
     *      }
     *    ],
     *    "branch": [
     *      {
     *        "_id": "57455fd551ea65ab13053633",
     *        "name": {
     *          "en": "Branchnew",
     *          "ar": ""
     *        }
     *      }
     *    ],
     *    "createdBy": {
     *      "date": "2016-06-30T14:24:08.387Z",
     *      "user": {
     *        "accessRole": {
     *          "_id": "572b50412d3a970436e3b515",
     *          "name": {
     *            "en": "Country Admin",
     *            "ar": "مسؤول التطبيق"
     *          }
     *        },
     *        "position": {
     *          "_id": "572b50412d3a970436e3b525",
     *          "name": {
     *            "en": "COUNTRY MANAGER",
     *            "ar": "مدير سوق"
     *          }
     *        },
     *        "lastName": {
     *          "ar": "",
     *          "en": "Country Admin"
     *        },
     *        "firstName": {
     *          "ar": "",
     *          "en": "Tester"
     *        },
     *        "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC"
     *      }
     *    },
     *    "displayType": "b",
     *    "status": "active"
     *  }
     *
     *
     * @method /brandingActivity/:id
     * @instance
     */


    router.patch('/:id', multipartMiddleware, handler.update);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/brandingActivity`
     *
     * Returns the all existing `brandingActivity`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link BrandingAndDisplayModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/brandingAndDisplay'
     *
     * @example Response example:
     *
     * {
     *   "data": [
     *     {
     *       "_id": "57752b888caaa5e21eed49b9",
     *       "total": 15,
     *       "description": {
     *         "ar": "",
     *         "en": "<p>iiiiiiiii</p>\n"
     *       },
     *       "displayType": "b",
     *       "dateStart": "2016-06-21T21:00:00.000Z",
     *       "dateEnd": "2016-06-29T21:00:00.000Z",
     *       "attachments": [
     *         {
     *           "_id": "57752b888caaa5e21eed49b8",
     *           "createdBy": {
     *             "date": "2016-06-30T14:24:08.377Z",
     *             "user": "572c308b0ea95de030962619"
     *           },
     *           "contentType": "application/pdf",
     *           "originalName": "Lec2.ppt.pdf"
     *         }
     *       ],
     *       "category": [
     *         {
     *           "_id": "5749b463839e4a5957578d42",
     *           "name": {
     *             "ar": "البسبوسة",
     *             "en": "BASBOUSAH"
     *           }
     *         }
     *       ],
     *       "branch": [
     *         {
     *           "_id": "57344cd35543a55616714a74",
     *           "name": {
     *             "en": "NEWbranch",
     *             "ar": ""
     *           }
     *         }
     *       ],
     *       "country": {
     *         "_id": "572b60d432f3d0985041994c",
     *         "name": {
     *           "ar": "7",
     *           "en": "TestCountry"
     *         }
     *       },
     *       "region": [
     *         {
     *           "_id": "572b64054e98a154501aa81c",
     *           "name": {
     *             "ar": "RegionAR",
     *             "en": "RegionTest"
     *           }
     *         }
     *       ],
     *       "subRegion": [
     *         {
     *           "_id": "57344cab5543a55616714a73",
     *           "name": {
     *             "en": "TestSubRegion_new",
     *             "ar": ""
     *           }
     *         }
     *       ],
     *       "retailSegment": [
     *         {
     *           "_id": "572b647432f3d0985041994d",
     *           "name": {
     *             "ar": "",
     *             "en": "TestRetailSegment"
     *           }
     *         }
     *       ],
     *       "outlet": [
     *         {
     *           "_id": "572b645621f1b5d550435e68",
     *           "name": {
     *             "en": "TestOutlet",
     *             "ar": ""
     *           }
     *         }
     *       ],
     *       "createdBy": {
     *         "date": "2016-06-30T14:24:08.387Z",
     *         "user": {
     *           "accessRole": {
     *             "_id": "572b50412d3a970436e3b515",
     *             "name": {
     *               "en": "Country Admin",
     *               "ar": "مسؤول التطبيق"
     *             }
     *           },
     *           "position": {
     *             "_id": "572b50412d3a970436e3b525",
     *             "name": {
     *               "en": "COUNTRY MANAGER",
     *               "ar": "مدير سوق"
     *             }
     *           },
     *           "lastName": {
     *             "ar": "",
     *             "en": "Country Admin"
     *           },
     *           "firstName": {
     *             "ar": "",
     *             "en": "Tester"
     *           },
     *           "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC"
     *         }
     *       },
     *       "personnel": [
     *         {}
     *       ],
     *       "status": "active"
     *     }
     *   ],
     *   "total": 15
     * }
     *
     * @method /brandingActivity
     * @instance
     */

    router.get('/', handler.getAll);

    router.get('/:id', handler.getById);
    router.delete('/file', handler.removeFileFromBrandingActivity);

    return router;
};
