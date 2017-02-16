/**
 * @module Mobile - CompetitorItem
 */

var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/competitorItem');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/competitorItem`
     *
     * Returns the all existing `competitorItem`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link CompetitorItemModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/competitorItem'
     *
     * @example Response example:
     *
     *  {
     *  "total": 2,
     *  "data": [{
     *              "_id": "56bc8d5da7f8db30645f7ec2",
     *              "name": {
     *                  "en": "aaa",
     *                  "ar": "bbbb"
     *              },
     *              "packing": "dfghj",
     *              "size": "dfgh",
     *              "origin": [
     *                  {
     *                      "_id": "56bb0545631d7f8e4166b8c4",
     *                      "name": "Benin"
     *                  },
     *                  {
     *                      "_id": "56bb0545631d7f8e4166b8c1",
     *                      "name": "Bahrain"
     *                  },
     *                  {
     *                      "_id": "56bb0545631d7f8e4166b8c9",
     *                      "name": "Kuwait"
     *                  },
     *                  {
     *                      "_id": "56bb0545631d7f8e4166b8d0",
     *                      "name": "Angola"
     *                  }
     *              ],
     *              "brand": {
     *                  "_id": "56bab1653cf2257456c29ad4",
     *                  "name": {
     *                      "ar": "sdfsdf",
     *                      "en": "dsdf"
     *                  }
     *              },
     *              "variant": {
     *                  "_id": "56bb4ad75c151aa009e30a17",
     *                  "name": {
     *                      "en": "dfgdfg",
     *                      "ar": "fdgdfgd"
     *                  }
     *              },
     *              "archived": false,
     *              "createdBy": {
     *                  "date": "2016-02-11T13:32:13.783Z",
     *                  "user": "569d11fbc0348a0613de61af"
     *              },
     *              "editedBy": {
     *                  "date": "2016-02-11T13:32:13.783Z",
     *                  "user": "569d11fbc0348a0613de61af"
     *              },
     *              "product": {
     *                  "_id": "56a36686446815602bf6bc17",
     *                  "name": {
     *                      "en": "something",
     *                      "ar": "arSomething"
     *                  }
     *              }
     *      }]
     *  }
     *
     * @method /mobile/competitorItem
     * @instance
     */

    router.get('/', handler.getAll);

    router.get('/sync', handler.getAllForSync);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/competitorItem/:id`
     *
     * Returns existing `competitorItem` by id
     * @see {@link CompetitorItemModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/competitorItem/56bc8d5da7f8db30645f7ec2'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56bc8d5da7f8db30645f7ec2",
     *      "brand": "56bab1653cf2257456c29ad4",
     *      "variant": "56bb4ad75c151aa009e30a17",
     *      "__v": 0,
     *      "editedBy": {
     *          "date": "2016-02-11T13:32:13.783Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "createdBy": {
     *          "date": "2016-02-11T13:32:13.783Z",
     *          "user": "569d11fbc0348a0613de61af"
     *      },
     *      "archived": false,
     *      "origin": [
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c1",
     *              "name": "Bahrain"
     *          },
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c4",
     *              "name": "Benin"
     *          },
     *          {
     *              "_id": "56bb0545631d7f8e4166b8c9",
     *              "name": "Kuwait"
     *          },
     *          {
     *              "_id": "56bb0545631d7f8e4166b8d0",
     *              "name": "Angola"
     *          }
     *      ],
     *      "size": "dfgh",
     *      "packing": "dfghj",
     *      "name": {
     *          "en": "aaa",
     *          "ar": "bbbb"
     *      }
     *  }
     *
     * @method /mobile/competitorItem/:id
     * @instance
     */

    router.get('/:id', handler.getById);

    return router;
};


