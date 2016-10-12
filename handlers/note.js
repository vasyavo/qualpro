var Note = function (db, redis, event) {
    'use strict';

    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var modelAndSchemaName = CONTENT_TYPES.NOTES;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);
    var FilterMapper = require('../helpers/filterMapper');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(Model);
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')(db);
    var bodyValidator = require('../helpers/bodyValidator');

    var self = this;

    var $defProjection = {
        _id        : 1,
        createdBy  : 1,
        editedBy   : 1,
        title      : 1,
        description: 1,
        theme      : 1
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
        var currentUserId = options.currentUserId;

        pipeLine.push({
            $match: {
                'createdBy.user': ObjectId(currentUserId)
            }
        });

        pipeLine.push({
            $match: queryObject
        });

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

            pipeLine = _.union(pipeLine, aggregateHelper.setTotal());
        }

        if (limit && limit !== -1) {
            pipeLine.push({
                $skip: skip
            });

            pipeLine.push({
                $limit: limit
            });
        }

        if (!forSync) {
            pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());
        }*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit
        }));

        return pipeLine;
    }

    this.create = function (req, res, next) {
        function queryRun(body) {
            var session = req.session;
            var userId = session.uId;
            var model;
            var noteData;

            async.waterfall([

                function (cb) {
                    var createdBy = {
                        user: userId,
                        date: new Date()
                    };
                    if (body.title) {
                        body.title = _.escape(body.title);
                    }
                    if (body.theme) {
                        body.theme = _.escape(body.theme);
                    }
                    if (body.description) {
                        body.description = _.escape(body.description);
                    }

                    noteData = {
                        description: body.description,
                        theme      : body.theme,
                        createdBy  : createdBy,
                        editedBy   : createdBy,
                        title      : body.title
                    };

                    model = new Model(noteData);
                    model.save(function (err, model) {
                        if (err) {
                            return cb(err);
                        }
                        event.emit('activityChange', {
                            module    : 25,
                            actionType: ACTIVITY_TYPES.CREATED,
                            createdBy : body.createdBy,
                            itemId    : model._id,
                            itemType  : CONTENT_TYPES.NOTES
                        });

                        cb(null, model);
                    });
                },

                function (noteModel, cb) {
                    var id = noteModel.get('_id');

                    self.getByIdAggr({id: id, isMobile: req.isMobile}, cb);
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, 25, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.NOTES, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.update = function (req, res, next) {
        function queryRun(updateObject) {
            var session = req.session;
            var userId = session.uId;
            var noteId = req.params.id;

            async.waterfall([

                function (cb) {
                    updateObject.editedBy = {
                        user: ObjectId(userId),
                        date: new Date()
                    };
                    if (updateObject.title) {
                        updateObject.title = _.escape(updateObject.title);
                    }
                    if (updateObject.theme) {
                        updateObject.theme = _.escape(updateObject.theme);
                    }
                    if (updateObject.description) {
                        updateObject.description = _.escape(updateObject.description);
                    }

                    Model.findOne({_id: noteId}, function (err, noteModel) {
                        var error;

                        if (err) {
                            return cb(err);
                        }

                        if (!noteModel) {
                            error = new Error('Note not found');
                            error.status = 400;
                            return cb(error);
                        }

                        noteModel.update({$set: updateObject}, function (err) {
                            if (err) {
                                return cb(err);
                            }

                            event.emit('activityChange', {
                                module    : 25,
                                actionType: ACTIVITY_TYPES.UPDATED,
                                createdBy : updateObject.editedBy,
                                itemId    : noteId,
                                itemType  : CONTENT_TYPES.NOTES
                            });

                            cb(null, noteModel.get('_id'));
                        });
                    });
                },

                function (id, cb) {
                    self.getByIdAggr({id: id, isMobile: req.isMobile}, cb);
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getEditAccess(req, 25, function (err, allowed) {
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

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.NOTES, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAll = function (req, res, next) {
        function queryRun() {
            var currentUserId = req.session.uId;
            var query = req.query;
            var filter = query.filter || {};
            var page = query.page || 1;
            var contentType = query.contentType;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var pipeLine;
            var aggregation;
            var positionFilter = {};

            var searchFieldsArray = [
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'createdBy.user.accessRole.name.en',
                'createdBy.user.accessRole.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar',
                'title',
                'theme',
                'description'
            ];

            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.NOTES,
                filter     : filter
            });

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            if (queryObject.personnel) {
                queryObject['createdBy.user'] = queryObject.personnel;
                delete queryObject.personnel;
            }

            pipeLine = getAllPipeline({
                currentUserId    : currentUserId,
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

                if (err) {
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                response.data = _.map(response.data, function (element) {
                    if (element.title) {
                        element.title = _.unescape(element.title);
                    }
                    if (element.theme) {
                        element.theme = _.unescape(element.theme);
                    }
                    if (element.description) {
                        element.description = _.unescape(element.description);
                    }

                    personnelIds.push(element.createdBy.user._id);

                    return element;
                });

                personnelIds = _.uniqBy(personnelIds, 'id');

                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;

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
                    fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, 25, function (err, allowed) {
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

    this.archive = function (req, res, next) {
        function queryRun() {
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var uId = req.session.uId;
            var options = [
                {
                    idsToArchive   : idsToArchive,
                    keyForCondition: '_id',
                    archived       : archived,
                    model          : Model
                }
            ];

            archiver.archive(uId, options, function (err) {
                if (err) {
                    return next(err);
                }

                res.status(200).send();
            });
        }

        access.getArchiveAccess(req, 25, function (err, allowed) {
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

    this.delete = function (req, res, next) {
        var id = req.params.id;
        var query;

        query = Model.findByIdAndRemove({_id: id});
        query.exec(function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send({});
        });
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);
            var isMobile = req.isMobile;

            self.getByIdAggr({id: id, isMobile: isMobile}, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, 25, function (err, allowed) {
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
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: {createdBy: {date: 1}}
        }));

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

            if (err) {
                return callback(err);
            }

            if (!response.length) {
                return callback(null, {});
            }

            response = response[0];

            if (response.title) {
                response.title = _.unescape(response.title);
            }
            if (response.theme) {
                response.theme = _.unescape(response.theme);
            }
            if (response.description) {
                response.description = _.unescape(response.description);
            }

            personnelIds.push(response.createdBy.user._id);

            options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;

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
                fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, function (response) {
                    callback(null, response);
                })
            });
        });
    };
};

module.exports = Note;
