/**
 * @module Mobile - Questionnary
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');
var Handler = require('../../handlers/questionnary');

module.exports = function (db, redis, event) {
    var handler = new Handler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/answer', handler.questionnaryAnswer);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/questionnary`
     *
     * Returns the all existing `questionnary`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link QuestionnaryModel}
     *
     * @example Request example:
     *     'http://192.168.88.21:9797/mobile/questionnary'
     *
     * @example Response example:
     *
     *  {
     *  "total": 1,
     *  "data": [
     *  {
     *  "_id": "57b71d64f5c88af01f8e3904",
     *  "title": "fdsfdgffd",
     *  "status": "active",
     *  "editedBy": {
     *    "date": "2016-08-19T14:55:29.341Z",
     *    "user": "572b78d23e8b657506a4a9a6"
     *  },
     *  "createdBy": {
     *    "date": "2016-08-19T14:53:24.476Z",
     *    "user": "572b78d23e8b657506a4a9a6"
     *  },
     *  "questions": [
     *    {
     *      "type": "singleChoice",
     *      "title": "11111",
     *      "_id": "57b71d64f5c88af01f8e3905",
     *      "options": [
     *        "ghgfhghgfhhgf"
     *      ]
     *    }
     *  ],
     *  "countAnswered": 0,
     *  "countAll": 188,
     *  "branch": null,
     *  "outlet": null,
     *  "retailSegment": null,
     *  "subRegion": null,
     *  "region": null,
     *  "country": null,
     *  "location": {
     *    "ar": "",
     *    "en": ""
     *  },
     *  "dueDate": "2016-08-24T21:00:00.000Z",
     *  "creationDate": "2016-08-19T14:53:24.476Z",
     *  "updateDate": "2016-08-19T14:55:29.341Z",
     *  "lastDate": "2016-08-19T14:55:29.341Z"
     *}
     * ]}
     *
     * @method /mobile/questionnary
     * @instance
     */

    router.get('/sync', handler.getAllForSync);

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/questionnary/:id`
     *
     * Returns existing `questionnary` by id
     * @see {@link QuestionnaryModel}
     *
     * @example Request example:
     *     'http://192.168.88.21:9797/mobile/questionnary/57b71d64f5c88af01f8e3904'
     *
     * @example Response example:
     *
     *  {
     *  "_id": "57b71d64f5c88af01f8e3904",
     *  "title": "fdsfdgffd",
     *  "status": "active",
     *  "editedBy": {
     *    "date": "2016-08-19T14:55:29.341Z",
     *    "user": "572b78d23e8b657506a4a9a6"
     *  },
     *  "createdBy": {
     *    "date": "2016-08-19T14:53:24.476Z",
     *    "user": "572b78d23e8b657506a4a9a6"
     *  },
     *  "questions": [
     *    {
     *      "type": "singleChoice",
     *      "title": "11111",
     *      "_id": "57b71d64f5c88af01f8e3905",
     *      "options": [
     *        "ghgfhghgfhhgf"
     *      ]
     *    }
     *  ],
     *  "countAnswered": 0,
     *  "countAll": 188,
     *  "branch": null,
     *  "outlet": null,
     *  "retailSegment": null,
     *  "subRegion": null,
     *  "region": null,
     *  "country": null,
     *  "location": {
     *    "ar": "",
     *    "en": ""
     *  },
     *  "dueDate": "2016-08-24T21:00:00.000Z",
     *  "creationDate": "2016-08-19T14:53:24.476Z",
     *  "updateDate": "2016-08-19T14:55:29.341Z",
     *  "lastDate": "2016-08-19T14:55:29.341Z"
     *}
     *
     * @method /mobile/questionnary/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    return router;
};