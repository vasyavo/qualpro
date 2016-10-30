/**
 * @module Mobile - Contracts Secondary
 */

var express = require('express');
var router = express.Router();
var ContractHandler = require('../../handlers/contractSecondary');
var access = require('../../helpers/access');

module.exports = function (db, redis, event) {
    'use strict';

    var handler = new ContractHandler(db, redis, event);
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
    * __Type__ `GET`
    *
    * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/contractsSecondary`
    *
    * Returns the all existing `Secondary Contracts`
    *
    * __Next parameters is allowed in query to limit count of elements in response:__
    *
    * @param {string} count - count of elements in response
    * @param {string} page - number of page to show
    *
    * @example Request example:
    *     'http://192.168.88.15:9797/mobile/contractsSecondary'
    *
    * @example Response example:
    *
    * {
    *    "data": [
    *        {
    *            "_id": "57a1f3a6d339b0d4595293c2",
    *            "total": 1,
    *            "createdBy": {
    *                "date": "2016-08-03T13:37:42.215Z",
    *                "user": {
    *                    "_id": "572b78d23e8b657506a4a9a6",
    *                    "accessRole": {
    *                        "_id": "572b50412d3a970436e3b516",
    *                        "name": {
    *                            "en": "Master Admin",
    *                            "ar": "مسؤول التطبيق الرئيسي"
    *                        },
    *                        "level": 1
    *                    },
    *                    "position": {
    *                        "_id": "572b50412d3a970436e3b528",
    *                        "name": {
    *                            "en": "MANAGING DIRECTOR",
    *                            "ar": "المدير العام"
    *                        }
    *                    },
    *                    "lastName": {
    *                        "ar": "",
    *                        "en": "MasterAdmin"
    *                    },
    *                    "firstName": {
    *                        "ar": "",
    *                        "en": "Testera"
    *                    },
    *                    "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
    *                }
    *            },
    *            "editedBy": {
    *                "date": "2016-08-03T13:37:42.221Z",
    *                "user": null
    *            },
    *            "type": "monthlyDisplay",
    *            "dateStart": "2016-08-02T21:01:00.000Z",
    *            "dateEnd": "2016-08-25T20:59:00.000Z",
    *            "description": {
    *                "ar": "",
    *                "en": "<p>dsdfsdfdsf</p>"
    *            },
    *            "status": "active",
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
    *                    "_id": "572b647432f3d0985041994d",
    *                    "name": {
    *                        "ar": "",
    *                        "en": "TestRetailSegment"
    *                    }
    *                }
    *            ],
    *            "outlet": [
    *                {
    *                    "_id": "572b645621f1b5d550435e68",
    *                    "name": {
    *                        "en": "TestOutlet",
    *                        "ar": ""
    *                    }
    *                }
    *            ],
    *            "branch": [
    *                {
    *                    "_id": "572b652abc7a851650c6005a",
    *                    "name": {
    *                        "ar": "",
    *                        "en": "TestBranch"
    *                    }
    *                }
    *            ],
    *            "category": {
    *                "_id": "57690ab4024e47b508092689",
    *                "name": {
    *                    "ar": "Atest",
    *                    "en": "ATest"
    *                }
    *            },
    *            "activity": "dfgdgd",
    *            "promotion": "fgdfgd",
    *            "displayType": {
    *                "_id": 2,
    *                "name": {
    *                    "en": "Block",
    *                    "ar": "قاطع"
    *                }
    *            },
    *            "budget": 3423,
    *            "actual": 3242,
    *            "salesTarget": 3242,
    *            "documents": [
    *                {
    *                    "_id": "57a1f3a6d339b0d4595293c1",
    *                    "title": "dfdfgd",
    *                    "contentType": "application/pdf",
    *                    "createdBy": {
    *                        "date": "2016-08-03T13:37:42.179Z",
    *                        "user": {
    *                            "_id": "572b78d23e8b657506a4a9a6",
    *                            "lastName": {
    *                                "ar": "",
    *                                "en": "MasterAdmin"
    *                            },
    *                            "firstName": {
    *                                "ar": "",
    *                                "en": "Testera"
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
    * *
    * @method /mobile/contractsSecondary
    * @instance
    */

    router.get('/', handler.getAll);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/contractsSecondary/sync`
     *
     * Returns the all existing `Secondary Contracts`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/contractsSecondary/sync'
     *
     * @example Response example:
     *
     * {
    *    "data": [
    *        {
    *            "_id": "57a1f3a6d339b0d4595293c2",
    *            "total": 1,
    *            "createdBy": {
    *                "date": "2016-08-03T13:37:42.215Z",
    *                "user": {
    *                    "_id": "572b78d23e8b657506a4a9a6",
    *                    "accessRole": {
    *                        "_id": "572b50412d3a970436e3b516",
    *                        "name": {
    *                            "en": "Master Admin",
    *                            "ar": "مسؤول التطبيق الرئيسي"
    *                        },
    *                        "level": 1
    *                    },
    *                    "position": {
    *                        "_id": "572b50412d3a970436e3b528",
    *                        "name": {
    *                            "en": "MANAGING DIRECTOR",
    *                            "ar": "المدير العام"
    *                        }
    *                    },
    *                    "lastName": {
    *                        "ar": "",
    *                        "en": "MasterAdmin"
    *                    },
    *                    "firstName": {
    *                        "ar": "",
    *                        "en": "Testera"
    *                    },
    *                    "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAACHCAYAAAA850oKAAAPjUlEQVR4Xu2deXQV1R3HPy8rjwBZDS..."
    *                }
    *            },
    *            "editedBy": {
    *                "date": "2016-08-03T13:37:42.221Z",
    *                "user": null
    *            },
    *            "type": "monthlyDisplay",
    *            "dateStart": "2016-08-02T21:01:00.000Z",
    *            "dateEnd": "2016-08-25T20:59:00.000Z",
    *            "description": {
    *                "ar": "",
    *                "en": "<p>dsdfsdfdsf</p>"
    *            },
    *            "status": "active",
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
    *                    "_id": "572b647432f3d0985041994d",
    *                    "name": {
    *                        "ar": "",
    *                        "en": "TestRetailSegment"
    *                    }
    *                }
    *            ],
    *            "outlet": [
    *                {
    *                    "_id": "572b645621f1b5d550435e68",
    *                    "name": {
    *                        "en": "TestOutlet",
    *                        "ar": ""
    *                    }
    *                }
    *            ],
    *            "branch": [
    *                {
    *                    "_id": "572b652abc7a851650c6005a",
    *                    "name": {
    *                        "ar": "",
    *                        "en": "TestBranch"
    *                    }
    *                }
    *            ],
    *            "category": {
    *                "_id": "57690ab4024e47b508092689",
    *                "name": {
    *                    "ar": "Atest",
    *                    "en": "ATest"
    *                }
    *            },
    *            "activity": "dfgdgd",
    *            "promotion": "fgdfgd",
    *            "displayType": {
    *                "_id": 2,
    *                "name": {
    *                    "en": "Block",
    *                    "ar": "قاطع"
    *                }
    *            },
    *            "budget": 3423,
    *            "actual": 3242,
    *            "salesTarget": 3242,
    *            "documents": [
    *                {
    *                    "_id": "57a1f3a6d339b0d4595293c1",
    *                    "title": "dfdfgd",
    *                    "contentType": "application/pdf",
    *                    "createdBy": {
    *                        "date": "2016-08-03T13:37:42.179Z",
    *                        "user": {
    *                            "_id": "572b78d23e8b657506a4a9a6",
    *                            "lastName": {
    *                                "ar": "",
    *                                "en": "MasterAdmin"
    *                            },
    *                            "firstName": {
    *                                "ar": "",
    *                                "en": "Testera"
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
     * *
     * @method /mobile/contractsSecondary/sync
     * @instance
     */

    router.get('/sync', handler.getAllForSync);

    return router;
};