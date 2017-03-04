/**
 * @module Mobile - Contracts Yearly&Visibility
 */

var express = require('express');
var router = express.Router();
var ContractHandler = require('../../handlers/contractYearly');
var access = require('../../helpers/access');

module.exports = function () {
    'use strict';

    var handler = new ContractHandler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/contractsYearly`
     *
     * Returns the all existing `Yearly&Visibility Contracts`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/contractsYearly'
     *
     * @example Response example:
     *
     * {
     *    "data": [
     *        {
     *            "_id": "57a0855cdcc550a760ca9bb5",
     *            "total": 1,
     *            "createdBy": {
     *                "date": "2016-08-02T11:34:52.965Z",
     *                "user": {
     *                    "_id": "572c308b0ea95de030962619",
     *                    "accessRole": {
     *                        "_id": "572b50412d3a970436e3b515",
     *                        "name": {
     *                            "en": "Country Admin",
     *                            "ar": "مسؤول التطبيق"
     *                        },
     *                        "level": 2
     *                    },
     *                    "position": {
     *                        "_id": "572b50412d3a970436e3b525",
     *                        "name": {
     *                            "en": "COUNTRY MANAGER",
     *                            "ar": "مدير سوق"
     *                        }
     *                    },
     *                    "lastName": {
     *                        "ar": "",
     *                        "en": "Country Admin"
     *                    },
     *                    "firstName": {
     *                        "ar": "",
     *                        "en": "Tester"
     *                    },
     *                    "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
     *                }
     *            },
     *            "editedBy": {
     *                "date": "2016-08-02T11:34:52.967Z",
     *                "user": null
     *            },
     *            "type": "yearly",
     *            "dateStart": "2016-08-09T21:01:00.000Z",
     *            "dateEnd": "2016-08-25T20:59:00.000Z",
     *            "description": {
     *                "ar": "",
     *                "en": "<p>test contract</p>"
     *            },
     *            "status": "draft",
     *            "country": {
     *                "_id": "572b60d432f3d0985041994c",
     *                "name": {
     *                    "ar": "7",
     *                    "en": "TestCountryTest"
     *                }
     *            },
     *            "region": [
     *                {
     *                    "_id": "572b64054e98a154501aa81c",
     *                    "name": {
     *                        "ar": "RegionAR",
     *                        "en": "RegionTest"
     *                    }
     *                }
     *            ],
     *            "subRegion": [
     *                {
     *                    "_id": "572b64214e98a154501aa81d",
     *                    "name": {
     *                        "ar": "ARSubRegion",
     *                        "en": "TestSubRegion"
     *                    }
     *                }
     *            ],
     *            "retailSegment": [
     *                {
     *                    "_id": "572b50372d3a970436e3ad4a",
     *                    "name": {
     *                        "ar": "المحلات التجارية الصغيرة",
     *                        "en": "C - CLASS"
     *                    }
     *                }
     *            ],
     *            "outlet": [
     *                {
     *                    "_id": "572b50372d3a970436e3af9b",
     *                    "name": {
     *                        "en": "24x7 S/M (AL JAZIRA P/STATION SALWA ROAD)",
     *                        "ar": "24/ 7 الجزيرة"
     *                    }
     *                }
     *            ],
     *            "branch": [
     *                {
     *                    "_id": "577e02ac038b0a51099a1885",
     *                    "name": {
     *                        "ar": "",
     *                        "en": "test test test test test test"
     *                    }
     *                },
     *                {
     *                    "_id": "57455fd551ea65ab13053633",
     *                    "name": {
     *                        "en": "Branchnew",
     *                        "ar": ""
     *                    }
     *                },
     *                {
     *                    "_id": "577a77276404fb5e1a160033",
     *                    "name": {
     *                        "ar": "",
     *                        "en": "very very very very very long title"
     *                    }
     *                }
     *            ],
     *            "documents": [
     *                {
     *                    "_id": "57a0855cdcc550a760ca9bb4",
     *                    "title": "test dock",
     *                    "contentType": "application/pdf",
     *                    "createdBy": {
     *                        "date": "2016-08-02T11:34:52.962Z",
     *                        "user": {
     *                            "_id": "572c308b0ea95de030962619",
     *                            "lastName": {
     *                                "ar": "",
     *                                "en": "Country Admin"
     *                            },
     *                            "firstName": {
     *                                "ar": "",
     *                                "en": "Tester"
     *                            },
     *                            "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
     *                        }
     *                    }
     *                }
     *            ]
     *        }
     *    ],
     *    "total": 1
     * }
     *
     * @method /mobile/contractsYearly
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/contractsYearly/sync`
     *
     * Returns the all existing `Yearly&Visibility Contracts`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {date} lastLogOut - last logout date
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/contractsYearly/sync'
     *
     * @example Response example:
     *
     * {
     *    "data": [
     *        {
     *            "_id": "57a0855cdcc550a760ca9bb5",
     *            "total": 1,
     *            "createdBy": {
     *                "date": "2016-08-02T11:34:52.965Z",
     *                "user": {
     *                    "_id": "572c308b0ea95de030962619",
     *                    "accessRole": {
     *                        "_id": "572b50412d3a970436e3b515",
     *                        "name": {
     *                            "en": "Country Admin",
     *                            "ar": "مسؤول التطبيق"
     *                        },
     *                        "level": 2
     *                    },
     *                    "position": {
     *                        "_id": "572b50412d3a970436e3b525",
     *                        "name": {
     *                            "en": "COUNTRY MANAGER",
     *                            "ar": "مدير سوق"
     *                        }
     *                    },
     *                    "lastName": {
     *                        "ar": "",
     *                        "en": "Country Admin"
     *                    },
     *                    "firstName": {
     *                        "ar": "",
     *                        "en": "Tester"
     *                    },
     *                    "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
     *                }
     *            },
     *            "editedBy": {
     *                "date": "2016-08-02T11:34:52.967Z",
     *                "user": null
     *            },
     *            "type": "yearly",
     *            "dateStart": "2016-08-09T21:01:00.000Z",
     *            "dateEnd": "2016-08-25T20:59:00.000Z",
     *            "description": {
     *                "ar": "",
     *                "en": "<p>test contract</p>"
     *            },
     *            "status": "draft",
     *            "country": {
     *                "_id": "572b60d432f3d0985041994c",
     *                "name": {
     *                    "ar": "7",
     *                    "en": "TestCountryTest"
     *                }
     *            },
     *            "region": [
     *                {
     *                    "_id": "572b64054e98a154501aa81c",
     *                    "name": {
     *                        "ar": "RegionAR",
     *                        "en": "RegionTest"
     *                    }
     *                }
     *            ],
     *            "subRegion": [
     *                {
     *                    "_id": "572b64214e98a154501aa81d",
     *                    "name": {
     *                        "ar": "ARSubRegion",
     *                        "en": "TestSubRegion"
     *                    }
     *                }
     *            ],
     *            "retailSegment": [
     *                {
     *                    "_id": "572b50372d3a970436e3ad4a",
     *                    "name": {
     *                        "ar": "المحلات التجارية الصغيرة",
     *                        "en": "C - CLASS"
     *                    }
     *                }
     *            ],
     *            "outlet": [
     *                {
     *                    "_id": "572b50372d3a970436e3af9b",
     *                    "name": {
     *                        "en": "24x7 S/M (AL JAZIRA P/STATION SALWA ROAD)",
     *                        "ar": "24/ 7 الجزيرة"
     *                    }
     *                }
     *            ],
     *            "branch": [
     *                {
     *                    "_id": "577e02ac038b0a51099a1885",
     *                    "name": {
     *                        "ar": "",
     *                        "en": "test test test test test test"
     *                    }
     *                },
     *                {
     *                    "_id": "57455fd551ea65ab13053633",
     *                    "name": {
     *                        "en": "Branchnew",
     *                        "ar": ""
     *                    }
     *                },
     *                {
     *                    "_id": "577a77276404fb5e1a160033",
     *                    "name": {
     *                        "ar": "",
     *                        "en": "very very very very very long title"
     *                    }
     *                }
     *            ],
     *            "documents": [
     *                {
     *                    "_id": "57a0855cdcc550a760ca9bb4",
     *                    "title": "test dock",
     *                    "contentType": "application/pdf",
     *                    "createdBy": {
     *                        "date": "2016-08-02T11:34:52.962Z",
     *                        "user": {
     *                            "_id": "572c308b0ea95de030962619",
     *                            "lastName": {
     *                                "ar": "",
     *                                "en": "Country Admin"
     *                            },
     *                            "firstName": {
     *                                "ar": "",
     *                                "en": "Tester"
     *                            },
     *                            "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
     *                        }
     *                    }
     *                }
     *            ]
     *        }
     *    ],
     *    "total": 1
     * }
     *
     * @method /mobile/contractsYearly/sync
     * @instance
     */

    router.get('/sync', handler.getAllForSync);

    return router;
};