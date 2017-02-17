/**
 * @module Questionnary
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/questionnary');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.post('/', handler.create);

    router.patch('/:id([0-9a-fA-F]{24})', handler.update);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/questionnary/answer`
     *
     * Creates answer for questionnary
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/questionnary/answer'
     *
     * BODY:
     *
     *   {
     *        "personnelId": "56c495e58f40aa0e41615d49",
     *        "questionnaryId": "571df049c7ea5bb52c9b035f",
     *        "questionId": "571df049c7ea5bb52c9b0361",
     *        "optionIndex": ["1", "2"],
     *        "text": "some text"
     *        "country": "56c495e48f40aa0e41615cd1",
     *        "region": "56c495e48f40aa0e41615ce7"
     *    }
     *
     *  @example Response example:
     *
     * {
     *      "__v": 0,
     *      "personnelId": "56c4961e8f40aa0e41615d53",
     *      "questionnaryId": "572b58db977e8ef236da237d",
     *      "questionId": "572b58db977e8ef236da237e",
     *      "_id": "572cb7897cc027c439c413cf",
     *      "editedBy": {
     *          "date": "2016-05-06T15:26:01.497Z",
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-05-06T15:26:01.492Z",
     *          "user": "56c4961e8f40aa0e41615d53"
     *      },
     *      "optionIndex": [
     *          1
     *      ],
     *      "branch": null,
     *      "outlet": null,
     *      "retailSegment": null,
     *      "subRegion": null,
     *      "region": null,
     *      "country": null
     *  }
     *
     * @method /questionnary/answer
     * @instance
     */

    router.post('/answer', handler.questionnaryAnswer);

    router.get('/', handler.getAll);
    router.get('/answer', handler.getAnswers);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);


    return router;
};
