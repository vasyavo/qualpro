
/**
 * @module Mobile - InStoreTask
 */


var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/inStoreTasks');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ 'POST'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/instoretasks`
     *
     * Creates new in store tasks. Put in store task in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/instoretasks/'
     *
     * BODY:
     * {
     *   data :{
     *          "title": {
     *              "en": "en Some title for objective",
     *              "ar": "ar Some title for objective"
     *          },
     *          "description": {
     *            "en": "en Do some work in supermarket",
     *            "ar": "ar Do some work in supermarket"
     *          },
     *          "objectiveType":"Weekly",
     *          "priority":"Low",
     *          "formType":"visibility",
     *          "assignedTo": ["56c495e58f40aa0e41615d41"],
     *          "branch" : ["56c495e58f40aa0e41615d11"],
     *          "outlet" : ["56c495e58f40aa0e41615d00"],
     *          "retailSegment" : ["56c495e58f40aa0e41615cf9"],
     *          "subRegion" : ["56c495e58f40aa0e41615ceb"],
     *          "region" : ["56c495e48f40aa0e41615ce4"],
     *          "country" : ["56c495e48f40aa0e41615cd4"],
     *          "dateStart":"2016-03-08 22:00:00.000Z",
     *          "dateEnd":"2016-03-08 22:00:00.000Z",
     *          "location":"Kingdom of Saudi Arabia > Riyadh > Al Ghat > B-class shops > Waitrose > Choithrams Al Ghat"
     *  },
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "570210c98210b67c0a9fd73a",
     *      "title": {
     *          "ar": "ar Some title for objective",
     *          "en": "en Some title for objective"
     *      },
     *      "description": {
     *          "ar": "ar Do some work in supermarket",
     *          "en": "en Do some work in supermarket"
     *      },
     *      "objectiveType": "Weekly",
     *      "priority": "Low",
     *      "status": "inProgress",
     *      "assignedTo": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d41",
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Petrenko"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Dmytro"
     *              }
     *          }
     *      ],
     *      "complete": 0,
     *      "level": 1,
     *      "dateStart": "2016-03-08T22:00:00.000Z",
     *      "dateEnd": "2016-03-08T22:00:00.000Z",
     *      "dateClosed": null,
     *      "comments": [],
     *      "attachments": [],
     *      "editedBy": {
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-04-04T06:59:21.736Z",
     *          "user": {
     *              "_id": "56c4961e8f40aa0e41615d53",
     *              "accessRole": "56c495e58f40aa0e41615d32",
     *              "position": "56c495e58f40aa0e41615d29",
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Admin"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Super"
     *              },
     *              "imageSrc": "data:image/png;base64,iVBORw0K...U8AAAAAElFTkSuQmCC"
     *          }
     *      },
     *      "country": [
     *          {
     *              "_id": "56c495e48f40aa0e41615cd4",
     *              "name": {
     *                  "en": "Kingdom of Saudi Arabia"
     *              }
     *          }
     *      ],
     *      "region": [
     *          {
     *              "_id": "56c495e48f40aa0e41615ce4",
     *              "name": {
     *                  "en": "Riyadh"
     *              }
     *          }
     *      ],
     *      "subRegion": [
     *          {
     *              "_id": "56c495e58f40aa0e41615ceb",
     *              "name": {
     *                  "en": "Al Ghat"
     *              }
     *          }
     *      ],
     *      "retailSegment": [
     *          {
     *              "_id": "56c495e58f40aa0e41615cf9",
     *              "name": {
     *                  "en": "B-class shops",
     *                  "ar": "المحلات التجارية فئة-ب"
     *              }
     *          }
     *      ],
     *      "outlet": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d00",
     *              "name": {
     *                  "en": "Waitrose"
     *              }
     *          }
     *      ],
     *      "branch": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d11",
     *              "name": {
     *                  "ar": "",
     *                  "en": "Choithrams Al Ghat"
     *              }
     *          }
     *      ],
     *      "location": "Kingdom of Saudi Arabia > Riyadh > Al Ghat > B-class shops > Waitrose > Choithrams Al Ghat",
     *      "form": {
     *          "_id": "570210c98210b67c0a9fd73b",
     *          "contentType": "visibility"
     *      },
     *      "history": [
     *          {
     *              "assignedTo": "56c495e58f40aa0e41615d41",
     *              "index": 1
     *          }
     *      ]
     *  }
     *
     * @method /mobile/instoretasks/
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/instoretasks/:id`
     *
     * Returns existing `inStoreTask` by id
     *
     * @see {@link InStoreTaskModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/instoretasks/570210c98210b67c0a9fd73a'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "570210c98210b67c0a9fd73a",
     *      "title": {
     *          "ar": "ar Some title for in store task",
     *          "en": "en Some title for in store task"
     *      },
     *      "description": {
     *          "ar": "ar Do some work in supermarket",
     *          "en": "en Do some work in supermarket"
     *      },
     *      "objectiveType": "Weekly",
     *      "priority": "Low",
     *      "status": "draft",
     *      "assignedTo": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d3c",
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Zlindato"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Rowena"
     *              }
     *          }
     *      ],
     *      "complete": 0,
     *      "level": null,
     *      "dateStart": "2016-03-08T22:00:00.000Z",
     *      "dateEnd": "2016-03-08T22:00:00.000Z",
     *      "dateClosed": null,
     *      "comments": [],
     *      "attachments": [],
     *      "editedBy": {
     *          "user": "56c4961e8f40aa0e41615d53",
     *          "date": "2016-04-04T09:38:27.781Z"
     *      },
     *      "createdBy": {
     *          "date": "2016-04-04T06:59:21.736Z",
     *          "user": {
     *              "_id": "56c4961e8f40aa0e41615d53",
     *              "accessRole": "56c495e58f40aa0e41615d33",
     *              "position": "56c495e58f40aa0e41615d29",
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Admin"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Super"
     *              },
     *              "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAAN...AAAElFTkSuQmCC"
     *          }
     *      },
     *      "country": [
     *          {
     *              "_id": "56c495e48f40aa0e41615cd4",
     *              "name": {
     *                  "en": "Kingdom of Saudi Arabia"
     *              }
     *          }
     *      ],
     *      "region": [
     *          {
     *              "_id": "56c495e48f40aa0e41615ce4",
     *              "name": {
     *                  "en": "Riyadh"
     *              }
     *          }
     *      ],
     *      "subRegion": [
     *          {
     *              "_id": "56c495e58f40aa0e41615ceb",
     *              "name": {
     *                  "en": "Al Ghat"
     *              }
     *          }
     *      ],
     *      "retailSegment": [
     *          {
     *              "_id": "56c495e58f40aa0e41615cf9",
     *              "name": {
     *                  "en": "B-class shops",
     *                  "ar": "المحلات التجارية فئة-ب"
     *              }
     *          }
     *      ],
     *      "outlet": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d00",
     *              "name": {
     *                  "en": "Waitrose"
     *              }
     *          }
     *      ],
     *      "branch": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d11",
     *              "name": {
     *                  "ar": "",
     *                  "en": "Choithrams Al Ghat"
     *              }
     *          }
     *      ],
     *      "location": "Kingdom of Saudi Arabia > Riyadh > Al Ghat > B-class shops > Waitrose > Choithrams Al Ghat",
     *      "form": {
     *          "_id": "570210c98210b67c0a9fd73b",
     *          "contentType": "visibility"
     *      },
     *      "history": [
     *          {
     *              "assignedTo": {
     *                  "_id": "56c495e58f40aa0e41615d41",
     *                  "position": {
     *                      "en": "Project manager"
     *                  },
     *                  "lastName": {
     *                      "ar": "",
     *                      "en": "Petrenko"
     *                  },
     *                  "firstName": {
     *                      "ar": "",
     *                      "en": "Dmytro"
     *                  }
     *              },
     *              "index": 1
     *          },
     *          {
     *              "assignedTo": {
     *                  "_id": "56c495e58f40aa0e41615d4f",
     *                  "position": {
     *                      "en": "Salesman"
     *                  },
     *                  "lastName": {
     *                      "ar": "",
     *                      "en": "Toms"
     *                  },
     *                  "firstName": {
     *                      "ar": "",
     *                      "en": "Alexandr"
     *                  }
     *              },
     *              "index": 2
     *          },
     *          {
     *              "assignedTo": {
     *                  "_id": "56c495e58f40aa0e41615d3c",
     *                  "position": {
     *                      "en": "Uploader"
     *                  },
     *                  "lastName": {
     *                      "ar": "",
     *                      "en": "Zlindato"
     *                  },
     *                  "firstName": {
     *                      "ar": "",
     *                      "en": "Rowena"
     *                  }
     *              },
     *              "index": 3
     *          }
     *      ]
     *  }
     *
     * @method /mobile/instoretasks/:id
     * @instance
     */

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/instoretasks`
     *
     * Returns the all existing `inStoreTasks`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link InStoreTaskModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/instoretasks'
     *
     * @example Response example:
     *
     * {
     *  "total": 1,
     *  "data": [{
     *       "_id": "56fe7dfe20ff0f341ebd85f6",
     *       "title": {
     *           "ar": "ar Some title for objective",
     *           "en": "en Some title for objective"
     *       },
     *       "description": "[object Object]",
     *       "objectiveType": "Weekly",
     *       "priority": "Low",
     *       "status": "inProgress",
     *       "assignedTo": [
     *           {
     *               "_id": "56c495e58f40aa0e41615d41",
     *               "lastName": {
     *                   "ar": "",
     *                   "en": "Petrenko"
     *               },
     *               "firstName": {
     *                   "ar": "",
     *                   "en": "Dmytro"
     *               }
     *           }
     *       ],
     *       "complete": 0,
     *       "level": 1,
     *       "dateStart": "2016-03-08T22:00:00.000Z",
     *       "dateEnd": "2016-03-08T22:00:00.000Z",
     *       "dateClosed": null,
     *       "comments": [],
     *       "attachments": [],
     *       "editedBy": {
     *           "user": null
     *       },
     *       "createdBy": {
     *           "date": "2016-04-01T13:56:14.950Z",
     *           "user": {
     *               "_id": "56c4961e8f40aa0e41615d53",
     *               "position": {
     *                   "_id": "56c495e58f40aa0e41615d29",
     *                   "editedBy": {
     *                       "date": "2016-02-17T15:46:45.455Z",
     *                       "user": null
     *                   },
     *                   "createdBy": {
     *                       "date": "2016-02-17T15:46:45.455Z",
     *                       "user": null
     *                   },
     *                   "numberOfPersonnels": 0,
     *                   "groups": {
     *                       "group": [],
     *                       "users": [],
     *                       "owner": null
     *                   },
     *                   "whoCanRW": "owner",
     *                   "profileAccess": [],
     *                   "name": {
     *                       "en": "General manager"
     *                   },
     *                   "__v": 0
     *               },
     *               "lastName": {
     *                   "ar": "",
     *                   "en": "Admin"
     *               },
     *               "firstName": {
     *                   "ar": "",
     *                   "en": "Super"
     *               },
     *               "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAABAAAAAQADq8/hgAAAEaElEQVRYw82X6XLbNhCA+f4PVomk5MRyHDtp63oEgDcl3vfRBQhQIEVKSvsnO+OxRBEfFnthV+n/pyi/NaCryzzL8rJu/wOgzQPXJBgjhDExnXPW/Aqgy30DI0yIwYQQ4Bhe2j0I6BIbI1jL9meC2TdkRu0jgMxCGN5H2HT8IIzjKPAdE9NngEjuAhqfv3rOpe3aIrDAFoB1qtuA3ADlMXKuz9vlLqZokt4CxPAOQXa2bPDCRVSJYB0QIDA4ibp+TVKDbuCvAeh6YpX9DWkcUGJCkAARXW9UfXeL0PmUcF4CZBA4cALv5nqQM+yD4mtATQMOGMi9RzghiKriCuBiAzsB1e8uwUUGtroZIAEsqfqHCI2JjdGZHNDSZzHYb0boQK4JOTVXNQFEoJXDPskEvrYTrJHgIwOdZEBrggXzfkbo+sY7Hp0Fx9bUYbUEAAtgV/waHAcCnOew3arbLy5lVXGSXIrKGQkrKKMLcnHsPjEGAla1PYi+/YCV37e7DRp1qUDjwREK1wjbo56hezRoPLxt9lzUg+m96Hvtz3BMcU9syQAxKBSJ/c2Nqv0Em5C/97q+BdGoEuoORN98CkAqzsAAPh690vdv2tOOEcx/dodP0zq+qjpoQQF7/Vno2UA0OgLQQbUZI6t/1+BlRgAlyywvqtNXja0HFQ7jGVwoUA0HUBNcMvRdpW8PpzDPYRAERfmNE/TDuE8Ajis4oJAiUwB2+g+am3YEEmT5kz4HgOdRygHUIPEMsFf/YvXJYoSKbPczQI4HwysSbKKBdk4dLAhJsptrUHK1lSERUDYD6E9pGLsjoXzRZgAIJVaYBCCfA57zMBoJYfV9CXDigHhRgww2Hgngh4UjnCUbJAs2CEdCkl25kbou5ABh0KkXPupA6IB8fOUF4TpFOs5Eg50eFSOBfOz0GYCWoJwDoJzwcjQBfM2rMAjD0CEsL/Qp4ISG/FHkuJ4A9toXv66KomosMMNAuAA6GxOWPwqP64sb3kTm7HX1Fbsued9BXjACZKNIphLz/FF4WIps6vqff+jaIFAONiBbTf1hDITti5RLg+cYoDOxqJFwxb0dXmT5Bn/Pn8wOh9dQnMASK4aaSGuk+G24DObCbm5XzkXs9RdASTuytUZO6Czdm2BCA2cSgNbIWedxk0AV4FVYEYFJpLK4SuA3DrsceQEQl6svXy33CKfxIrwAanqZBA8R4AAQWeUMwJ6CZ7t7BIh6utfos0uLwxqP7BECMaTUuQCoawhO+9sSUWtjs1kA9I1Fm8DoNiCl64nUCsp9Ym1SgncjoLoz7YTl9dNOtbGRYSAjWbMDNPKw3py0otNeufVYN2wvzha5g6iGzlTDebsfEdbtW9EsLOvYZs06Dmbsq4GjcoeBgThBWtRN2zZ1mYUuGZ7axfz9hZEns+mMQ+ckzIYm/gn+WQvWWRq6uoxuSNi4RWWAYGfRuCtjXx25Bh25MGaTFzaccCVX1wfPtkiCk+e6nh/ExXps/N6z80PyL8wPTYgPwzDiAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDExLTAxLTE5VDAzOjU5OjAwKzAxOjAwaFry6QAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMC0xMi0yMVQxNDozMDo0NCswMTowMGxOe/8AAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC"
     *           }
     *       },
     *       "country": [
     *           {
     *               "_id": "56c495e48f40aa0e41615cd4",
     *               "name": {
     *                   "en": "Kingdom of Saudi Arabia"
     *               }
     *           }
     *       ],
     *       "region": [
     *           {
     *               "_id": "56c495e48f40aa0e41615ce4",
     *               "name": {
     *                   "en": "Riyadh"
     *               }
     *           }
     *       ],
     *       "subRegion": [
     *           {
     *               "_id": "56c495e58f40aa0e41615ceb",
     *               "name": {
     *                   "en": "Al Ghat"
     *               }
     *           }
     *       ],
     *       "retailSegment": [
     *           {
     *               "_id": "56c495e58f40aa0e41615cf9",
     *               "name": {
     *                   "en": "B-class shops",
     *                   "ar": "المحلات التجارية فئة-ب"
     *               }
     *           }
     *       ],
     *       "outlet": [
     *           {
     *               "_id": "56c495e58f40aa0e41615d00",
     *               "name": {
     *                   "en": "Waitrose"
     *               }
     *           }
     *       ],
     *       "branch": [
     *           {
     *               "_id": "56c495e58f40aa0e41615d11",
     *               "name": {
     *                   "ar": "",
     *                   "en": "Choithrams Al Ghat"
     *               }
     *           }
     *       ],
     *       "location": "Kingdom of Saudi Arabia > Riyadh > Al Ghat > B-class shops > Waitrose > Choithrams Al Ghat",
     *       "form": {
     *           "_id": "56fe7dff20ff0f341ebd85f7",
     *           "contentType": "visibility"
     *       },
     *       "history": [
     *           {
     *               "assignedTo": "56c495e58f40aa0e41615d41",
     *               "index": 1
     *           }
     *       ]
     *   }]
     * }
     *
     * @method /mobile/instoretasks
     * @instance
     */


    router.get('/sync', handler.getAllForSync);

    router.get('/', handler.getAll);
    
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);

    /**
     * __Type__ 'PUT'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/instoretasks/:id`
     *
     * Updated inStoreTask with specific id. Put updated fields in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/instoretasks/570210c98210b67c0a9fd73a'
     *
     * BODY:
     * data: {
     *    "changed": {
     *      "title": {
     *          "en": "en Some title for in store task",
     *          "ar": "ar Some title for in store task"
     *      },
     *      "assignedTo": ["56c495e58f40aa0e41615d3c"]
     *    }
     *  },
     *   "attachments" : ['56c495e48f40aa0e41615cd1']
     * },
     * files: 'encoded by form, files here'
     *
     * @example Response example:
     *  {
     *      "_id": "570210c98210b67c0a9fd73a",
     *      "title": {
     *          "ar": "ar Some title for in store task",
     *          "en": "en Some title for in store task"
     *      },
     *      "description": {
     *          "ar": "ar Do some work in supermarket",
     *          "en": "en Do some work in supermarket"
     *      },
     *      "objectiveType": "Weekly",
     *      "priority": "Low",
     *      "status": "draft",
     *      "assignedTo": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d3c",
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Zlindato"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Rowena"
     *              }
     *          }
     *      ],
     *      "complete": 0,
     *      "level": null,
     *      "dateStart": "2016-03-08T22:00:00.000Z",
     *      "dateEnd": "2016-03-08T22:00:00.000Z",
     *      "dateClosed": null,
     *      "comments": [],
     *      "attachments": [],
     *      "editedBy": {
     *          "user": "56c4961e8f40aa0e41615d53",
     *          "date": "2016-04-04T09:38:27.781Z"
     *      },
     *      "createdBy": {
     *          "date": "2016-04-04T06:59:21.736Z",
     *          "user": {
     *              "_id": "56c4961e8f40aa0e41615d53",
     *              "accessRole": "56c495e58f40aa0e41615d33",
     *              "position": "56c495e58f40aa0e41615d29",
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Admin"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Super"
     *              },
     *              "imageSrc": "data:image/png;base64,iVBORw0KGgo...WU8AAAAAElFTkSuQmCC"
     *          }
     *      },
     *      "country": [
     *          {
     *              "_id": "56c495e48f40aa0e41615cd4",
     *              "name": {
     *                  "en": "Kingdom of Saudi Arabia"
     *              }
     *          }
     *      ],
     *      "region": [
     *          {
     *              "_id": "56c495e48f40aa0e41615ce4",
     *              "name": {
     *                  "en": "Riyadh"
     *              }
     *          }
     *      ],
     *      "subRegion": [
     *          {
     *              "_id": "56c495e58f40aa0e41615ceb",
     *              "name": {
     *                  "en": "Al Ghat"
     *              }
     *          }
     *      ],
     *      "retailSegment": [
     *          {
     *              "_id": "56c495e58f40aa0e41615cf9",
     *              "name": {
     *                  "en": "B-class shops",
     *                  "ar": "المحلات التجارية فئة-ب"
     *              }
     *          }
     *      ],
     *      "outlet": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d00",
     *              "name": {
     *                  "en": "Waitrose"
     *              }
     *          }
     *      ],
     *      "branch": [
     *          {
     *              "_id": "56c495e58f40aa0e41615d11",
     *              "name": {
     *                  "ar": "",
     *                  "en": "Choithrams Al Ghat"
     *              }
     *          }
     *      ],
     *      "location": "Kingdom of Saudi Arabia > Riyadh > Al Ghat > B-class shops > Waitrose > Choithrams Al Ghat",
     *      "form": {
     *          "_id": "570210c98210b67c0a9fd73b",
     *          "contentType": "visibility"
     *      },
     *      "history": [
     *          {
     *              "assignedTo": "56c495e58f40aa0e41615d41",
     *              "index": 1
     *          },
     *          {
     *              "assignedTo": "56c495e58f40aa0e41615d4f",
     *              "index": 2
     *          },
     *          {
     *              "index": 3,
     *              "assignedTo": "56c495e58f40aa0e41615d3c"
     *          }
     *      ]
     *  }
     *
     * @method /mobile/instoretasks/:id
     * @instance
     */

    router.patch('/:id([0-9a-fA-F]{24})', multipartMiddleware, handler.update);

    /**
     * __Type__ 'POST'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/instoretasks/duplicate`
     *
     * Duplicate in store task.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/instoretasks/duplicate/'
     *
     * BODY:
     * {
     *    id: '570210c98210b67c0a9fd73a'
     * }
     *
     * @example Response example:
     *
     *  {
     *      "_id": "5702602c7b14cb8427bab3bb",
     *      "title": {
     *          "ar": "ar Some title for in store task",
     *          "en": "en Some title for in store task"
     *      },
     *      "description": {
     *          "ar": "ar Do some work in supermarket",
     *          "en": "en Do some work in supermarket"
     *      },
     *      "objectiveType": "Weekly",
     *      "priority": "Low",
     *      "status": "inProgress",
     *      "assignedTo": [],
     *      "complete": 0,
     *      "level": null,
     *      "dateStart": null,
     *      "dateEnd": null,
     *      "dateClosed": null,
     *      "comments": [],
     *      "attachments": [],
     *      "editedBy": {
     *          "user": null
     *      },
     *      "createdBy": {
     *          "date": "2016-04-04T12:38:04.142Z",
     *          "user": {
     *              "_id": "56c4961e8f40aa0e41615d53",
     *              "accessRole": "56c495e58f40aa0e41615d33",
     *              "position": "56c495e58f40aa0e41615d29",
     *              "lastName": {
     *                  "ar": "",
     *                  "en": "Admin"
     *              },
     *              "firstName": {
     *                  "ar": "",
     *                  "en": "Super"
     *              },
     *              "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAA...yWU8AAAAAElFTkSuQmCC"
     *          }
     *      },
     *      "country": [],
     *      "region": [],
     *      "subRegion": [],
     *      "retailSegment": [],
     *      "outlet": [],
     *      "branch": [],
     *      "location": null,
     *      "form": {
     *          "_id": "5702602c7b14cb8427bab3bc",
     *          "contentType": "visibility"
     *      },
     *      "history": []
     *  }
     *
     * @method /mobile/instoretasks/duplicate/
     * @instance
     */

    router.post('/duplicate', handler.duplicateInStoreTask);

    /**
     * __Type__ `DELETE`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/instoretasks/file`
     *
     * Remove file from existing `instoretask`
     *
     * @see {@link InStoreTaskModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/instoretasks/file'
     *
     *  BODY:
     *  {
     *      fileId: '56c495e58f40aa0e41615d26',
     *      inStoreTaskId: '56c495e58f40aa0e41615d26'
     *  }
     *
     * @example Response example: status
     *
     * @method /mobile/instoretasks/file
     * @instance
     */

    router.delete('/file', handler.removeFileFromInStoreTask);

    return router;
};


