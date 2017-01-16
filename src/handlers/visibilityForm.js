const ObjectId = require('mongoose').Types.ObjectId;
const ObjectiveModel = require('./../types/objective/model');
const SchedulerModel = require('./../stories/scheduler/model');
const SchedulerRequest = require('./../stories/scheduler/request');

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
        branches   : 1,
        files      : 1,
        after      : 1,
        description: 1
    };

    this.createForm = function (userId, body, callback) {
        const createdBy = body.createdBy || {
            user: userId,
            date: new Date()
        };

        if (!body) {
            return callback(Error('Request body is empty'));
        }

        const visibilityForm = {
            objective: body.objective,
            createdBy: createdBy,
            editedBy : createdBy,
            before   : body.before
        };

        visibilityForm.branches = body.branches || [];

        VisibilityFormModel.create(visibilityForm, (err, model) => {
            if (err) {
                return callback(err);
            }

            callback(null, model);
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var userId = req.session.uId;

            self.createForm(userId, body, function (err, result) {
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

        if (limit && limit !== -1) {
            pipeline.push({
                $skip: skip
            });

            pipeline.push({
                $limit: limit
            });
        }

        pipeline.push({
            $project: {
                _id      : 1,
                objective: 1,
                editedBy : 1,
                branches : 1,
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
                branches : 1,
                before   : {
                    files      : {$arrayElemAt: [{$ifNull: ['$before.files', []]}, 0]},
                },

                after: {
                    files      : {$arrayElemAt: [{$ifNull: ['$after.files', []]}, 0]},
                    description: 1
                },

                createdBy: 1
            }
        });

        pipeline.push({
            $group: {
                _id: {
                    _id        : '$_id',
                    objective  : '$objective',
                    editedBy   : '$editedBy',
                    createdBy  : '$createdBy',
                    branches: '$branches',
                    description: '$after.description'
                },

                beforeFiles: {
                    $push: {
                        _id         : '$before.files._id',
                        fileName    : '$before.files.name',
                        contentType : '$before.files.contentType',
                        originalName: '$before.files.originalName',
                        extension   : '$before.files.extension'
                    }
                },

                afterFiles: {
                    $push: {
                        _id         : '$after.files._id',
                        fileName    : '$after.files.name',
                        contentType : '$after.files.contentType',
                        originalName: '$after.files.originalName',
                        extension   : '$after.files.extension'
                    }
                }
            }
        },{
            $project: {
                _id      : '$_id._id',
                objective: '$_id.objective',
                editedBy : '$_id.editedBy',
                branches : '$_id.branches',
                createdBy: '$_id.createdBy',

                before   : {
                    files: {$setDifference: ['$beforeFiles', [{}]]}
                },
                after    : {
                    files: {$setDifference: ['$afterFiles', [{}]]},

                    description: '$_id.description'
                }
            }
        });

        // update branches
        pipeline.push({
            $unwind: {
                path                      : '$branches',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $unwind: {
                path                      : '$branches.before.files',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $unwind: {
                path                      : '$branches.after.files',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'files',
                localField  : 'branches.before.files',
                foreignField: '_id',
                as          : 'branches.before.files'
            }
        }, {
            $lookup: {
                from        : 'files',
                localField  : 'branches.after.files',
                foreignField: '_id',
                as          : 'branches.after.files'
            }
        }, {
            $project: {
                _id      : 1,
                objective: 1,
                editedBy : 1,
                before   : 1,
                after    : 1,
                createdBy: 1,
                branches : {
                    branchId: 1,
                    before  : {
                        files: {
                            $cond: {
                                if  : {$eq: ['$branches.before', []]},
                                then: null,
                                else: {$arrayElemAt: [{$ifNull: ['$branches.before.files', []]}, 0]}
                            }
                        }
                    },

                    after: {
                        files      : {
                            $cond: {
                                if  : {$eq: ['$branches.after', []]},
                                then: null,
                                else: {$arrayElemAt: [{$ifNull: ['$branches.after.files', []]}, 0]}
                            }
                        },
                        description: 1
                    },
                }
            }
        },{
            $project: {
                _id      : 1,
                objective: 1,
                editedBy : 1,
                before   : 1,
                after    : 1,
                createdBy: 1,
                branches : {
                    branchId: 1,
                    before  : {
                        files: '$branches.before.files'
                    },

                    after: {
                        files: '$branches.after.files',
                        description: 1
                    },
                }
            }
        }, {
            $group: {
                _id: {
                    _id        : '$_id',
                    objective  : '$objective',
                    editedBy   : '$editedBy',
                    before     : '$before',
                    after      : '$after',
                    createdBy  : '$createdBy',
                    branchId   : '$branches.branchId',
                    description: '$branches.after.description'
                },

                branchesBeforeFiles: {
                    $push: {
                        _id         : '$branches.before.files._id',
                        fileName    : '$branches.before.files.name',
                        contentType : '$branches.before.files.contentType',
                        originalName: '$branches.before.files.originalName',
                        extension   : '$branches.before.files.extension'
                    }
                },

                branchesAfterFiles: {
                    $push: {
                        _id         : '$branches.after.files._id',
                        fileName    : '$branches.after.files.name',
                        contentType : '$branches.after.files.contentType',
                        originalName: '$branches.after.files.originalName',
                        extension   : '$branches.after.files.extension'
                    }
                }
            }
        }, {
            $project: {
                _id        : '$_id._id',
                objective  : '$_id.objective',
                editedBy   : '$_id.editedBy',
                before     : '$_id.before',
                after      : '$_id.after',
                createdBy  : '$_id.createdBy',
                branchId   : '$_id.branchId',
                description: '$_id.description',
                branchesBeforeFiles   : 1,
                branchesAfterFiles   : 1,
            }
        }, {
            $group: {
                _id: {
                    _id      : '$_id',
                    objective: '$objective',
                    editedBy : '$editedBy',
                    before   : '$before',
                    after    : '$after',
                    createdBy: '$createdBy',
                },

                branches: {
                    $push: {
                        before  : {
                            files: {$setDifference: ['$branchesBeforeFiles', [{}]]},
                        },
                        branchId: '$branchId',
                        after   : {
                            files      : {$setDifference: ['$branchesAfterFiles', [{}]]},
                            description: '$description'
                        }
                    }
                }
            }
        }, {
            $project: {
                _id      : '$_id._id',
                objective: '$_id.objective',
                editedBy : '$_id.editedBy',
                before   : '$_id.before',
                after    : '$_id.after',
                createdBy: '$_id.createdBy',
                branches :  {$filter: {
                    input: '$branches',
                    as   : 'item',
                    cond : {
                        $or: [
                            {
                                $gt: [{$size: {$ifNull: ['$$item.before.files', []]}}, 0]
                            }, {
                                $gt: [{$size: {$ifNull: ['$$item.after.files', []]}}, 0]
                            }, {
                                $gt: [{$ifNull: ['$$item.after.description', '']}, '']
                            }
                        ]
                    }
                }},
            }
        });

        VisibilityFormModel.aggregate(pipeline).allowDiskUse(true).exec(function (err, result) {
            if (err) {
                return callback(err);
            }

            function setUrl(file) {
                file.url = fileHandler.computeUrl(file.fileName, 'visibilityForm');
                return file;
            }

            result = _.map(result, function (element) {
                if (element.before.files && element.before.files.length) {
                    element.before.files = element.before.files.map(setUrl);
                }

                if (element.after.files && element.after.files.length) {
                    element.after.files = element.after.files.map(setUrl);
                }

                if (element.after.description) {
                    element.after.description = _.unescape(element.after.description);
                }

                if(element.branches && element.branches.length){
                    element.branches = element.branches.map(item => {
                        if (item.before.files && item.before.files.length) {
                            item.before.files = item.before.files.map(setUrl);
                        }

                        if (item.after.files && item.after.files.length) {
                            item.after.files = item.after.files.map(setUrl);
                        }

                        if (item.after.description) {
                            item.after.description = _.unescape(item.after.description);
                        }

                        return item;
                    });
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

    this.updateBefore = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const id = req.params.id;
        const body = req.body;

        const queryRun = (body, callback) => {
            if (!VALIDATION.OBJECT_ID.test(id)) {
                const error = new Error('Invalid parameter id');

                error.status = 400;
                return next(error);
            }

            const updateVisibilityForm = (cb) => {
                VisibilityFormModel.findById(id, (err, model) => {
                    if (err) {
                        return cb(err);
                    }

                    if (body.before) {
                        model.before = body.before;
                    }

                    if (body.branches && body.branches.length) {
                        _.each(body.branches, (elem) => {
                            let existingBranch = _.find(model.branches, item => item.branchId.toString() === elem.branchId);

                            if (existingBranch) {
                                existingBranch.before = elem.before;
                            } else {
                                model.branches.push({
                                    branchId: elem.branchId,
                                    before   : elem.before
                                });
                            }
                        });
                    }

                    cb(null, model);
                });
            };

            const registerEvent = (options) => {
                const {
                    formId,
                    objectiveId,
                    setFileId,
                } = options;

                const exec = (options) => {
                    const {
                        query,
                        functionName,
                    } = options;

                    async.waterfall([

                        (cb) => {
                            ObjectiveModel.findOne(query)
                                .lean()
                                .exec((err, objective) => {
                                    if (err) {
                                        return cb(err);
                                    }

                                    if (!objective) {
                                        return cb('Objective not registered');
                                    }

                                    cb();
                                });
                        },

                        (cb) => {
                            const dueDate = new Date();

                            dueDate.setSeconds(dueDate.getSeconds() + 10);
                            SchedulerRequest.post({
                                json : {
                                    date: dueDate.getSeconds(),
                                },
                            }, cb);
                        },

                        (response, cb) => {
                            const delayedTask = new SchedulerModel();
                            const data = {
                                scheduleId: response.id,
                                functionName,
                                args: {
                                    objectiveId,
                                    visibilityFormId: ObjectId(formId),
                                    setFileId,
                                    actionOriginator: ObjectId(userId),
                                    accessRoleLevel,
                                },
                            };

                            delayedTask.set(data);
                            delayedTask.save(cb);
                        }

                    ]);
                };

                exec({
                    query: {
                        _id: ObjectId(objectiveId),
                        'form._id': ObjectId(formId),
                        'form.contentType': 'visibility',
                        'createdBy.date': new Date(options.updatedAt),
                    },
                    functionName: 'emitObjectiveRegistered',
                });

                exec({
                    query: {
                        _id: ObjectId(objectiveId),
                        'form._id': ObjectId(formId),
                        'form.contentType': 'visibility',
                        'createdBy.date': {
                            $lt: new Date(options.updatedAt)
                        },
                    },
                    functionName: 'emitObjectiveUpdated',
                });
            };

            const fetchSetFileId = (form, cb) => {
                const setBranchesBeforeFiles = [];

                form.branches.forEach(branch => {
                    branch.before.files &&
                    branch.before.files.forEach(file => {
                        setBranchesBeforeFiles.push(file);
                    })
                });
                const setBeforeFiles = form.before.files;
                const setFileId = _.union(setBranchesBeforeFiles, setBeforeFiles);
                const setCompactFileId = _.compact(setFileId);
                const updatedAt = form.editedBy.date;

                if (setCompactFileId.length) {
                    registerEvent({
                        formId: id,
                        objectiveId: form.objective,
                        setFileId: setCompactFileId,
                        updatedAt,
                    });
                }

                form.editedBy = {
                    user: ObjectId(userId),
                    date: new Date(),
                };

                form.save((err, model) => {
                    cb(err);
                });
            };

            const getVisibilityForm = (cb) => {
                const aggregateHelper = new AggregationHelper($defProjection);

                getAllAggregate({
                    aggregateHelper,
                    queryObject: {
                        _id: objectId(id),
                    },
                    isMobile: req.isMobile
                }, (err, result) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, result[0]);
                });
            };

            async.waterfall([

                updateVisibilityForm,
                fetchSetFileId,
                getVisibilityForm,

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getEditAccess(req, ACL_MODULES.VISIBILITY_FORM, cb);
            },

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.VISIBILITYFORM, 'update', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.updateAfter = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const id = req.params.id;
        const body = req.body;

        const queryRun = (body, callback) => {
            if (!VALIDATION.OBJECT_ID.test(id)) {
                const error = new Error('Invalid parameter id');

                error.status = 400;
                return next(error);
            }

            const updateVisibilityForm = (cb) => {
                VisibilityFormModel.findById(id, (err, model) => {
                    if (err) {
                        return cb(err);
                    }

                    if (body.after) {
                        model.after = body.after;
                    }

                    if (body.branches && body.branches.length) {
                        _.each(body.branches, (elem) => {
                            let existingBranch = _.find(model.branches, item => item.branchId.toString() === elem.branchId);

                            if (existingBranch) {
                                existingBranch.after = elem.after;
                            } else {
                                model.branches.push({
                                    branchId: elem.branchId,
                                    after   : elem.after
                                });
                            }
                        });
                    }

                    cb(null, model);
                });
            };

            const registerEvent = (options) => {
                const {
                    formId,
                    objectiveId,
                    setFileId,
                } = options;

                const exec = (options) => {
                    const {
                        query,
                        functionName,
                    } = options;

                    async.waterfall([

                        (cb) => {
                            ObjectiveModel.findOne(query)
                                .lean()
                                .exec((err, objective) => {
                                    if (err) {
                                        return cb(err);
                                    }

                                    if (!objective) {
                                        return cb('Objective not registered');
                                    }

                                    cb();
                                });
                        },

                        (cb) => {
                            const dueDate = new Date();

                            dueDate.setSeconds(dueDate.getSeconds() + 10);
                            SchedulerRequest.post({
                                json : {
                                    date: dueDate.getSeconds(),
                                },
                            }, cb);
                        },

                        (response, cb) => {
                            const delayedTask = new SchedulerModel();
                            const data = {
                                scheduleId: response.id,
                                functionName,
                                args: {
                                    objectiveId,
                                    visibilityFormId: ObjectId(formId),
                                    setFileId,
                                    actionOriginator: ObjectId(userId),
                                    accessRoleLevel,
                                },
                            };

                            delayedTask.set(data);
                            delayedTask.save(cb);
                        }

                    ]);
                };

                exec({
                    query: {
                        _id: ObjectId(objectiveId),
                        'form._id': ObjectId(formId),
                        'form.contentType': 'visibility',
                    },
                    functionName: 'emitObjectiveUpdated',
                });
            };

            const fetchSetFileId = (form, cb) => {
                const setBranchesAfterFiles = [];

                form.branches.forEach(branch => {
                    branch.after.files &&
                    branch.after.files.forEach(file => {
                        setBranchesAfterFiles.push(file);
                    })
                });
                const setAfterFiles = form.after.files;
                const setFileId = _.union(setBranchesAfterFiles, setAfterFiles);
                const setCompactFileId = _.compact(setFileId);

                if (setCompactFileId.length) {
                    registerEvent({
                        formId: id,
                        objectiveId: form.objective,
                        setFileId: setCompactFileId,
                    });
                }

                form.editedBy = {
                    user: ObjectId(userId),
                    date: new Date(),
                };

                form.save((err, model) => {
                    cb(err);
                });
            };

            const getVisibilityForm = (cb) => {
                const aggregateHelper = new AggregationHelper($defProjection);

                getAllAggregate({
                    aggregateHelper,
                    queryObject: {
                        _id: objectId(id),
                    },
                    isMobile: req.isMobile
                }, (err, result) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, result[0]);
                });
            };

            async.waterfall([

                updateVisibilityForm,
                fetchSetFileId,
                getVisibilityForm,

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getEditAccess(req, ACL_MODULES.VISIBILITY_FORM, cb);
            },

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.VISIBILITYFORM, 'update', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            const isMobile = req.isMobile;
            const id = req.params.id;

            if (!VALIDATION.OBJECT_ID.test(id)) {
                const error = new Error('Invalid parameter id');
                error.status = 400;
                return next(error);
            }

            getAllAggregate({
                aggregateHelper: new AggregationHelper($defProjection),
                queryObject    : {_id: objectId(id)},
                isMobile       : isMobile
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
        }

        access.getReadAccess(req, ACL_MODULES.VISIBILITY_FORM, function (err) {
            if (err) {
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