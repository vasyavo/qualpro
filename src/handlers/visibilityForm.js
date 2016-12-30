'use strict';
var VisibilityForm = function (db, redis, event) {
    var mongoose = require('mongoose');
    var async = require('async');
    var _ = require('underscore');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var VALIDATION = require('../public/js/constants/validation.js');
    var CONSTANTS = require('../constants/mainConstants');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var VisibilityFormModel = require('./../types/visibilityForm/model');
    var objectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')(db);
    var FileHandler = require('../handlers/file');
    var validator = require('validator');
    var fileHandler = new FileHandler(db);
    var bodyValidator = require('../helpers/bodyValidator');
    var self = this;
    var $defProjection = {
        _id        : 1,
        createdBy  : 1,
        editedBy   : 1,
        objective  : 1,
        before     : 1,
        files      : 1,
        after      : 1,
        description: 1
    };

    this.createForm = function (userId, body, files, callback) {
        var createdBy = {
            user: userId,
            date: new Date()
        };
        var model;
        var before;
        var visibilityForm;

        async.waterfall([
            function (cb) {
                if (!files) {
                    return cb(null, []);
                }
                fileHandler.uploadFile(userId, files, CONTENT_TYPES.VISIBILITYFORM, function (err, filesIds) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, filesIds);
                });
            },
            function (filesIds, cb) {

                if (!body) {
                    return cb(Error('Request body is empty'));
                }
                before = {
                    files: filesIds
                };

                visibilityForm = {
                    objective: body.objective,
                    createdBy: createdBy,
                    editedBy : createdBy,
                    before   : before
                };

                model = new VisibilityFormModel(visibilityForm);
                model.save(function (err, model) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, model);
                });
            }
        ], function (err, result) {
            if (err) {
                return callback(err);
            }

            callback(null, result);
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var userId = req.session.uId;

            self.createForm(userId, body, files, function (err, result) {
                if (err) {
                    return next(err);
                }

                event.emit('activityChange', {
                    module    : ACL_MODULES.VISIBILITY_FORM,
                    actionType: ACTIVITY_TYPES.CREATED,
                    createdBy : result.get('createdBy'),
                    itemId    : result._id,
                    itemType  : CONTENT_TYPES.VISIBILITYFORM
                });

                if (req.isMobile) {
                    VisibilityFormModel.populate(result, {
                        path  : 'createdBy.user',
                        select: '_id, firstName, lastName'
                    }, function (err, result) {
                        if (err) {
                            return next(err);
                        }

                        res.status(201).send(result);
                    });
                }
            });
        }

        access.getWriteAccess(req, ACL_MODULES.VISIBILITY_FORM, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.VISIBILITYFORM, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });

    };

    function getAllAggregate(options, callback) {
        var aggregateHelper = options.aggregateHelper;
        var isMobile = options.isMobile;
        var skip = options.skip;
        var limit = options.limit;
        var queryObject = options.queryObject;
        var pipeline = [];
        var aggregation;

        var $lookup2 = {
            from        : 'files',
            localField  : 'before.files',
            foreignField: '_id',
            as          : 'before.files'
        };
        var $lookup3 = {
            from        : 'files',
            localField  : 'after.files',
            foreignField: '_id',
            as          : 'after.files'
        };

        pipeline.push({
            $match: queryObject
        });

        pipeline.push({
            $project: {
                _id      : 1,
                objective: 1,
                editedBy : 1,
                before   : 1,
                after    : 1,
                createdBy: 1
            }
        });

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
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

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
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
            pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'editedBy.user',
                isArray        : false,
                addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
                includeSiblings: {editedBy: {date: 1}}
            }));

            pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
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

            pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
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

        pipeline.push({
            $unwind: {
                path                      : '$before.files',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({
            $unwind: {
                path                      : '$after.files',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({$lookup: $lookup2});

        pipeline.push({$lookup: $lookup3});

        pipeline.push({
            $project: {
                _id      : 1,
                objective: 1,
                editedBy : 1,
                before   : {
                    files      : {$arrayElemAt: ['$before.files', 0]},
                    description: 1
                },

                after: {
                    files      : {$arrayElemAt: ['$after.files', 0]},
                    description: 1
                },

                createdBy: 1
            }
        });

        pipeline.push({
            $project: {
                _id      : 1,
                objective: 1,
                editedBy : 1,
                before   : {
                    files: {
                        _id         : '$before.files._id',
                        fileName    : '$before.files.name',
                        contentType : '$before.files.contentType',
                        originalName: '$before.files.originalName',
                        extension   : '$before.files.extension'
                    },

                    description: 1
                },

                after    : {
                    files: {
                        _id         : '$after.files._id',
                        fileName    : '$after.files.name',
                        contentType : '$after.files.contentType',
                        originalName: '$after.files.originalName',
                        extension   : '$after.files.extension'
                    },

                    description: 1
                },
                createdBy: 1
            }
        });

        if (limit && limit !== -1) {
            pipeline.push({
                $skip: skip
            });

            pipeline.push({
                $limit: limit
            });
        }

        aggregation = VisibilityFormModel.aggregate(pipeline);

        aggregation.exec(function (err, result) {
            if (err) {
                return callback(err);
            }

            result = _.map(result, function (element) {
                var nameBefore;
                var urlBefore;
                var nameAfter;
                var urlAfter;

                if (element.before.files && element.before.files.fileName) {
                    nameBefore = element.before.files.fileName;
                    urlBefore = fileHandler.computeUrl(nameBefore, 'visibilityForm');
                    element.before.files.url = urlBefore;
                }

                if (element.after.files && element.after.files.fileName) {
                    nameAfter = element.after.files.fileName;
                    urlAfter = fileHandler.computeUrl(nameAfter, 'visibilityForm');
                    element.after.files.url = urlAfter;
                }

                if (element.before.description) {
                    element.before.description = _.unescape(element.before.description);
                }

                if (element.after.description) {
                    element.after.description = _.unescape(element.after.description);
                }

                return element;
            });

            callback(null, result);
        });
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun() {
            var query = req.query || {};
            var lastLogOut = new Date(query.lastLogOut);
            var queryObject = {};
            var ids;
            var aggregateHelper = new AggregationHelper($defProjection, queryObject);

            if (query._id) {
                ids = query._id.split(',');
                ids = ids.objectID();
                queryObject._id = {
                    $in: ids
                };

            }

            if (query.objective) {
                ids = query.objective.split(',');
                ids = ids.objectID();
                queryObject.objective = {
                    $in: ids
                };
            }

            queryObject.$or = [{
                'editedBy.date': {$gt: lastLogOut}
            }, {
                $and: [{
                    'createdBy.date': {$gt: lastLogOut}
                }, {
                    'editedBy.date': {$exists: false}
                }]
            }];

            getAllAggregate({
                aggregateHelper: aggregateHelper,
                queryObject    : queryObject
            }, function (err, result) {
                if (err) {
                    return next(err);
                }

                result = _.map(result, function (element) {
                    if (element.after && element.after.description) {
                        element.after.description = _.unescape(element.after.description);
                    }
                    return element;
                });

                next({status: 200, body: {data: result, total: result.length}});
            });
        }

        access.getReadAccess(req, ACL_MODULES.VISIBILITY_FORM, function (err, allowed) {
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
        function queryRun() {
            var query = req.query || {};
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var isMobile = req.isMobile;
            var queryObject = {};
            var aggregateHelper = new AggregationHelper($defProjection);
            var ids;
            var key;

            if (query._id) {
                ids = query._id.split(',');
                ids = ids.objectID();
                queryObject._id = {
                    $in: ids
                };

            }

            if (query.objective) {
                ids = query.objective.split(',');
                ids = ids.objectID();
                queryObject.objective = {
                    $in: ids
                };
            }

            async.waterfall([
                function (waterfallCb) {
                    if (!isMobile) {
                        return waterfallCb(null, null);
                    }
                    key = req.session.id + '.' + 'visibility';
                    redis.cacheStore.readFromStorage(key, function (err, value) {
                        var valueJSON;

                        if (err) {
                            return waterfallCb(err);
                        }

                        if (value) {
                            valueJSON = JSON.parse(value);
                            return waterfallCb(null, valueJSON.objectiveIds);
                        }

                        return waterfallCb(null, null);

                    });
                },
                function (ids, waterfallCb) {
                    if (ids && ids.length) {
                        if (queryObject._id) {
                            queryObject._id.$in = _.union(queryObject._id.$in, ids.objectID());
                        } else {
                            queryObject._id = {
                                $in: ids.objectID()
                            };
                        }
                    }
                    getAllAggregate({
                        aggregateHelper: aggregateHelper,
                        queryObject    : queryObject,
                        skip           : skip,
                        limit          : limit,
                        isMobile       : isMobile
                    }, function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        result = _.map(result, function (element) {
                            if (element.after && element.after.description) {
                                element.after.description = _.unescape(element.after.description);
                            }
                            return element;
                        });

                        waterfallCb(null, {status: 200, body: {data: result, total: result.length}});
                    });
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }
                return next(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.VISIBILITY_FORM, function (err, allowed) {
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

    this.update = function (req, res, next) {
        function queryRun(body) {
            var id = req.params.id;
            var userId = req.session.uId;
            var files = req.files;
            var filePresence = Object.keys(files).length;
            var fileDeleted = body && body.isNewFile && !body.isNewFile.length;
            var aggregateHelper = new AggregationHelper($defProjection);
            var editedBy = {
                user: objectId(userId),
                date: new Date()
            };
            var visibilityForm = {};
            var waterfallTasks = [];
            var error;

            if (!VALIDATION.OBJECT_ID.test(id)) {
                error = new Error('Invalid parameter id');
                error.status = 400;
                return next(error);
            }

            function uploadFile(cb) {
                if (!filePresence) {
                    return cb(null, []);
                }

                fileHandler.uploadFile(userId, files, CONTENT_TYPES.VISIBILITYFORM, function (err, filesIds) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, filesIds);
                });
            }

            function deleteFile(filesBackend, cb) {
                fileHandler.deleteFew(filesBackend, function (err, filesIds) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, []);
                });
            }

            function updateFn(filesIds, cb) {
                var updateType = 'after';

                if (body.description) {
                    body.description = _.escape(body.description);
                }

                if (body.before && body.before !== 'false') {
                    updateType = 'before';
                } else {
                    visibilityForm[updateType + '.description'] = body.description;
                }

                visibilityForm.editedBy = editedBy;

                if (typeof filesIds !== 'function' && filesIds) {
                    visibilityForm[updateType + '.files'] = filesIds;
                } else {
                    cb = filesIds;
                }

                VisibilityFormModel.findByIdAndUpdate({_id: id}, {$set: visibilityForm}, function (err, model) {
                    if (err) {
                        return cb(err);
                    }

                    VisibilityFormModel.populate(model, {
                        path  : 'objective',
                        select: 'context'
                    }, function (err, model) {
                        if (err) {
                            return cb(err);
                        }
                        var module = model.objective.context === CONTENT_TYPES.OBJECTIVES
                            ? ACL_MODULES.VISIBILITY_FORM :
                            ACL_MODULES.IN_STORE_REPORTING;

                        event.emit('activityChange', {
                            module     : module,
                            actionType : ACTIVITY_TYPES.UPDATED,
                            createdBy  : visibilityForm.editedBy,
                            itemId     : model.objective._id,
                            itemType   : model.objective.context,
                            itemDetails: CONTENT_TYPES.VISIBILITYFORM
                        });

                        getAllAggregate({
                            aggregateHelper: aggregateHelper,
                            queryObject    : {_id: objectId(id)},
                            isMobile       : req.isMobile
                        }, function (err, result) {
                            if (err) {
                                return next(err);
                            }

                            result = _.map(result, function (element) {
                                if (element.after && element.after.description) {
                                    element.after.description = _.unescape(element.after.description);
                                }
                                return element;
                            });

                            res.status(200).send(result[0]);
                        });
                    });
                });
            }

            function getVisibility(cb) {
                getAllAggregate({
                    aggregateHelper: aggregateHelper,
                    queryObject    : {_id: objectId(id)}
                }, function (err, result) {
                    var filesBackend;
                    if (err) {
                        return cb(err);
                    }

                    result = _.map(result, function (element) {
                        if (element.after && element.after.description) {
                            element.after.description = _.unescape(element.after.description);
                        }
                        return element;
                    });

                    if (result[0].before.files._id) {
                        filesBackend = [result[0].before.files._id];
                        waterfallTasks.splice(1, 0, deleteFile);
                    } else {
                        filesBackend = [];
                    }

                    cb(null, filesBackend);
                });
            }

            waterfallTasks.push(updateFn);
            if (filePresence) {
                waterfallTasks.unshift(uploadFile);
            } else if (fileDeleted) {
                waterfallTasks.unshift(getVisibility);
            }

            async.waterfall(waterfallTasks,
                function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                }
            );
        }

        access.getEditAccess(req, ACL_MODULES.VISIBILITY_FORM, function (err, allowed) {
            var body = req.body;

            try {
                if (body.data) {
                    body = JSON.parse(body.data);
                }
            } catch (err) {
                return next(err);
            }

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.VISIBILITYFORM, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;
            var aggregateHelper = new AggregationHelper($defProjection);
            var error;

            if (!VALIDATION.OBJECT_ID.test(id)) {
                error = new Error('Invalid parameter id');
                error.status = 400;
                return next(error);
            }

            getAllAggregate({
                aggregateHelper: aggregateHelper,
                queryObject    : {_id: objectId(id)}
            }, function (err, result) {
                if (err) {
                    return next(err);
                }

                result = _.map(result, function (element) {
                    if (element.after && element.after.description) {
                        element.after.description = _.unescape(element.after.description);
                    }
                    return element;
                });

                res.status(200).send(result[0])
            });
        }

        access.getReadAccess(req, ACL_MODULES.VISIBILITY_FORM, function (err, allowed) {
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

    this.deleteById = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;

            VisibilityFormModel.findByIdAndRemove(id, function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.VISIBILITY_FORM, function (err, allowed) {
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

};

module.exports = VisibilityForm;