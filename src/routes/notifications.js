var express = require('express');
var router = express.Router();
var NotificationsHandler = require('../handlers/notifications');
var access = require('../helpers/access');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function () {
    var handler = new NotificationsHandler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/notifications`
     *
     * Creates new notification.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/notifications/'
     *
     * BODY:
     *  {
     *      "recipient": "574535a7844cfd5309b70da6,574840fa86f35262453ace7d",
     *      "description": {
     *          "en": "<p>abc</p>\n",
     *          "ar": ""
     *      }
     *  }
     *
     * @example Response example:
     *
     *
     *
     *  {
     *    "_id": "578374cc3811a73a2da439ac",
     *    "total": 1,
     *    "author": {
     *      "user": {
     *        "_id": "572b78d23e8b657506a4a9a6",
     *        "accessRole": {
     *          "_id": "572b50412d3a970436e3b516",
     *          "name": {
     *            "en": "Master Admin",
     *            "ar": "مسؤول التطبيق الرئيسي"
     *          },
     *          "level": 1
     *        },
     *        "position": {
     *          "_id": "572b50412d3a970436e3b528",
     *          "name": {
     *            "en": "MANAGING DIRECTOR",
     *            "ar": "المدير العام"
     *          }
     *        },
     *        "lastName": {
     *          "ar": "",
     *          "en": "MasterAdmin"
     *        },
     *        "firstName": {
     *          "ar": "",
     *          "en": "Testera"
     *        },
     *        "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDSQEAoYlicQkDOpBq1JwrT09VmulqGC1xeKKu6BVkeLWIwqoNdoFj7VatXrcpVWpnrrUMklIYsISMYgEImGTEBLeS+i5WTTLvPdm5r15M+/N3D+Tu8z9/j7vzl1+9zeusnXrjuAkRwEFBVwOHA4XvhRw4HDY8KmAA4cDhwOHw4B2BZyRQ7tmtinhwGEbU2
     *  }
     *
     * @method /notifications
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);

    router.put('/count', handler.editPersonnelNotificationCount);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/notifications`
     *
     * Returns the all existing `notifications`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link NotificationsModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/notifications'
     *
     * @example Response example:
     *
     *  {
          "data": [
            {
              "_id": "577e612a624665d83eddbdc0",
              "total": 1,
              "author": {
                "user": {
                  "_id": "572b78d23e8b657506a4a9a6",
                  "accessRole": {
                    "_id": "572b50412d3a970436e3b516",
                    "name": {
                      "en": "Master Admin",
                      "ar": "مسؤول التطبيق الرئيسي"
                    },
                    "level": 1
                  },
                  "position": {
                    "_id": "572b50412d3a970436e3b528",
                    "name": {
                      "en": "MANAGING DIRECTOR",
                      "ar": "المدير العام"
                    }
                  },
                  "lastName": {
                    "ar": "",
                    "en": "MasterAdmin"
                  },
                  "firstName": {
                    "ar": "",
                    "en": "Testera"
                  },
                  "imageSrc": "data:image/png;base64,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"
                },
                "date": "2016-07-07T14:03:22.192Z"
              },
              "recipients": [
                {
                  "_id": "5745687851ea65ab13053637",
                  "accessRole": {
                    "_id": "572b50412d3a970436e3b516",
                    "name": {
                      "en": "Master Admin",
                      "ar": "مسؤول التطبيق الرئيسي"
                    },
                    "level": 1
                  },
                  "position": {
                    "_id": "572b50412d3a970436e3b518",
                    "name": {
                      "en": "MASTER UPLOADER",
                      "ar": "مسؤول تحميل البيانات الرئيسي"
                    }
                  },
                  "lastName": {
                    "ar": "",
                    "en": "Sasha"
                  },
                  "firstName": {
                    "ar": "",
                    "en": "Sasha"
                  },
                  "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC"
                }
              ],
              "description": {
                "ar": "",
                "en": ""
              },
              "country": [],
              "region": [],
              "subRegion": [],
              "branch": [],
              "retailSegment": [],
              "outlet": []
            }
          ],
          "total": 1
        }
     *
     * @method /notifications
     * @instance
     */

    router.get('/', handler.getAll);

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    return router;
};