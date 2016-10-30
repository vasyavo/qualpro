/**
 * @module Mobile - Documents
 */

var express = require('express');
var router = express.Router();
var DocumentHandler = require('../../handlers/document');
var access = require('../../helpers/access');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function (db, redis, event) {
    'use strict';

    var handler = new DocumentHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);


    /**
     * __Type__ 'POST'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/documents`
     *
     * Creates new document. Put document in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/documents/'
     *
     * BODY:
     * {
     *   data :{
     *     "title": "Some document"
     *     }
     *  },
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     * {
     *     "_id": "578dfbd32892c1aa302a1c63",
     *     "title": "Some document",
     *     "attachments": [{
     *         "_id": "578dfbd32892c1aa302a1c62",
     *         "name": "578dfbd32892c1aa302a1c61.jpg",
     *         "contentType": "image/jpeg",
     *         "originalName": "1YYFIdhNC14.jpg",
     *         "createdBy": {
     *             "date": "2016-07-19T10:07:15.250Z",
     *             "user": "572b78d23e8b657506a4a9a6"
     *         },
     *         "preview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEHWQdZAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBA"
     *     }],
     *     "editedBy": {
     *         "date": "2016-07-19T10:07:15.266Z",
     *         "user": null
     *     },
     *     "createdBy": {
     *         "date": "2016-07-19T10:07:15.265Z",
     *         "user": {
     *             "_id": "572b78d23e8b657506a4a9a6",
     *             "accessRole": {
     *                 "_id": "572b50412d3a970436e3b516",
     *                 "name": {
     *                     "en": "Master Admin",
     *                     "ar": "مسؤول التطبيق الرئيسي"
     *                 },
     *                 "level": 1
     *             },
     *             "position": {
     *                 "_id": "572b50412d3a970436e3b528",
     *                 "name": {
     *                     "en": "MANAGING DIRECTOR",
     *                     "ar": "المدير العام"
     *                 }
     *             },
     *             "lastName": {
     *                 "ar": "",
     *                 "en": "MasterAdmin"
     *             },
     *             "firstName": {
     *                 "ar": "",
     *                 "en": "Testera"
     *             },
     *             "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3"
     *         }
     *     }
     * }
     *
     * @method /mobile/documents/
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);

    /**
     * __Type__ `PUT`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/documents/remove`
     *
     * Remove file from existing `objective`
     *
     * @see {@link ObjectiveModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/documents/remove'
     *
     *  BODY:
     *  {
     *      "ids": ["578dfbd32892c1aa302a1c63"],
     *      "archived": true,
     *      "type": "documents"
     *  }
     *
     *
     * @example Response example: status
     *
     * @method /mobile/documents/remove
     * @instance
     */

    router.put('/remove', handler.archive);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/documents`
     *
     * Returns the all existing `documents`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/documents'
     *
     * @example Response example:
     *
     * {
     *     "data": [{
     *         "_id": "578650742bafd4372b6edb0c",
     *         "total": 16,
     *         "createdBy": {
     *             "date": "2016-07-13T14:30:12.683Z",
     *             "user": {
     *                 "_id": "572b78d23e8b657506a4a9a6",
     *                 "accessRole": {
     *                     "_id": "572b50412d3a970436e3b516",
     *                     "name": {
     *                         "en": "Master Admin",
     *                         "ar": "مسؤول التطبيق الرئيسي"
     *                     },
     *                     "level": 1
     *                 },
     *                 "position": {
     *                     "_id": "572b50412d3a970436e3b528",
     *                     "name": {
     *                         "en": "MANAGING DIRECTOR",
     *                         "ar": "المدير العام"
     *                     }
     *                 },
     *                 "lastName": {
     *                     "ar": "",
     *                     "en": "MasterAdmin"
     *                 },
     *                 "firstName": {
     *                     "ar": "",
     *                     "en": "Testera"
     *                 },
     *                 "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
     *             }
     *         },
     *         "editedBy": {
     *             "date": "2016-07-13T14:30:12.685Z",
     *             "user": null
     *         },
     *         "title": "aqsed",
     *         "attachments": [{
     *             "_id": "578650742bafd4372b6edb0b",
     *             "name": "578650702bafd4372b6edb0a.jpg",
     *             "contentType": "image/jpeg",
     *             "originalName": "574c35f99f2373a4110bccaf.jpg",
     *             "createdBy": {
     *                 "date": "2016-07-13T14:30:12.618Z",
     *                 "user": "572b78d23e8b657506a4a9a6"
     *             },
     *             "preview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE..."
     *         }]
     *     }, {
     *         "_id": "5786392a69c1aa795e6ad999",
     *         "total": 16,
     *         "createdBy": {
     *             "date": "2016-07-13T12:50:50.668Z",
     *             "user": {
     *                 "_id": "572b78d23e8b657506a4a9a6",
     *                 "accessRole": {
     *                     "_id": "572b50412d3a970436e3b516",
     *                     "name": {
     *                         "en": "Master Admin",
     *                         "ar": "مسؤول التطبيق الرئيسي"
     *                     },
     *                     "level": 1
     *                 },
     *                 "position": {
     *                     "_id": "572b50412d3a970436e3b528",
     *                     "name": {
     *                         "en": "MANAGING DIRECTOR",
     *                         "ar": "المدير العام"
     *                     }
     *                 },
     *                 "lastName": {
     *                     "ar": "",
     *                     "en": "MasterAdmin"
     *                 },
     *                 "firstName": {
     *                     "ar": "",
     *                     "en": "Testera"
     *                 },
     *                 "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
     *             }
     *         },
     *         "editedBy": {
     *             "user": "572b78d23e8b657506a4a9a6",
     *             "date": "2016-07-13T14:32:57.273Z"
     *         },
     *         "title": "test123",
     *         "attachments": [{
     *             "_id": "5786392a69c1aa795e6ad998",
     *             "name": "5786390269c1aa795e6ad997.mp4",
     *             "contentType": "video/mp4",
     *             "originalName": "5786390269c1aa795e6ad997.mp4",
     *             "createdBy": {
     *                 "date": "2016-07-13T12:50:50.550Z",
     *                 "user": "572b78d23e8b657506a4a9a6"
     *             },
     *             "preview": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAABUCAIAAADvQ1kKAAAACXBIWXMAAADgAAAA4QDMQ/8dAAAQAElEQV..."
     *         }]
     *     }],
     *     "total": 16
     * }
     *
     * @method /mobile/documents
     * @instance
     */

    router.get('/', handler.getAll);

    router.get('/sync', handler.getAllForSync);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/documents/sync`
     *
     * Returns the all existing `documents`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {date} lastLogOut - last logout date
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/documents/sync'
     *
     * @example Response example:
     *
     *     [{
     *         "_id": "578650742bafd4372b6edb0c",
     *         "total": 16,
     *         "createdBy": {
     *             "date": "2016-07-13T14:30:12.683Z",
     *             "user": {
     *                 "_id": "572b78d23e8b657506a4a9a6",
     *                 "accessRole": {
     *                     "_id": "572b50412d3a970436e3b516",
     *                     "name": {
     *                         "en": "Master Admin",
     *                         "ar": "مسؤول التطبيق الرئيسي"
     *                     },
     *                     "level": 1
     *                 },
     *                 "position": {
     *                     "_id": "572b50412d3a970436e3b528",
     *                     "name": {
     *                         "en": "MANAGING DIRECTOR",
     *                         "ar": "المدير العام"
     *                     }
     *                 },
     *                 "lastName": {
     *                     "ar": "",
     *                     "en": "MasterAdmin"
     *                 },
     *                 "firstName": {
     *                     "ar": "",
     *                     "en": "Testera"
     *                 },
     *                 "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
     *             }
     *         },
     *         "editedBy": {
     *             "date": "2016-07-13T14:30:12.685Z",
     *             "user": null
     *         },
     *         "title": "aqsed",
     *         "attachments": [{
     *             "_id": "578650742bafd4372b6edb0b",
     *             "name": "578650702bafd4372b6edb0a.jpg",
     *             "contentType": "image/jpeg",
     *             "originalName": "574c35f99f2373a4110bccaf.jpg",
     *             "createdBy": {
     *                 "date": "2016-07-13T14:30:12.618Z",
     *                 "user": "572b78d23e8b657506a4a9a6"
     *             },
     *             "preview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE..."
     *         }]
     *     }, {
     *         "_id": "5786392a69c1aa795e6ad999",
     *         "total": 16,
     *         "createdBy": {
     *             "date": "2016-07-13T12:50:50.668Z",
     *             "user": {
     *                 "_id": "572b78d23e8b657506a4a9a6",
     *                 "accessRole": {
     *                     "_id": "572b50412d3a970436e3b516",
     *                     "name": {
     *                         "en": "Master Admin",
     *                         "ar": "مسؤول التطبيق الرئيسي"
     *                     },
     *                     "level": 1
     *                 },
     *                 "position": {
     *                     "_id": "572b50412d3a970436e3b528",
     *                     "name": {
     *                         "en": "MANAGING DIRECTOR",
     *                         "ar": "المدير العام"
     *                     }
     *                 },
     *                 "lastName": {
     *                     "ar": "",
     *                     "en": "MasterAdmin"
     *                 },
     *                 "firstName": {
     *                     "ar": "",
     *                     "en": "Testera"
     *                 },
     *                 "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
     *             }
     *         },
     *         "editedBy": {
     *             "user": "572b78d23e8b657506a4a9a6",
     *             "date": "2016-07-13T14:32:57.273Z"
     *         },
     *         "title": "test123",
     *         "attachments": [{
     *             "_id": "5786392a69c1aa795e6ad998",
     *             "name": "5786390269c1aa795e6ad997.mp4",
     *             "contentType": "video/mp4",
     *             "originalName": "5786390269c1aa795e6ad997.mp4",
     *             "createdBy": {
     *                 "date": "2016-07-13T12:50:50.550Z",
     *                 "user": "572b78d23e8b657506a4a9a6"
     *             },
     *             "preview": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAABUCAIAAADvQ1kKAAAACXBIWXMAAADgAAAA4QDMQ/8dAAAQAElEQV..."
     *         }]
     *     }]
     *
     * @method /mobile/documents/sync
     * @instance
     */

    router.get('/:id', handler.getById);


    /**
     * __Type__ 'PUT'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/documents/:id`
     *
     * Updated objective with specific id.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/documents/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     *   {
     *       "title": "Edited document"
     *   }
     *
     *
     * @example Response example:
     *
     * {
     *     "_id": "578dfbd32892c1aa302a1c63",
     *     "title": "Edited document",
     *     "attachments": [{
     *         "_id": "578dfbd32892c1aa302a1c62",
     *         "name": "578dfbd32892c1aa302a1c61.jpg",
     *         "contentType": "image/jpeg",
     *         "originalName": "1YYFIdhNC14.jpg",
     *         "createdBy": {
     *             "date": "2016-07-19T10:07:15.250Z",
     *             "user": "572b78d23e8b657506a4a9a6"
     *         },
     *         "preview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEHWQdZAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB"
     *     }],
     *     "editedBy": {
     *         "user": "572b78d23e8b657506a4a9a6",
     *         "date": "2016-07-19T10:12:48.220Z"
     *     },
     *     "createdBy": {
     *         "date": "2016-07-19T10:07:15.265Z",
     *         "user": {
     *             "_id": "572b78d23e8b657506a4a9a6",
     *             "accessRole": {
     *                 "_id": "572b50412d3a970436e3b516",
     *                 "name": {
     *                     "en": "Master Admin",
     *                     "ar": "مسؤول التطبيق الرئيسي"
     *                 },
     *                 "level": 1
     *             },
     *             "position": {
     *                 "_id": "572b50412d3a970436e3b528",
     *                 "name": {
     *                     "en": "MANAGING DIRECTOR",
     *                     "ar": "المدير العام"
     *                 }
     *             },
     *             "lastName": {
     *                 "ar": "",
     *                 "en": "MasterAdmin"
     *             },
     *             "firstName": {
     *                 "ar": "",
     *                 "en": "Testera"
     *             },
     *             "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1"
     *         }
     *     }
     * }
     *
     * @method /mobile/documents/:id
     * @instance
     */

    router.put('/:id', multipartMiddleware, handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/documents/:id`
     *
     * Updated objective with specific id.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/documents/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     *   {
     *       "title": "Edited document"
     *   }
     *
     *
     * @example Response example:
     *
     * {
     *     "_id": "578dfbd32892c1aa302a1c63",
     *     "title": "Edited document",
     *     "attachments": [{
     *         "_id": "578dfbd32892c1aa302a1c62",
     *         "name": "578dfbd32892c1aa302a1c61.jpg",
     *         "contentType": "image/jpeg",
     *         "originalName": "1YYFIdhNC14.jpg",
     *         "createdBy": {
     *             "date": "2016-07-19T10:07:15.250Z",
     *             "user": "572b78d23e8b657506a4a9a6"
     *         },
     *         "preview": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEHWQdZAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB"
     *     }],
     *     "editedBy": {
     *         "user": "572b78d23e8b657506a4a9a6",
     *         "date": "2016-07-19T10:12:48.220Z"
     *     },
     *     "createdBy": {
     *         "date": "2016-07-19T10:07:15.265Z",
     *         "user": {
     *             "_id": "572b78d23e8b657506a4a9a6",
     *             "accessRole": {
     *                 "_id": "572b50412d3a970436e3b516",
     *                 "name": {
     *                     "en": "Master Admin",
     *                     "ar": "مسؤول التطبيق الرئيسي"
     *                 },
     *                 "level": 1
     *             },
     *             "position": {
     *                 "_id": "572b50412d3a970436e3b528",
     *                 "name": {
     *                     "en": "MANAGING DIRECTOR",
     *                     "ar": "المدير العام"
     *                 }
     *             },
     *             "lastName": {
     *                 "ar": "",
     *                 "en": "MasterAdmin"
     *             },
     *             "firstName": {
     *                 "ar": "",
     *                 "en": "Testera"
     *             },
     *             "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1"
     *         }
     *     }
     * }
     *
     * @method /mobile/documents/:id
     * @instance
     */

    router.patch('/:id', multipartMiddleware, handler.update);

    return router;
};