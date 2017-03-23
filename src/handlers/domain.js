'use strict';
const ActivityLog = require('./../stories/push-notifications/activityLog');

var Domain = function () {
    var async = require('async');
    var mongoose = require('mongoose');
    var _ = require('underscore');
    var lodash = require('lodash');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var DomainModel = require('./../types/domain/model');
    var BranchModel = require('./../types/branch/model');
    var PersonnelModel = require('./../types/personnel/model');
    var SessionModel = require('./../types/session/model');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')();
    var FilterMapper = require('../helpers/filterMapper');
    var Archiver = require('../helpers/domainArchiver');
    var logWriter = require('../helpers/logWriter.js');
    var archiver = new Archiver(DomainModel, BranchModel);
    var populateByType = require('../helpers/populateByType');
    var contentTypes = require('../public/js/helpers/contentTypesHelper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var bodyValidator = require('../helpers/bodyValidator');
    var cutOccupiedDomains = require('../helpers/cutOccupiedDomains');
    var objectId = mongoose.Types.ObjectId;

    var $defProjection = {
        _id        : 1,
        name       : 1,
        currency   : 1,
        type       : 1,
        editedBy   : 1,
        createdBy  : 1,
        parent     : 1,
        archived   : 1,
        topArchived: 1,
        total      : 1,
        translated : 1,
        imageSrc: 1,
    };

    this.create = function (req, res, next) {
        var mid = req.mid || ACL_MODULES.COUNTRY;

        function queryRun(body) {
            var model;
            var moduleNumber = ACL_MODULES.COUNTRY;
            if (body.type === 'region') {
                moduleNumber = ACL_MODULES.REGION;
            } else if (body.type === 'subRegion') {
                moduleNumber = ACL_MODULES.SUB_REGION;
            }
            var createdBy = {
                user: req.session.uId,
                date: new Date()
            };

            if (!body.imageSrc) {
                delete body.imageSrc;
            }

            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : ''
                };
            }

            if (body.parentId) {
                body.parent = objectId(body.parentId);
            }

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            model = new DomainModel(body);
            model.save(function (error, result) {
                if (error) {
                    return next(error);
                }
                const bodyObject = {
                    actionOriginator : req.session.uId,
                    accessRoleLevel : req.session.level,
                    body : result.toJSON()
                };

                switch (body.type) {
                    case ('country') :
                        ActivityLog.emit('country:created', bodyObject);
                        break;
                    case ('region') :
                        ActivityLog.emit('region:created', bodyObject);
                        break;
                    case ('subRegion') :
                        ActivityLog.emit('sub-region:created', bodyObject);
                        break;
               }


                if (result && result.name) {
                    result.name = {
                        en: result.name.en ? _.unescape(result.name.en) : '',
                        ar: result.name.ar ? _.unescape(result.name.ar) : ''
                    }
                }

                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, mid, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.DOMAIN, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });

    };

    this.remove = function (req, res, next) {
        var id = req.params.id;

        DomainModel.findByIdAndRemove(id, function (error) {
            if (error) {
                return next(error);
            }

            res.status(200).send();
        });
    };

    this.archive = function (req, res, next) {
        var mid = req.mid || ACL_MODULES.COUNTRY;

        function queryRun() {
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var baseUrl = req.baseUrl;
            var uId = req.session.uId;
            var contentType = baseUrl.slice(1, baseUrl.length);
            var options = {
                ids        : idsToArchive,
                archived   : archived,
                contentType: contentType,
                Personnel  : PersonnelModel,
                Session    : SessionModel,
                Branch     : BranchModel
            };

            archiver.archiveToEnd(uId, options, function (err, response) {
                var type = ACTIVITY_TYPES.ARCHIVED;
                var createdBy = {
                    user: req.session.uId,
                    date: new Date()
                };

                if (err) {
                    return next(err);
                }

                if (!req.body.archived) {
                    type = ACTIVITY_TYPES.UNARCHIVED;
                }
                async.each(idsToArchive, (id, eCb)=>{
                    DomainModel.findById(id)
                        .lean()
                        .exec((err, resp)=>{
                            if (err){
                                return eCb(err)
                            }

                            const bodyObject = {
                                actionOriginator: req.session.uId,
                                accessRoleLevel : req.session.level,
                                body            : resp
                            };

                            switch (options.contentType) {
                                case ('country') :
                                    ActivityLog.emit('country:archived', bodyObject);
                                    break;
                                case ('region') :
                                    ActivityLog.emit('region:archived', bodyObject);
                                    break;
                                case ('subRegion') :
                                    ActivityLog.emit('sub-region:archived', bodyObject);
                                    break;
                            }
                            eCb();
                        })
                }, (err)=>{
                    if (err) {
                        logWriter.log('planogram archived error', err);
                    }
                });

                res.status(200).send();
            });
        }

        access.getArchiveAccess(req, mid, function (err, allowed) {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun();
        });
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;

            BranchModel
                .findById(id)
                .populate('currency')
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    if (result && result.name) {
                        result.name = {
                            en: result.name.en ? _.unescape(result.name.en) : '',
                            ar: result.name.ar ? _.unescape(result.name.ar) : ''
                        }
                    }
                    res.status(200).send(result);
                });
        }

        access.getReadAccess(req, ACL_MODULES.COUNTRY, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun();
        });
    };

    this.getForDD = function (req, res, next) {
        function queryRun() {
            var query = req.query;

            DomainModel.find(query, '_id name parent').exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                if (result.length) {
                    result = _.map(result, function (element) {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en)
                        };
                        return element;
                    });
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.COUNTRY, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun();
        });
    };

    function getAllPipeline(options) {
        var queryObject = options.queryObject;
        var aggregateHelper = options.aggregateHelper;
        var language = options.language;
        var translateFields = options.translateFields;
        var translated = options.translated;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var sort = options.sort;
        var skip = options.skip;
        var limit = options.limit;
        var forSync = options.forSync;
        var isMobile = options.isMobile;
        var excludeItems = options.excludeItems;
        var pipeLine = [];
        var queryObjectTime = _.pick(queryObject, '$or');
        var queryObjectWithoutTime = _.omit(queryObject, '$or');
        if (!isMobile) {
            pipeLine.push({
                $match: queryObject
            });

            if (excludeItems) {
                pipeLine.push({
                    $match: {
                        _id: {
                            $nin: excludeItems
                        }
                    }
                });
            }

            pipeLine.push({
                $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
            });
        } else {
            if (queryObject.subRegion) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {_id: queryObject.subRegion},
                            {_id: queryObject.region},
                            {_id: queryObject.country}
                        ]
                    }
                });
            } else if (queryObject.region) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {_id: queryObject.region},
                            {_id: queryObject.country},
                            {parent: queryObject.region}
                        ]
                    }
                });
            } else if (queryObject.country) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {_id: queryObject.country},
                            {parent: queryObject.country},
                            {type: 'subRegion'}
                        ]
                    }
                });

                pipeLine.push({
                    $lookup: {
                        from        : 'domains',
                        localField  : 'parent',
                        foreignField: '_id',
                        as          : 'parent'
                    }
                });

                pipeLine.push({
                    $project: aggregateHelper.getProjection({
                        parent: {$arrayElemAt: ['$parent', 0]}
                    })
                });

                pipeLine.push({
                    $match: {
                        $or: [
                            {type: 'country'},
                            {type: 'region'},
                            {'parent.parent': queryObject.country}
                        ]
                    }
                });

                pipeLine.push({
                    $project: aggregateHelper.getProjection({
                        parent: '$parent._id'
                    })
                });
            } else {
                pipeLine.push({
                    $match: queryObjectWithoutTime
                });
            }

            pipeLine.push({
                $match: queryObjectTime
            });
        }

        if (translated && translated.length === 1) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    translated: aggregateHelper.translatedCond(language, translateFields, translated[0])
                })
            });

            pipeLine.push({
                $match: {
                    translated: true
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'editedBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {editedBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'createdBy.user.accessRole',
            isArray        : false,
            addProjection  : ['_id', 'name', 'level'],
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'createdBy.user.position',
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id       : 1,
                        accessRole: 1,
                        firstName : 1,
                        lastName  : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'editedBy.user.accessRole',
            isArray        : false,
            addProjection  : ['_id', 'name', 'level'],
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'editedBy.user.position',
            isArray        : false,
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id       : 1,
                        accessRole: 1,
                        firstName : 1,
                        lastName  : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'currencies',
            key    : 'currency',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit,
            sort             : sort
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var filter = query.filter || {};
            var lastLogOut = new Date(query.lastLogOut);
            var filterMapper = new FilterMapper();
            var type = query.parentCT;
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.DOMAIN,
                filter     : filter,
                personnel  : personnel
            });
            var aggregateHelper = new AggregationHelper($defProjection, queryObject);
            var sort = query.sort || {'editedBy.date': 1};
            var pipeLine;
            var aggregation;
            var ids;

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }
            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = getAllPipeline({
                aggregateHelper: aggregateHelper,
                queryObject    : queryObject,
                sort           : sort,
                forSync        : true,
                isMobile       : req.isMobile
            });

            aggregation = DomainModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    element.name = {
                        ar: _.unescape(element.name.ar),
                        en: _.unescape(element.name.en),
                    };
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.COUNTRY, function (err, allowed, personnel) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun(personnel);
        });
    };

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var filter = query.filter || {};
            var type = query.parentCT;
            var isMobile = req.isMobile;
            var contentType = contentTypes.getNextType(type);
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;

            var language = req.cookies.currentLanguage;
            var sortObject = language === 'en' ? {'name.en': 1} : {'name.ar': 1};

            var translateFields = ['name'];
            var translated = (query.filter && query.filter.translated) ? query.filter.translated.values : [];

            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var aggregation;
            var key;
            var queryObject = isMobile ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.DOMAIN,
                filter     : filter,
                personnel  : personnel
            }) :
                filterMapper.mapFilter({
                    contentType: CONTENT_TYPES.DOMAIN,
                    filter     : filter,
                    context    : contentType,
                    personnel  : personnel
                });

            var aggregateHelper = new AggregationHelper($defProjection, queryObject);

            var sort = query.sort || sortObject;

            var searchFieldsArray = [
                'name.en',
                'name.ar'
            ];

            delete filter.globalSearch;

            for (key in sort) {
                sort[key] = parseInt(sort[key]);
            }

            if (!isMobile && !queryObject.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            if (!isMobile) {
                queryObject.type = contentType;
            }

            if (isMobile) {
                delete queryObject.region;
                delete queryObject.subRegion;
            }

            const pipeLine = getAllPipeline({
                queryObject,
                aggregateHelper,
                language,
                translateFields,
                translated,
                searchFieldsArray,
                filterSearch,
                sort,
                skip,
                limit,
                isMobile,
            });

            aggregation = DomainModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true,
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    element.name = {
                        ar: _.unescape(element.name.ar),
                        en: _.unescape(element.name.en),
                    };
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.COUNTRY, function (err, allowed, personnel) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun(personnel);
        });
    };

    this.update = function (req, res, next) {
        var mid = req.mid || ACL_MODULES.COUNTRY;

        function queryRun(body) {
            var id = req.params.id;
            var query;
            var moduleNumber = ACL_MODULES.COUNTRY;
            if (body.type === 'region') {
                moduleNumber = ACL_MODULES.REGION;
            } else if (body.type === 'subRegion') {
                moduleNumber = ACL_MODULES.SUB_REGION;
            }

            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : ''
                }
            }

            body.editedBy = {
                user: req.session.uId,
                date: new Date()
            };

            query = DomainModel.findByIdAndUpdate(id, body, {new: true});

            populateByType(query, body.type).exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                const bodyObject = {
                    actionOriginator: req.session.uId,
                    accessRoleLevel : req.session.level,
                    body            : result.toJSON()
                };

                switch (body.type) {
                    case ('country') :
                        ActivityLog.emit('country:updated', bodyObject);
                        break;
                    case ('region') :
                        ActivityLog.emit('region:updated', bodyObject);
                        break;
                    case ('subRegion') :
                        ActivityLog.emit('sub-region:updated', bodyObject);
                        break;
                }

                if (result && result.name) {
                    result.name = {
                        en: result.name.en ? _.unescape(result.name.en) : '',
                        ar: result.name.ar ? _.unescape(result.name.ar) : ''
                    };
                }

                res.status(200).send(result);
            });
        }

        access.getEditAccess(req, mid, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.DOMAIN, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };
};

module.exports = Domain;
