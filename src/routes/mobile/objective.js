'use strict';

/**
 * @module Mobile - Objective
 */


var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/objectives');
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
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/objectives/subObjective`
     *
     * Creates subObjective. Put subObjective in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/objectives/subObjective/'
     *
     * BODY:
     * {
     *   data :{
     *       formType: 'visibility' or 'distribution',
     *       parentId: '56c495e58f40aa0e41615d37',
     *       assignedToIds: ['56c495e58f40aa0e41615d37'],
     *       saveObjective: true,
     *       companyObjective: 'Some company objective',
     *       description: {
     *          en: 'enDescription',
     *          ar: 'arDescription'
     *       },
     *       title: {
     *          en: 'enTitle',
     *          ar: 'arTitle'
     *       },
     *       dateStart: '2016-03-08T22:00:00.000Z',
     *       dateEnd: '2016-03-08T22:00:00.000Z',
     *       priority: 'medium',
     *       attachments: ['56c495e58f40aa0e41615d37'],
     *       objectiveType: 'weekly',
     *       location: 'Kingdom of Saudi Arabia > Riyadh > Al Ghat > B-class shops > Waitrose > Choithrams Al Ghat',
     *       country: ['56c495e58f40aa0e41615d37'],
     *       region: ['56c495e58f40aa0e41615d37'],
     *       subRegion: ['56c495e58f40aa0e41615d37'],
     *       retailSegment: ['56c495e58f40aa0e41615d37'],
     *       outlet: ['56c495e58f40aa0e41615d37'],
     *       branch: ['56c495e58f40aa0e41615d37'],
     *   }
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     *  {
     *      "_id":"56fa4d2e8dcf0a2801704fbf",
     *      "objectiveType":"Weekly",
     *      "level": 3,
     *      "dateStart":"2016-03-09T22:00:00.000Z",
     *      "dateEnd":"2016-03-16T22:00:00.000Z",
     *      "location":"Kingdom of Saudi Arabia > Riyadh > Al Ghat > B-class shops > Waitrose > Choithrams Al Ghat",
     *      "branch":[
     *          "56c495e58f40aa0e41615d11"
     *      ],
     *      "outlet":["56c495e58f40aa0e41615d00"],
     *      "retailSegment":["56c495e58f40aa0e41615cf9"],
     *      "subRegion":["56c495e58f40aa0e41615ceb"],
     *      "region":["56c495e48f40aa0e41615ce4"],
     *      "country":["56c495e48f40aa0e41615cd4"],
     *      "createdBy":{
     *          "date":"2016-03-29T09:38:54.062Z",
     *          "user":"56c4961e8f40aa0e41615d53"
     *      },
     *      "editedBy":{
     *          "user":null
     *      },
     *      "form":{
     *          "_id":null
     *      },
     *      "attachments":["56fa4d2e8dcf0a2801704fbe"],
     *      "comments":[],
     *      "completedSubTasks":0,
     *      "countSubTasks":0,
     *      "parent":{
     *          "1":"56f2518384dfcbc414d33e2d",
     *          "2":"56f25e3a20b9342c275c35cd",
     *          "3":null,
     *          "4":null
     *      },
     *      "complete":0,
     *      "assignedTo":["56c495e58f40aa0e41615d46"],
     *      "status":"draft",
     *      "priority":"Medium",
     *      "description":{
     *          "ar":"",
     *          "en":"Some description"
     *      },
     *      "companyObjective":{
     *          "ar":null,
     *          "en":null
     *      },
     *      "title":{
     *          "ar":"5795",
     *          "en":"1235554545"
     *      }
     *  }
     *
     * @method /mobile/objectives/subObjective/
     * @instance
     */
    
    router.post('/subObjective', multipartMiddleware, handler.createSubObjective);

    /**
     * __Type__ 'POST'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/objectives`
     *
     * Creates new objective. Put objective in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/objectives/'
     *
     * BODY:
     * {
     *   data :{
     *               title: {
     *                  en: 'enTitle',
     *                  ar: 'arTitle'
     *               },
     *               description: {
     *                  en: 'enDescription',
     *                  ar: 'arDescription'
     *               },
     *               objectiveType: 'weekly',
     *               priority: 'medium',
     *               assignedTo: ['56c495e58f40aa0e41615d37'],
     *               dateStart: '2016-03-08T22:00:00.000Z',
     *               dateEnd: '2016-03-08T22:00:00.000Z',
     *               country: ['56c495e58f40aa0e41615d37'],
     *               region: ['56c495e58f40aa0e41615d37'],
     *               subRegion: ['56c495e58f40aa0e41615d37'],
     *               retailSegment: ['56c495e58f40aa0e41615d37'],
     *               outlet: ['56c495e58f40aa0e41615d37'],
     *               branch: ['56c495e58f40aa0e41615d37'],
     *               location: 'Kingdom of Saudi Arabia > Riyadh > Al Ghat > B-class shops > Waitrose > Choithrams Al Ghat',
     *               formType: "visibility" or "distribution",
     *           }
     *  },
     *  files: 'encoded by form, files here'
     *
     * @example Response example:
     *
     *  {
     *       "_id": "56f25e3a20b9342c275c35cd",
     *       "title": {
     *           "ar": "5795",
     *           "en": "12355545"
     *       },
     *       "companyObjective": {
     *           "ar": null,
     *           "en": null
     *       },
     *       "description": {
     *           "ar": "",
     *           "en": "&lt;p&gt;nhfgddbf gfsgd&amp;nbsp;&lt;/p&gt;\n"
     *       },
     *       "objectiveType": "Weekly",
     *       "priority": "Medium",
     *       "status": "draft",
     *       "assignedTo": [
     *           {
     *               "_id": "56c495e58f40aa0e41615d46",
     *               "lastName": {
     *                   "ar": "طائر شجاع",
     *                   "en": "Andersen"
     *               },
     *               "firstName": {
     *                   "ar": "طائر شجاع",
     *                   "en": "Hans"
     *               }
     *           }
     *       ],
     *       "complete": 40,
     *       "parent": {
     *           "1": "56f2518384dfcbc414d33e2d",
     *           "2": null,
     *           "3": null,
     *           "4": null
     *       },
     *       "level": 2,
     *       "countSubTasks": 0,
     *       "completedSubTasks": 0,
     *       "dateStart": "2016-03-08T22:00:00.000Z",
     *       "dateEnd": "2016-03-22T22:00:00.000Z",
     *       "dateClosed": null,
     *       "comments": [],
     *       "attachments": [],
     *       "editedBy": {
     *           "date": "2016-03-25T07:30:39.338Z",
     *           "user": "56c4961e8f40aa0e41615d53"
     *       },
     *       "createdBy": {
     *           "date": "2016-03-23T09:13:30.310Z",
     *           "user": {
     *               "_id": "56c4961e8f40aa0e41615d53",
     *               "accessRole": "56c495e58f40aa0e41615d32",
     *               "position": null,
     *               "lastName": {
     *                   "ar": "",
     *                   "en": "Admin"
     *               },
     *               "firstName": {
     *                   "ar": "",
     *                   "en": "Super"
     *               },
     *               "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUh...ElFTkSuQmCC"
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
     *           "_id": "56f25e3a20b9342c275c35ce",
     *           "contentType": "visibility"
     *       },
     *       "position": [
     *           "56c495e58f40aa0e41615d26"
     *       ]
     *   }
     *
     * @method /mobile/objectives/
     * @instance
     */

    router.post('/', multipartMiddleware, handler.create);

    /**
     * __Type__ 'PUT'
     * Content-Type: 'multipart/form-data'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/objectives/:id`
     *
     * Updated objective with specific id. Put updated fields in body.data encoded as string.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/objectives/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     * data: {
     *   "changed" : {
     *      "formType": "visibility" or "distribution",
     *      "title":{
     *          "en":"Some english title"
     *      },
     *      "description":{
     *          "en":"Some english description",
     *          "ar":"Some arabic description"
     *      }
     *      ...
     *   },
     *   "attachments" : ['56c495e48f40aa0e41615cd1']
     * },
     * files: 'encoded by form, files here'
     *
     * @example Response example: 
     *   {
     *       "_id": "56f25e3a20b9342c275c35cd",
     *       "title": {
     *           "ar": "5795",
     *           "en": "12355545"
     *       },
     *       "companyObjective": {
     *           "ar": null,
     *           "en": null
     *       },
     *       "description": {
     *           "ar": "",
     *           "en": "&lt;p&gt;nhfgddbf gfsgd&amp;nbsp;&lt;/p&gt;\n"
     *       },
     *       "objectiveType": "Weekly",
     *       "priority": "Medium",
     *       "status": "draft",
     *       "assignedTo": [
     *           {
     *               "_id": "56c495e58f40aa0e41615d46",
     *               "lastName": {
     *                   "ar": "طائر شجاع",
     *                   "en": "Andersen"
     *               },
     *               "firstName": {
     *                   "ar": "طائر شجاع",
     *                   "en": "Hans"
     *               }
     *           }
     *       ],
     *       "complete": 40,
     *       "parent": {
     *           "1": "56f2518384dfcbc414d33e2d",
     *           "2": null,
     *           "3": null,
     *           "4": null
     *       },
     *       "level": 2,
     *       "countSubTasks": 0,
     *       "completedSubTasks": 0,
     *       "dateStart": "2016-03-08T22:00:00.000Z",
     *       "dateEnd": "2016-03-22T22:00:00.000Z",
     *       "dateClosed": null,
     *       "comments": [],
     *       "attachments": [],
     *       "editedBy": {
     *           "date": "2016-03-25T07:30:39.338Z",
     *           "user": "56c4961e8f40aa0e41615d53"
     *       },
     *       "createdBy": {
     *           "date": "2016-03-23T09:13:30.310Z",
     *           "user": {
     *               "_id": "56c4961e8f40aa0e41615d53",
     *               "accessRole": "56c495e58f40aa0e41615d32",
     *               "position": null,
     *               "lastName": {
     *                   "ar": "",
     *                   "en": "Admin"
     *               },
     *               "firstName": {
     *                   "ar": "",
     *                   "en": "Super"
     *               },
     *               "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...8AAAAAElFTkSuQmCC"
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
     *           "_id": "56f25e3a20b9342c275c35ce",
     *           "contentType": "visibility"
     *       }
     *   }
     *
     * @method /mobile/objectives/:id
     * @instance
     */

    router.put('/:id', multipartMiddleware, handler.update);

    /**
     * __Type__ 'PATCH'
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/objectives/:id`
     *
     * Updated objective with specific id.
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/objectives/55eeb7b58f9c1deb19000005'
     *
     * BODY:
     * {
     *   "changed" : {
     *      "formType": "visibility" or "distribution",
     *      "title":{
     *          "en":"Some english title"
     *      },
     *      "description":{
     *          "en":"Some english description",
     *          "ar":"Some arabic description"
     *      }
     *      ...
     *   },
     *   "attachments" : ['56c495e48f40aa0e41615cd1']
     * }
     *
     * @example Response example: 
     * 
     *   {
     *       "_id": "56f25e3a20b9342c275c35cd",
     *       "title": {
     *           "ar": "5795",
     *           "en": "12355545"
     *       },
     *       "companyObjective": {
     *           "ar": null,
     *           "en": null
     *       },
     *       "description": {
     *           "ar": "",
     *           "en": "&lt;p&gt;nhfgddbf gfsgd&amp;nbsp;&lt;/p&gt;\n"
     *       },
     *       "objectiveType": "Weekly",
     *       "priority": "Medium",
     *       "status": "draft",
     *       "assignedTo": [
     *           {
     *               "_id": "56c495e58f40aa0e41615d46",
     *               "lastName": {
     *                   "ar": "طائر شجاع",
     *                   "en": "Andersen"
     *               },
     *               "firstName": {
     *                   "ar": "طائر شجاع",
     *                   "en": "Hans"
     *               }
     *           }
     *       ],
     *       "complete": 40,
     *       "parent": {
     *           "1": "56f2518384dfcbc414d33e2d",
     *           "2": null,
     *           "3": null,
     *           "4": null
     *       },
     *       "level": 2,
     *       "countSubTasks": 0,
     *       "completedSubTasks": 0,
     *       "dateStart": "2016-03-08T22:00:00.000Z",
     *       "dateEnd": "2016-03-22T22:00:00.000Z",
     *       "dateClosed": null,
     *       "comments": [],
     *       "attachments": [],
     *       "editedBy": {
     *           "date": "2016-03-25T07:30:39.338Z",
     *           "user": "56c4961e8f40aa0e41615d53"
     *       },
     *       "createdBy": {
     *           "date": "2016-03-23T09:13:30.310Z",
     *           "user": {
     *               "_id": "56c4961e8f40aa0e41615d53",
     *               "accessRole": "56c495e58f40aa0e41615d32",
     *               "position": null,
     *               "lastName": {
     *                   "ar": "",
     *                   "en": "Admin"
     *               },
     *               "firstName": {
     *                   "ar": "",
     *                   "en": "Super"
     *               },
     *               "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE...AAAAAElFTkSuQmCC"
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
     *           "_id": "56f25e3a20b9342c275c35ce",
     *           "contentType": "visibility"
     *       }
     *   }
     *
     * @method /mobile/objectives/:id
     * @instance
     */

    router.patch('/:id', multipartMiddleware, handler.update);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/objectives/sync`
     *
     * Returns the all updated and created `objectives` from some date
     *
     * @param {date} lastLogOut - last logout date
     *
     * @see {@link ObjectiveModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/objectives/sync'
     *
     * @example Response example:
     *
     * {
     *     "country":[
     *        {
     *           "_id":"56c495e48f40aa0e41615cd4",
     *           "name":{
     *              "en":"Kingdom of Saudi Arabia"
     *           }
     *        },
     *        {
     *           "_id":"56c495e48f40aa0e41615cd9",
     *           "name":{
     *              "en":"United Arab Emirates",
     *              "ar":"الإمارات العربية المتحدة"
     *           }
     *        }
     *     ],
     *     "region":[
     *        {
     *           "_id":"56c495e48f40aa0e41615ce4",
     *           "name":{
     *              "en":"Riyadh"
     *           }
     *        },
     *        {
     *           "_id":"56c495e48f40aa0e41615cdb",
     *           "name":{
     *              "en":"Dubai"
     *           }
     *        }
     *     ],
     *     "subRegion":[
     *        {
     *           "_id":"56c495e58f40aa0e41615ceb",
     *           "name":{
     *              "en":"Al Ghat"
     *           }
     *        },
     *        {
     *           "_id":"56c495e48f40aa0e41615cdb",
     *           "name":{
     *              "en":"Dubai"
     *           }
     *        }
     *     ],
     *     "retailSegment":[
     *        {
     *           "_id":"56c495e58f40aa0e41615cf9",
     *           "name":{
     *              "en":"B-class shops",
     *              "ar":"المحلات التجارية فئة-ب"
     *           }
     *        },
     *        {
     *           "_id":"56c495e58f40aa0e41615cfa",
     *           "name":{
     *              "en":"A-class shops",
     *              "ar":"المحلات التجارية فئة-أ"
     *           }
     *        }
     *     ],
     *     "outlet":[
     *        {
     *           "_id":"56c495e58f40aa0e41615d00",
     *           "name":{
     *              "en":"Waitrose"
     *           }
     *        },
     *        {
     *           "_id":"56c495e58f40aa0e41615d03",
     *           "name":{
     *              "en":"Spinneys",
     *              "ar":"سبينيس"
     *           }
     *        }
     *     ],
     *     "branch":[
     *        {
     *           "_id":"56c495e58f40aa0e41615d11",
     *           "name":{
     *              "ar":"",
     *              "en":"Choithrams Al Ghat"
     *           }
     *        },
     *        {
     *           "_id":"56c495e58f40aa0e41615d1b",
     *           "name":{
     *              "en":"Spinneys Al Karama"
     *           }
     *        }
     *     ],
     *     "position":[
     *        {
     *           "_id":"56c495e58f40aa0e41615d26",
     *           "name":{
     *              "en":"Merchandiser"
     *           }
     *        },
     *        {
     *           "_id":"56c495e58f40aa0e41615d28",
     *           "name":{
     *              "en":"Sales manager"
     *           }
     *        },
     *        {
     *           "_id":"56c495e58f40aa0e41615d27",
     *           "name":{
     *              "en":"Salesman"
     *           }
     *        },
     *        {
     *           "_id":"56c495e58f40aa0e41615d23",
     *           "name":{
     *              "en":"Marketing manager"
     *           }
     *        }
     *     ],
     *     "priority":[
     *        {
     *           "_id":"medium",
     *           "name":{
     *              "en":"medium"
     *           }
     *        }
     *     ],
     *     "objectiveType":[
     *        {
     *           "_id":"weekly",
     *           "name":{
     *              "en":"weekly"
     *           }
     *        },
     *        {
     *           "_id":"quarterly",
     *           "name":{
     *              "en":"quarterly"
     *           }
     *        },
     *        {
     *           "_id":"monthly",
     *           "name":{
     *              "en":"monthly"
     *           }
     *        }
     *     ],
     *     "status":[
     *        {
     *           "_id":"draft",
     *           "name":{
     *              "en":"draft"
     *           }
     *        }
     *     ]
     *  }
     *
     * @method /mobile/objectives/sync
     * @instance
     */

    router.get('/sync', handler.getAllForSync);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/objectives`
     *
     * Returns the all existing `objectives`
     *
     * __Next parameters is allowed in query to limit count of elements in response:__
     *
     * @param {string} count - count of elements in response
     * @param {string} page - number of page to show
     *
     * @see {@link ObjectiveModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/objectives'
     *
     * @example Response example:
     *
     * {
     *  "total": 1,
     *  "data": [{
     *       "_id": "56f25e3a20b9342c275c35cd",
     *       "title": {
     *           "ar": "5795",
     *           "en": "12355545"
     *       },
     *       "companyObjective": {
     *           "ar": null,
     *           "en": null
     *       },
     *       "description": {
     *           "ar": "",
     *           "en": "&lt;p&gt;nhfgddbf gfsgd&amp;nbsp;&lt;/p&gt;\n"
     *       },
     *       "objectiveType": "Weekly",
     *       "priority": "Medium",
     *       "status": "draft",
     *       "assignedTo": [
     *           {
     *               "_id": "56c495e58f40aa0e41615d46",
     *               "lastName": {
     *                   "ar": "طائر شجاع",
     *                   "en": "Andersen"
     *               },
     *               "firstName": {
     *                   "ar": "طائر شجاع",
     *                   "en": "Hans"
     *               }
     *           }
     *       ],
     *       "complete": 40,
     *       "parent": {
     *           "1": "56f2518384dfcbc414d33e2d",
     *           "2": null,
     *           "3": null,
     *           "4": null
     *       },
     *       "level": 2,
     *       "countSubTasks": 0,
     *       "completedSubTasks": 0,
     *       "dateStart": "2016-03-08T22:00:00.000Z",
     *       "dateEnd": "2016-03-22T22:00:00.000Z",
     *       "dateClosed": null,
     *       "comments": [],
     *       "attachments": [],
     *       "editedBy": {
     *           "date": "2016-03-25T07:30:39.338Z",
     *           "user": "56c4961e8f40aa0e41615d53"
     *       },
     *       "createdBy": {
     *           "date": "2016-03-23T09:13:30.310Z",
     *           "user": {
     *               "_id": "56c4961e8f40aa0e41615d53",
     *               "accessRole": "56c495e58f40aa0e41615d32",
     *               "position": null,
     *               "lastName": {
     *                   "ar": "",
     *                   "en": "Admin"
     *               },
     *               "firstName": {
     *                   "ar": "",
     *                   "en": "Super"
     *               },
     *               "imageSrc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAA...AAElFTkSuQmCC"
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
     *           "_id": "56f25e3a20b9342c275c35ce",
     *           "contentType": "visibility"
     *       }
     *   }]
     * }
     *
     * @method /mobile/objectives
     * @instance
     */

    router.get('/', handler.getAll);

    /**
     * __Type__ `DELETE`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/objectives/file`
     *
     * Remove file from existing `objective`
     *
     * @see {@link ObjectiveModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/mobile/objectives/file'
     *     
     *  BODY:
     *  {
     *      fileId: '56c495e58f40aa0e41615d26',
     *      objectiveId: '56c495e58f40aa0e41615d26'
     *  }
     *
     * @example Response example: status
     *
     * @method /mobile/objectives/file
     * @instance
     */

    router.delete('/file', handler.removeFileFromObjective);

    return router;
};


