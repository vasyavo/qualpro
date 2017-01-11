/**
 * @module Form
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var DistributionFormHandler = require('../handlers/distributionForm');

var VisibilityFormHandler = require('../handlers/visibilityForm');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(db, redis, event) {
    var distributionFormHandler = new DistributionFormHandler(db, redis, event);
    var visibilityFormHandler = new VisibilityFormHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/distribution`
     *
     * Creates new distribution form.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/distribution/'
     *
     * BODY:
     *  {
     *      "objective": "56dd86d116c55cb52ee7ed26"
     *  }
     *
     * @example Response example:
     *
     * {
     *     "__v": 0,
     *     "objective": "56dd86d116c55cb52ee7ed26",
     *     "_id": "56ebe0f5b799276936f42540",
     *     "editedBy": {
     *         "user": null
     *     },
     *     "createdBy": {
     *         "date": "2016-03-18T11:05:25.981Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "items": [],
     *     "branches": []
     * }
     *
     * @method /form/distribution
     * @instance
     */

    router.post('/distribution', distributionFormHandler.create);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/distribution`
     *
     * Returns one existing `distribution form`
     *
     * __Next parameters is allowed in query to limit count of items of distribution form in response
     * and set which distribution form to get:__
     *
     * @param {string} _id - _id of distribution form in database
     * @param {string} objective - objective _id or list of objectives _ids separated by comas
     * @param {string} count - count of items of distribution form in response
     * @param {string} page - number of page to show
     *
     * @see {@link DistributionFormModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/distribution?_id=56ebe0f5b799276936f42540'
     *     'http://192.168.88.15:9797/mobile/form/distribution?objective=56dd86d116c55cb52ee7ed26,57036cba3538b0351125ec92'
     *
     * @example Response example:
     *
     * {
     *     "data": [
     *         {
     *             "_id": "56ebe0f5b799276936f42540",
     *             "objective": "56dd86d116c55cb52ee7ed26",
     *             "branches": [
     *                 {
     *                     "_id": "56c495e58f40aa0e41615d14",
     *                     "outlet": {
     *                         "_id": "56c495e58f40aa0e41615d02",
     *                         "name": {
     *                             "en": "Al Maya",
     *                             "ar": "المايا"
     *                         }
     *                     },
     *                     "name": {
     *                         "en": "Al Maya Salalah branch"
     *                     }
     *                 },
     *                 {
     *                     "_id": "56c495e58f40aa0e41615d05",
     *                     "outlet": {
     *                         "_id": "56c495e58f40aa0e41615d03",
     *                         "name": {
     *                             "en": "Spinneys",
     *                             "ar": "سبينيس"
     *                         }
     *                     },
     *                     "name": {
     *                         "en": "Spinneys Sudanese south branch"
     *                     }
     *                 }
     *             ],
     *             "category": [
     *                 {
     *                     "_id": "56a0d3062c9618d142f45479",
     *                     "name": {
     *                         "ar": "testar",
     *                         "en": "test"
     *                     },
     *                     "variant": [
     *                         {
     *                             "_id": "56eac4d68e5305296b0db287",
     *                             "name": {
     *                                 "en": "new three",
     *                                 "ar": ""
     *                             },
     *                             "item": [
     *                                 {
     *                                     "_id": "56eac505c9068dac6b68e68f",
     *                                     "name": {
     *                                         "en": "new cake three",
     *                                         "ar": ""
     *                                     },
     *                                     "branches": [
     *                                         {
     *                                             "branch": "56c495e58f40aa0e41615d05",
     *                                             "indicator": "y"
     *                                         }
     *                                     ]
     *                                 },
     *                                 {
     *                                     "_id": "56eac515c9068dac6b68e690",
     *                                     "name": {
     *                                         "en": "cake three four",
     *                                         "ar": ""
     *                                     },
     *                                     "branches": [
     *                                         {
     *                                             "branch": "56c495e58f40aa0e41615d05",
     *                                             "indicator": "y"
     *                                         },
     *                                         {
     *                                             "branch": "56c495e58f40aa0e41615d14",
     *                                             "indicator": "n"
     *                                         }
     *                                     ]
     *                                 }
     *                             ]
     *                         }
     *                     ],
     *                     "itemCount": 2
     *                 }
     *             ],
     *             "createdBy": {
     *                 "date": "2016-03-18T11:05:25.981Z",
     *                 "user": "56c4961e8f40aa0e41615d53"
     *             },
     *             "editedBy": {
     *                 "user": "56c4961e8f40aa0e41615d53",
     *                 "date": "2016-03-18T12:08:40.262Z"
     *             }
     *         }
     *     ],
     *     "total": 2,
     *     "itemCount": 2
     * }
     *
     * @method /form/distribution
     * @instance
     */

    router.get('/distribution', distributionFormHandler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/distribution/:id`
     *
     * Returns existing `distribution form` by id
     *
     * @see {@link DistributionFormModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/distribution/56ebe0f5b799276936f42540'
     *
     * @example Response example:
     *
     * {
     *     "_id": "56ebe0f5b799276936f42540",
     *     "objective": "56dd86d116c55cb52ee7ed26",
     *     "__v": 1,
     *     "editedBy": {
     *         "date": "2016-03-18T12:08:40.262Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-18T11:05:25.981Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "items": [
     *         {
     *             "category": "56a0d3062c9618d142f45479",
     *             "variant": "56eac4d68e5305296b0db287",
     *             "item": "56eac515c9068dac6b68e690",
     *             "branches": [
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d05",
     *                     "indicator": "y"
     *                 },
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d14",
     *                     "indicator": "n"
     *                 }
     *             ]
     *         },
     *         {
     *             "category": "56a0d3062c9618d142f45479",
     *             "variant": "56eac4d68e5305296b0db287",
     *             "item": "56eac505c9068dac6b68e68f",
     *             "branches": [
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d05",
     *                     "indicator": "y"
     *                 }
     *             ]
     *         }
     *     ],
     *     "branches": [
     *         "56c495e58f40aa0e41615d05",
     *         "56c495e58f40aa0e41615d14"
     *     ]
     * }
     *
     * @method /form/distribution/:id
     * @instance
     */

    router.get('/distribution/:id', distributionFormHandler.getById);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/distribution/:id`
     *
     * Update distribution form with specific id. Put into body 'items' property
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/distribution/56ebe0f5b799276936f42540'
     *
     * BODY:
     *  {
     *      "items": [{
     *          "category": "56a0d3062c9618d142f45479",
     *          "variant": "56eac4d68e5305296b0db287",
     *          "item": "56eac515c9068dac6b68e690",
     *          "branches": [{
     *              "branch": "56c495e58f40aa0e41615d05",
     *              "indicator": "y"
     *          }, {
     *              "branch": "56c495e58f40aa0e41615d14",
     *              "indicator": "n"
     *          }]
     *      }, {
     *          "category": "56a0d3062c9618d142f45479",
     *          "variant": "56eac4d68e5305296b0db287",
     *          "item": "56eac505c9068dac6b68e68f",
     *          "branches": [{
     *              "branch": "56c495e58f40aa0e41615d05",
     *              "indicator": "y"
     *          }]
     *      }]
     *  }
     *
     * @example Response example:
     *
     * {
     *     "_id": "56ebe0f5b799276936f42540",
     *     "objective": "56dd86d116c55cb52ee7ed26",
     *     "__v": 1,
     *     "editedBy": {
     *         "user": "56c4961e8f40aa0e41615d53",
     *         "date": "2016-03-18T12:08:40.262Z"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-18T11:05:25.981Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "items": [
     *         {
     *             "category": "56a0d3062c9618d142f45479",
     *             "variant": "56eac4d68e5305296b0db287",
     *             "item": "56eac515c9068dac6b68e690",
     *             "branches": [
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d05",
     *                     "indicator": "y"
     *                 },
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d14",
     *                     "indicator": "n"
     *                 }
     *             ]
     *         },
     *         {
     *             "category": "56a0d3062c9618d142f45479",
     *             "variant": "56eac4d68e5305296b0db287",
     *             "item": "56eac505c9068dac6b68e68f",
     *             "branches": [
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d05",
     *                     "indicator": "y"
     *                 }
     *             ]
     *         }
     *     ],
     *     "branches": [
     *         "56c495e58f40aa0e41615d05",
     *         "56c495e58f40aa0e41615d14"
     *     ]
     * }
     *
     * @method /form/distribution/:id
     * @instance
     */

    router.put('/distribution/:id', distributionFormHandler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/distribution/:id`
     *
     * Update distribution form with specific id. Put into body 'items' property to update
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/distribution/56ebe0f5b799276936f42540'
     *
     * BODY:
     *  {
     *      "items": [{
     *          "category": "56a0d3062c9618d142f45479",
     *          "variant": "56eac4d68e5305296b0db287",
     *          "item": "56eac515c9068dac6b68e690",
     *          "branches": [{
     *              "branch": "56c495e58f40aa0e41615d05",
     *              "indicator": "y"
     *          }, {
     *              "branch": "56c495e58f40aa0e41615d14",
     *              "indicator": "n"
     *          }]
     *      }, {
     *          "category": "56a0d3062c9618d142f45479",
     *          "variant": "56eac4d68e5305296b0db287",
     *          "item": "56eac505c9068dac6b68e68f",
     *          "branches": [{
     *              "branch": "56c495e58f40aa0e41615d05",
     *              "indicator": "y"
     *          }]
     *      }]
     *  }
     *
     * @example Response example:
     *
     * {
     *     "_id": "56ebe0f5b799276936f42540",
     *     "objective": "56dd86d116c55cb52ee7ed26",
     *     "__v": 1,
     *     "editedBy": {
     *         "user": "56c4961e8f40aa0e41615d53",
     *         "date": "2016-03-18T12:08:40.262Z"
     *     },
     *     "createdBy": {
     *         "date": "2016-03-18T11:05:25.981Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "items": [
     *         {
     *             "category": "56a0d3062c9618d142f45479",
     *             "variant": "56eac4d68e5305296b0db287",
     *             "item": "56eac515c9068dac6b68e690",
     *             "branches": [
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d05",
     *                     "indicator": "y"
     *                 },
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d14",
     *                     "indicator": "n"
     *                 }
     *             ]
     *         },
     *         {
     *             "category": "56a0d3062c9618d142f45479",
     *             "variant": "56eac4d68e5305296b0db287",
     *             "item": "56eac505c9068dac6b68e68f",
     *             "branches": [
     *                 {
     *                     "branch": "56c495e58f40aa0e41615d05",
     *                     "indicator": "y"
     *                 }
     *             ]
     *         }
     *     ],
     *     "branches": [
     *         "56c495e58f40aa0e41615d05",
     *         "56c495e58f40aa0e41615d14"
     *     ]
     * }
     *
     * @method /form/distribution/:id
     * @instance
     */

    router.patch('/distribution/:id', distributionFormHandler.update);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/visibility`
     *
     * Creates new visibility form.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/visibility/'
     *
     * BODY:
     * {
     *     "objective": "56dd86d116c55cb52ee7ed26",
     *     "description": "some description to test"
     * }
     *
     * @example Response example:
     *
     * {
     *     "_id": "56efd8903992ac0a271fa7a0",
     *     "updatedBy": {
     *         "user": null
     *     },
     *     "createdBy": {
     *         "date": "2016-03-21T11:18:40.486Z",
     *         "user": "56c4961e8f40aa0e41615d53"
     *     },
     *     "after": {
     *         "description": "",
     *         "files": []
     *     },
     *     "before": {
     *         "description": "some description to test ",
     *         "files": ["56efd8903992ac0a271fa79f"]
     *     }
     * }
     *
     * @method /form/visibility
     * @instance
     */

    router.post('/visibility', multipartMiddleware, visibilityFormHandler.create);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/visibility`
     *
     * Returns set of existing `visibility form`
     *
     * __Next parameters is allowed in query to set which  form to get:__
     *
     * @param {string} objective - objective _id or list of objectives _ids separated by comas
     *
     * @see {@link VisibilityFormModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/form/visibility?objective=574d40dd1065598d3e270a28,574c7fa5549cfbe54605186d,573f61440d09236954c57aec'
     *
     * @example Response example:
     *
     * [{
     *     "_id": "574c696cb0648bad5c60dbeb",
     *     "objective": "573f61440d09236954c57aec",
     *     "editedBy": {
     *         "user": null
     *     },
     *     "createdBy": {
     *         "date": "2016-05-30T16:25:16.933Z",
     *         "user": "572c308b0ea95de030962619"
     *     },
     *     "after": {
     *         "description": ""
     *     },
     *     "before": {}
     * }, {
     *     "_id": "574c7fa5549cfbe54605186e",
     *     "objective": "574c7fa5549cfbe54605186d",
     *     "editedBy": {
     *         "user": null
     *     },
     *     "createdBy": {
     *         "date": "2016-05-30T18:00:05.436Z",
     *         "user": "572b78d23e8b657506a4a9a6"
     *     },
     *     "after": {
     *         "description": ""
     *     },
     *     "before": {}
     * }, {
     *     "_id": "574d40dd1065598d3e270a29",
     *     "objective": "574d40dd1065598d3e270a28",
     *     "editedBy": {
     *         "user": "572c2cee0ea95de030962615",
     *         "date": "2016-05-31T07:44:31.378Z"
     *     },
     *     "createdBy": {
     *         "date": "2016-05-31T07:44:29.971Z",
     *         "user": "572c2cee0ea95de030962615"
     *     },
     *     "after": {
     *         "description": ""
     *     },
     *     "before": {
     *         "files": {
     *             "_id": "574d40df1065598d3e270a2b",
     *             "contentType": "image/jpeg",
     *             "extension": "jpg",
     *             "originalName": "lacnor-background-responsive.jpg",
     *             "fileName": "574d40df1065598d3e270a2a.jpg",
     *             "url": "http://localhost:9797/files/visibilityForm/574d40df1065598d3e270a2a.jpg"
     *         }
     *     }
     * }]
     *
     * @method /form/visibility
     * @instance
     */

    router.get('/visibility', visibilityFormHandler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/visibility/:id`
     *
     * Returns existing `visibility form` by id
     *
     * @see {@link VisibilityFormModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/visibility/56ebe0f5b799276936f42540'
     *
     * @example Response example:
     *
     * {
     *     "_id": "56efb67de41cfafb0e61ee18",
     *     "objective": "56dd86d116c55cb52ee7ed26",
     *     "updatedBy": {
     *         "user": "56c4961e8f40aa0e41615d53",
     *         "date": "2016-03-22T08:10:55.298Z"
     *     },
     *     "after": {
     *         "description": "visibility one AFTER description",
     *         "files": {
     *             "_id": "56f00abe22e3d9934dce67da",
     *             "contentType": "image/jpeg",
     *             "fileName": "56f00abe22e3d9934dce67d9.jpg",
     *             "url": "http://localhost:9797/files/visibilityForm/56f00abe22e3d9934dce67d9.jpg"
     *         }
     *     },
     *     "before": {
     *         "description": "visibility one before description some",
     *         "files": {
     *             "_id": "56f0fe0fdcd9d06911544d7e",
     *             "contentType": "application/octet-stream",
     *             "fileName": "56f0fe0fdcd9d06911544d7d.",
     *             "url": "http://localhost:9797/files/visibilityForm/56f0fe0fdcd9d06911544d7d."
     *         }
     *     },
     *     "created": {
     *         "user": "56c4961e8f40aa0e41615d53",
     *         "date": "2016-03-21T11:18:40.486Z"
     *     },
     * }
     *
     * @method /form/visibility/:id
     * @instance
     */

    router.get('/visibility/:id', visibilityFormHandler.getById);

    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/visibility/:id`
     *
     * Update visibility form with specific id. Put into body 'description' property and add image / video file to upload.
     * If body has 'before' property than update 'before' property of visibility form else update 'after' property of visibility form
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/visibility/56ebe0f5b799276936f42540'
     *
     * BODY:
     * {
     *     "before": "true",
     *     "description": "some description to test "
     * }
     *
     * @example Response example:
     *
     * {
     *     "ok": 1,
     *     "nModified": 1,
     *     "n": 1
     * }
     *
     * @method /form/visibility/:id
     * @instance
     */

    router.put('/visibility/:id', visibilityFormHandler.update);


    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/form/visibility/:id`
     *
     * Update visibility form with specific id. Put into body 'description' property and add image / video file to upload.
     * If body has 'before' property than update 'before' property of visibility form else update 'after' property of visibility form
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/form/visibility/56ebe0f5b799276936f42540'
     *
     * BODY:
     * {
     *     "description": "some description to test "
     * }
     *
     * @example Response example:
     *
     * {
     *     "ok": 1,
     *     "nModified": 1,
     *     "n": 1
     * }
     *
     * @method /form/visibility/:id
     * @instance
     */

    router.patch('/visibility/:id', visibilityFormHandler.update);


    // router.delete('/visibility/:id', visibilityFormHandler.deleteById);


    return router;
};
