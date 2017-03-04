/**
 * @module RetailSegment
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var Handler = require('../handlers/retailSegment');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/retailSegment`
     *
     * Returns the all existing `retailSegment`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link RetailSegmentModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/retailSegment'
     *
     * @example Response example:
     *
     *  {
     *  "total": 6,
     *  "data": [{
     *          "_id": "56c495e58f40aa0e41615cf6",
     *          "ID": "6",
     *          "__v": 0,
     *          "configurations": [],
     *          "editedBy": {
     *              "date": "2016-02-17T15:46:45.129Z",
     *              "user": null
     *          },
     *          "createdBy": {
     *              "date": "2016-02-17T15:46:45.129Z",
     *              "user": null
     *          },
     *          "subRegions": [
     *              "56c495e58f40aa0e41615ce9",
     *              "56c495e58f40aa0e41615cea",
     *              "56c495e58f40aa0e41615cf0"
     *          ],
     *          "archived": false,
     *          "imageSrc": "data:image/png;base64,iVBORw0KGgo...AElFTkSuQmCC",
     *          "name": {
     *              "en": "Vans",
     *              "ar": "الشاحنات"
     *          }
     *          }]
     *  }
     *
     * @method /retailSegment
     * @instance
     */

    router.get('/', handler.getAll);
    //router.get('/:parentContentType', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/retailSegment/getForDD`
     *
     * Returns the all existing `retailSegment`
     *
     * @see {@link RetailSegmentModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/retailSegment/getForDD'
     *
     * @example Response example:
     *
     *  [{
     *      "_id": "56c495e58f40aa0e41615cf6",
     *      "name": {
     *          "en": "Vans",
     *          "ar": "الشاحنات"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615cf7",
     *      "name": {
     *          "en": "Wholesale",
     *          "ar": "الجملة"
     *      }
     *  },
     *  {
     *      "_id": "56c495e58f40aa0e41615cfb",
     *      "name": {
     *          "en": "Hypermarket",
     *          "ar": "هايبر ماركيت"
     *      }
     *  }]
     *
     * @method /retailSegment/getForDD
     * @instance
     */

    router.get('/getForDD', handler.getForDD);

    //uses for get configs of provided retailSegments id
    router.get('/forConfigs', handler.getConfigurations);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/retailSegment/:id`
     *
     * Returns existing `retailSegment` by id
     * @see {@link RetailSegment}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/retailSegment/56c495e58f40aa0e41615cf6'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "56c495e58f40aa0e41615cf6",
     *      "ID": "6",
     *      "__v": 0,
     *      "configurations": [],
     *      "editedBy": {
     *          "date": "2016-02-17T15:46:45.129Z",
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-02-17T15:46:45.129Z",
     *          "user": null
     *      },
     *      "subRegions": [
     *          "56c495e58f40aa0e41615ce9",
     *          "56c495e58f40aa0e41615cea",
     *          "56c495e58f40aa0e41615cf0"
     *      ],
     *      "archived": false,
     *      "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAAN...AAElFTkSuQmCC",
     *      "name": {
     *          "en": "Vans",
     *          "ar": "الشاحنات"
     *      }
     *  }
     *
     * @method /retailSegment/:id
     * @instance
     */

    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/retailSegment`
     *
     * Creates new retailSegment.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/retailSegment/'
     *
     * BODY:
     *  {
     *   "configurations": [{"configuration" : "12X6548"}],
     *     "subRegions": [
     *         "56c495e58f40aa0e41615ce9",
     *         "56c495e58f40aa0e41615cea",
     *         "56c495e58f40aa0e41615cf0"
     *     ],
     *     "archived": false,
     *     "imageSrc": "data:image/png;base64,iVBORw0...AAAAElFTkSuQmCC",
     *     "name": {
     *         "en": "Vans new",
     *         "ar": "الشاحنات 1"
     *     }
     *  }
     *
     * @example Response example:
     *
     *  {
     *     "__v": 0,
     *     "_id": "56d5bcf15320a1a0243e7556",
     *     "configurations": [
     *         {
     *             "configuration": "12X6548",
     *             "_id": "56d5bcf15320a1a0243e7557",
     *             "archived": false
     *         }
     *     ],
     *     "editedBy": {
     *         "date": "2016-03-01T16:01:53.050Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-01T16:01:53.050Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "subRegions": [
     *         "56c495e58f40aa0e41615ce9",
     *         "56c495e58f40aa0e41615cea",
     *         "56c495e58f40aa0e41615cf0"
     *     ],
     *     "archived": false,
     *     "imageSrc": "data:image/png;base64,iVBORw0KGgoAAA...AAAAElFTkSuQmCC",
     *     "name": {
     *         "en": "Vans new",
     *         "ar": "الشاحنات 1"
     *     }
     *  }
     *
     * @method /retailSegment
     * @instance
     */

    router.post('/', handler.create);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/retailSegment/remove`
     *
     * Archive retailSegment with ids in body
     *
     * @param {array} ids - array of retailSegment ids
     * @param {string} archived - true if retailSegment need to be archived and false in another case
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/retailSegment/remove'
     *
     * BODY:
     *  {
     *      "ids": ["56d5bcf15320a1a0243e7556"],
     *      "archived": "false"
     *  }
     *
     * @example Response example: status
     *
     * @method /retailSegment/remove
     * @instance
     */

    router.put('/remove', handler.archive);
    router.put('/removeConfiguration', handler.archiveConfiguration);
    router.delete('/deleteConfiguration', handler.deleteConfigurations);
    router.post('/configuration', handler.addConfiguration);
    router.put('/configuration', handler.updateConfiguration);
    router.put('/:id([0-9a-fA-F]{24})', handler.update);
    router.patch('/:id([0-9a-fA-F]{24})', handler.update);

    return router;
};
