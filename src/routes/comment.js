/**
 * @module Comment
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var Handler = require('../handlers/comment');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/withAttachments', handler.getAllWithAttachments);

    router.get('/:id', handler.getById);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/comment`
     *
     * Returns the all existing `comments`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     * @param {string} objectiveId - id of objective
     *
     * @see {@link CommentModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/comment?objectiveId=56f2518384dfcbc414d33e2d'
     *
     * @example Response example:
     *
     * {
     *      "total": 1,
     *      "data": [
     *          {
     *              "_id":"56fd0e22763b949420167cee",
     *              "total":1,
     *              "body":"qweqweqw",
     *                  "attachments":[
     *              ],
     *              "isArchived":false,
     *              "createdBy":{
     *                  "date":"2016-03-31T11:46:42.833Z",
     *                  "user":{
     *                      "accessRole":{
     *                          "_id":"56c495e58f40aa0e41615d31",
     *                          "editedBy":{
     *                              "date":"2016-02-17T15:46:45.478Z",
     *                              "user":null
     *                          },
     *                          "createdBy":{
     *                              "date":"2016-02-17T15:46:45.478Z",
     *                              "user":null
     *                          },
     *                          "name":{
     *                              "en":"Area Manager"
     *                          },
     *                          "__v":0,
     *                          "level":3
     *                      },
     *                      "lastName":{
     *                          "ar":"",
     *                          "en":"Admin"
     *                      },
     *                      "firstName":{
     *                          "ar":"",
     *                          "en":"Super"
     *                      },
     *                      "imageSrc":"base64Image"
     *                  },
     *                  "diffDate":22104,
     *                  "dateFromNow":"now"
     *              },
     *              "editedBy":{
     *                  "date":"2016-03-31T11:46:42.833Z",
     *                  "user":null
     *              }
     *         }
     *     ]
     * }
     *
     * @method /comment
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/comment`
     *
     * Creates new comment.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/comment/'
     *
     * BODY:
     *  {
     *      data: {
     *          commentText: 'text',
     *          objectiveId: '56c495e58f40aa0e41615d31'
     *      },
     *      files: 'encoded by form, files here'
     *  }
     *
     * @example Response example:
     *
     * {
     *      "_id":"56fd1089763b949420167cef",
     *      "body":"ssasdas",
     *          "attachments":{
     *      },
     *      "isArchived":false,
     *      "createdBy":{
     *          "date":"2016-03-31T11:56:57.305Z",
     *          "user":{
     *              "accessRole":{
     *                  "_id":"56c495e58f40aa0e41615d31",
     *                  "editedBy":{
     *                      "date":"2016-02-17T15:46:45.478Z",
     *                      "user":null
     *                  },
     *                  "createdBy":{
     *                      "date":"2016-02-17T15:46:45.478Z",
     *                      "user":null
     *                  },
     *                  "name":{
     *                      "en":"Area Manager"
     *                  },
     *                  "__v":0,
     *                  "level":3
     *              },
     *              "lastName":{
     *                  "ar":"",
     *                  "en":"Admin"
     *              },
     *              "firstName":{
     *                  "ar":"",
     *                  "en":"Super"
     *              },
     *              "imageSrc":"data:image/png;base64,iVBORw0...kSuQmCC"
     *          },
     *          "diffDate":11,
     *          "dateFromNow":"now"
     *      },
     *      "editedBy":{
     *          "date":"2016-03-31T11:56:57.305Z",
     *          "user":null
     *      }
     *  }
     *
     * @method /comment
     * @instance
     */
    router.post('/', multipartMiddleware, handler.create);

    return router;
};
