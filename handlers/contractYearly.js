var Contract = function (db, redis, event) {
    'use strict';

    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var modelAndSchemaName = CONTENT_TYPES.CONTRACTSYEARLY;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var DocumentHandler = require('../handlers/document');
    var documentHandler = new DocumentHandler(db);
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')(db);
    var bodyValidator = require('../helpers/bodyValidator');

    var self = this;

    var $defProjection = {
        _id          : 1,
        createdBy    : 1,
        editedBy     : 1,
        type         : 1,
        dateStart    : 1,
        dateEnd      : 1,
        description  : 1,
        status       : 1,
        country      : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        branch       : 1,
        documents    : 1
    };

    function getAllPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var pipeLine = [];

        if (queryObject) {
            pipeLine.push({
                $match: queryObject
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'region'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'subRegion'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key : 'branch'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'documents',
            key          : 'documents',
            as           : 'documents',
            isArray      : true,
            addProjection: ['createdBy', 'title', 'contentType']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$documents',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'documents.createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    contentType: 1,
                    createdBy  : {
                        date: 1
                    }
                }
            }
        }));

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                documents: {$addToSet: '$documents'}
            })
        });

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
                        lastName : 1
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
                        lastName  : 1
                    }
                }
            }
        }));

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'editedBy.user',
                isArray        : false,
                addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
                includeSiblings: {editedBy: {date: 1}}
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
                            lastName : 1
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
                            lastName  : 1
                        }
                    }
                }
            }));
        }

        /*if (!forSync) {
            pipeLine.push({
                $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
            });
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                lastDate: {
                    $ifNull: [
                        '$editedBy.date',
                        '$createdBy.date'
                    ]
                }
            })
        });

        pipeLine.push({
            $sort: {
                lastDate: -1
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

        if (limit && limit !== -1) {
            pipeLine.push({
                $skip: skip
            });

            pipeLine.push({
                $limit: limit
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(uid) {
            var query = req.query;
            var personnelId = ObjectId(uid);
            var isMobile = req.isMobile;
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var sort = {'createdBy.date': -1};
            var filter = query.filter || {};
            var queryObject;
            var pipeLine;
            var aggregation;
            var ids;

            delete filter.globalSearch;
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.CONTRACTSYEARLY,
                filter     : filter
            });

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }

            if ([4, 5, 6, 7].indexOf(req.session.level) !== -1) {
                queryObject.type = queryObject.type || {};
                queryObject.type.$nin = ['yearly'];
            }

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            queryObject.$and = [
                {
                    $or: queryObject.$or
                },
                {
                    $or: [
                        {
                            'createdBy.user': personnelId
                        },
                        {
                            status: {
                                $nin: ['draft']
                            }
                        }
                    ]
                }
            ];

            delete queryObject.$or;

            pipeLine = getAllPipeline({
                queryObject    : queryObject,
                aggregateHelper: aggregateHelper,
                sort           : sort,
                query          : query,
                isMobile       : isMobile,
                forSync        : true
            });

            aggregation = Model.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                var options = {
                    data: {}
                };
                var personnelIds = [];
                var fileIds = [];
                if (err) {
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                if (response && response.data && response.data.length) {
                    response.data = _.map(response.data, function (model) {
                        if (model.description) {
                            model.description = {
                                en: _.unescape(model.description.en),
                                ar: _.unescape(model.description.ar)
                            };
                        }
                        _.map(model.documents, function (el) {
                            personnelIds.push(el.createdBy.user._id);
                        });
                        personnelIds.push(model.createdBy.user._id);
                        fileIds = _.union(fileIds, _.map(model.documents, '_id'));

                        return model;
                    });
                }

                personnelIds = _.uniqBy(personnelIds, 'id');
                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.DOCUMENTS] = fileIds;

                getImagesHelper.getImages(options, function (err, result) {
                    var fieldNames = {};
                    var setOptions;
                    if (err) {
                        return next(err);
                    }

                    setOptions = {
                        response  : response,
                        imgsObject: result
                    };
                    fieldNames[CONTENT_TYPES.PERSONNEL] = [['documents.createdBy.user'], 'createdBy.user'];
                    fieldNames[CONTENT_TYPES.DOCUMENTS] = [['documents']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    });
                });
            });
        }

        access.getReadAccess(req, 42, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun(req.session.uId);
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var filesPresence = files ? Object.keys(files).length : [];
            var attachPresence = body.attachments;
            var both = attachPresence && filesPresence ? true : false;
            var session = req.session;
            var userId = session.uId;
            var model;
            var saveContractsYearly = body.saveContractsYearly;
            var error;

            var keys = Object.keys(body);
            keys.forEach(function (key) {
                if (_.indexOf(['region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'country'], key) !== -1) {
                    if (typeof body[key] === 'string') {
                        body[key] = body[key].split(',');
                        body[key] = body[key].objectID();
                    } else {
                        body[key] = ObjectId(body[key]);
                    }
                }
            });

            async.waterfall([

                function (cb) {
                    if (!filesPresence) {
                        return cb(null, null);
                    }
                    documentHandler.createDocIfNewContract(userId, files, function (err, documentId) {
                        if (err) {
                            return cb(err);
                        }

                        return cb(null, documentId);
                    });
                },

                function (documentId, cb) {
                    var description = body.description;
                    var createdBy = {
                        user: userId,
                        date: new Date()
                    };

                    if (!filesPresence) {
                        documentId = body.attachments.objectID();
                    }
                    if (description) {
                        if (description.en) {
                            description.en = _.escape(description.en);
                        }

                        if (description.ar) {
                            description.ar = _.escape(description.ar);
                        }
                        body.description = description;
                    }
                    body.documents = both ? _.union(documentId, body.attachments.objectID()) : documentId;
                    body.status = saveContractsYearly ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;
                    body.createdBy = createdBy;
                    body.editedBy = createdBy;
                    delete body.attachments;

                    model = new Model(body);
                    model.save(function (err, model) {
                        if (err) {
                            return cb(err);
                        }

                        event.emit('activityChange', {
                            module    : 20,
                            actionType: ACTIVITY_TYPES.CREATED,
                            createdBy : body.createdBy,
                            itemId    : model._id,
                            itemType  : CONTENT_TYPES.CONTRACTSYEARLY
                        });

                        return cb(null, model);
                    });
                },

                function (contractsYearlyModel, cb) {
                    var id = contractsYearlyModel.get('_id');

                    self.getByIdAggr({id: id, isMobile: req.isMobile}, function (err, result) {
                        if (err) {
                            return cb(err);
                        }
                        return cb(null, result);

                    });
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, 20, function (err, allowed) {
            var body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            try {
                if (req.body.data) {
                    body = JSON.parse(req.body.data);
                } else {
                    body = req.body;
                }
            } catch (err) {
                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.CONTRACTSYEARLY, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.update = function (req, res, next) {
        function queryRun(updateObject) {
            var files = req.files;
            var filesPresence = Object.keys(files).length;
            var attachPresence = updateObject.attachments;
            var both = attachPresence && filesPresence;
            var session = req.session;
            var userId = session.uId;
            var saveContractsYearly = updateObject.saveContractsYearly;
            var contractYearlyId = req.params.id;
            var fullUpdate = {
                $set: updateObject
            };

            var keys = Object.keys(updateObject);
            keys.forEach(function (key) {
                if (_.indexOf(['region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'country'], key) !== -1) {
                    if (typeof updateObject[key] === 'string') {
                        updateObject[key] = updateObject[key].split(',');
                        updateObject[key] = updateObject[key].objectID();
                    } else {
                        updateObject[key] = ObjectId(updateObject[key]);
                    }
                }
            });

            async.waterfall([

                    function (cb) {
                        if (!filesPresence) {
                            return cb(null, null);
                        }

                        documentHandler.createDocIfNewContract(userId, files, function (err, documentId) {
                            if (err) {
                                return cb(err);
                            }

                            cb(null, documentId);
                        });
                    },

                    function (documentId, cb) {
                        var description = updateObject.description;
                        updateObject.editedBy = {
                            user: ObjectId(userId),
                            date: new Date()
                        };

                        if (!filesPresence && attachPresence) {
                            documentId = updateObject.attachments.objectID();
                        }
                        if (description) {
                            if (description.en) {
                                description.en = _.escape(description.en);
                            }

                            if (description.ar) {
                                description.ar = _.escape(description.ar);
                            }
                            updateObject.description = description;
                        }
                        if (documentId) {
                            updateObject.documents = both ? _.union(documentId, updateObject.attachments.objectID()) : documentId;
                        }
                        if (filesPresence && !both) {
                            fullUpdate.$addToSet = {};
                            fullUpdate.$addToSet.documents = {$each: updateObject.documents};
                            delete updateObject.documents;
                        }
                        updateObject.status = saveContractsYearly ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;

                        delete updateObject.attachments;
                        Model.findByIdAndUpdate(contractYearlyId, fullUpdate, function (err, contractModel) {
                            if (err) {
                                return cb(err);
                            }
                            event.emit('activityChange', {
                                module    : 20,
                                actionType: ACTIVITY_TYPES.UPDATED,
                                createdBy : updateObject.editedBy,
                                itemId    : contractYearlyId,
                                itemType  : CONTENT_TYPES.CONTRACTSYEARLY
                            });

                            return cb(null, contractModel.get('_id'));
                        });
                    },

                    function (id, cb) {
                        self.getByIdAggr({id: id, isMobile: req.isMobile}, function (err, result) {
                            if (err) {
                                return cb(err);
                            }
                            return cb(null, result);
                        });
                    }
                ],
                function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                }
            );
        }

        access.getEditAccess(req, 20, function (err, allowed) {
            var updateObject;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            try {
                if (req.body.data) {
                    updateObject = JSON.parse(req.body.data);
                } else {
                    updateObject = req.body;
                }
            } catch (err) {
                return next(err);
            }

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.CONTRACTSYEARLY, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            res.status(200).send();
        }

        access.getEditAccess(req, 20, function (err, allowed) {
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
            var id = ObjectId(req.params.id);

            self.getByIdAggr({id: id}, function (err, result) {
                if (err) {
                    return next(err);
                }
                if (result) {
                    result.description = {
                        ar: _.unescape(result.description.ar),
                        en: _.unescape(result.description.en)
                    };
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, 20, function (err, allowed) {
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

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var filter = query.filter || {};
            var page = query.page || 1;
            var contentType = query.contentType;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var pipeLine;
            var aggregation;
            var positionFilter = {};
            var searchFieldsArray = [
                'description.en',
                'description.ar',
                'country.name.en',
                'country.name.ar',
                'region.name.en',
                'region.name.ar',
                'subRegion.name.en',
                'subRegion.name.ar',
                'retailSegment.name.en',
                'retailSegment.name.ar',
                'outlet.name.en',
                'outlet.name.ar',
                'branch.name.en',
                'branch.name.ar',
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'createdBy.user.accessRole.name.en',
                'createdBy.user.accessRole.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar'
            ];
            var orCondition = [
                {'createdBy.user': personnel._id},
                {
                    status: {
                        $nin: ['draft']
                    }
                }
            ];

            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.CONTRACTSYEARLY,
                filter     : filter,
                personnel  : personnel
            });

            if (queryObject.personnel) {
                queryObject['createdBy.user'] = queryObject.personnel;
                delete queryObject.personnel;
            }

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {
                    $or: [
                        {
                            'createdBy.user.position': queryObject.position
                        }
                    ]
                };

                delete queryObject.position;
            }

            if ([4, 5, 6, 7].indexOf(req.session.level) !== -1) {
                queryObject.type = queryObject.type || {};
                queryObject.type.$nin = ['yearly'];
            }

            if (queryObject.$or) {
                queryObject.$and = [
                    {
                        $or: queryObject.$or
                    },
                    {
                        $or: orCondition
                    }
                ];
                delete queryObject.$or;
            } else {
                queryObject.$or = orCondition;
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine = getAllPipeline({
                aggregateHelper  : aggregateHelper,
                queryObject      : queryObject,
                positionFilter   : positionFilter,
                isMobile         : req.isMobile,
                searchFieldsArray: searchFieldsArray,
                filterSearch     : filterSearch,
                skip             : skip,
                limit            : limit
            });

            aggregation = Model.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                var options = {
                    data: {}
                };
                var personnelIds = [];
                var fileIds = [];
                if (err) {
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                if (response && response.data && response.data.length) {
                    response.data = _.map(response.data, function (model) {
                        if (model.description) {
                            model.description = {
                                en: _.unescape(model.description.en),
                                ar: _.unescape(model.description.ar)
                            };
                        }
                        _.map(model.documents, function (el) {
                            personnelIds.push(el.createdBy.user._id);
                        });
                        personnelIds.push(model.createdBy.user._id);
                        fileIds = _.union(fileIds, _.map(model.documents, '_id'));

                        return model;
                    });
                }

                personnelIds = _.uniqBy(personnelIds, 'id');
                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.DOCUMENTS] = fileIds;

                getImagesHelper.getImages(options, function (err, result) {
                    var fieldNames = {};
                    var setOptions;
                    if (err) {
                        return next(err);
                    }

                    setOptions = {
                        response  : response,
                        imgsObject: result
                    };
                    fieldNames[CONTENT_TYPES.PERSONNEL] = [['documents.createdBy.user'], 'createdBy.user'];
                    fieldNames[CONTENT_TYPES.DOCUMENTS] = [['documents']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, 20, function (err, allowed, personnel) {
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

    this.getByIdAggr = function (options, callback) {
        var aggregateHelper;
        var pipeLine = [];
        var aggregation;
        var id = options.id || '';
        var isMobile = options.isMobile || false;

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {_id: id}
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'region'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'subRegion'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key : 'branch'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'documents',
            key          : 'documents',
            as           : 'documents',
            addProjection: ['createdBy', 'title', 'contentType']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$documents',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'documents.createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    contentType: 1,
                    createdBy  : {
                        date: 1
                    }
                }
            }
        }));

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                documents: {$addToSet: '$documents'}
            })
        });

        if (!isMobile) {
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
                            lastName : 1
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
                            lastName  : 1
                        }
                    }
                }
            }));
        }

        aggregation = Model.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, response) {
            var options = {
                data: {}
            };
            var personnelIds = [];
            var fileIds;
            if (err) {
                return callback(err);
            }

            if (!response.length) {
                return callback(response);
            }

            response = response[0];

            if (response.description) {
                response.description = {
                    en: _.unescape(response.description.en),
                    ar: _.unescape(response.description.ar)
                };
            }
            _.map(response.documents, function (el) {
                personnelIds.push(el.createdBy.user._id);
            });
            personnelIds.push(response.createdBy.user._id);
            fileIds = _.map(response.documents, '_id');

            personnelIds = _.uniqBy(personnelIds, 'id');
            options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
            options.data[CONTENT_TYPES.DOCUMENTS] = fileIds;

            getImagesHelper.getImages(options, function (err, result) {
                var fieldNames = {};
                var setOptions;
                if (err) {
                    return callback(err);
                }

                setOptions = {
                    response  : response,
                    imgsObject: result
                };
                fieldNames[CONTENT_TYPES.PERSONNEL] = [['documents.createdBy.user'], 'createdBy.user'];
                fieldNames[CONTENT_TYPES.DOCUMENTS] = [['documents']];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, function (response) {
                    callback(null, response);
                })
            });
        });
    };
};

module.exports = Contract;

