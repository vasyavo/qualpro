var Comment = function (db, redis, event) {
    var mongoose = require('mongoose');
    var async = require('async');
    var _ = require('lodash');
    var moment = require('moment');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var modelAndSchemaName = CONTENT_TYPES.COMMENT;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);
    var ObjectiveModel = db.model(CONTENT_TYPES.OBJECTIVES, mongoose.Schemas[CONTENT_TYPES.OBJECTIVES]);
    var CompetitorBrandingModel = db.model(CONTENT_TYPES.COMPETITORBRANDING, mongoose.Schemas[CONTENT_TYPES.COMPETITORBRANDING]);
    var CompetitorBrandingItemModel = db.model(CONTENT_TYPES.BRANDINGANDDISPLAYITEMS, mongoose.Schemas[CONTENT_TYPES.BRANDINGANDDISPLAYITEMS]);
    var CompetitorPromotionModel = db.model(CONTENT_TYPES.COMPETITORPROMOTION, mongoose.Schemas[CONTENT_TYPES.COMPETITORPROMOTION]);
    var PromotionsItemsModel = db.model(CONTENT_TYPES.PROMOTIONSITEMS, mongoose.Schemas[CONTENT_TYPES.PROMOTIONSITEMS]);
    var PromotionsModel = db.model(CONTENT_TYPES.PROMOTIONS, mongoose.Schemas[CONTENT_TYPES.PROMOTIONS]);
    var FilesModel = db.model(CONTENT_TYPES.FILES, mongoose.Schemas[CONTENT_TYPES.FILES]);
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var access = require('../helpers/access')(db);
    var bodyValidator = require('../helpers/bodyValidator');
    var self = this;
    var ObjectId = mongoose.Types.ObjectId;

    var $defProjection = {
        _id        : 1,
        body       : 1,
        taskId     : 1,
        attachments: 1,
        isArchived : 1,
        createdBy  : 1,
        editedBy   : 1
    };

    this.commentCreator = function (saveObj, ContextModel, callback) {
        async.waterfall([
            function (waterfallCb) {
                if (!saveObj.files) {
                    return waterfallCb(null, []);
                }

                fileHandler.uploadFile(saveObj.userId, saveObj.files, CONTENT_TYPES.COMMENT, function (err, filesIds) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    waterfallCb(null, filesIds);
                });
            },
            function (filesIds, waterfallCb) {
                var createdBy = {
                    date: new Date(),
                    user: saveObj.userId
                };
                Model.create({
                    body       : saveObj.text,
                    taskId     : saveObj.objectiveId,
                    attachments: filesIds,
                    createdBy  : createdBy,
                    editedBy   : createdBy
                }, function (err, comment) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    waterfallCb(null, comment);
                });
            }
        ], callback);
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var ACTIVITY_TYPES = require('../constants/activityTypes');
            var context = body.context;
            var isMobile = req.isMobile;
            var userId = req.session.uId;
            var ContextModel;
            var saveObj = {
                text       : body.commentText,
                objectiveId: body.objectiveId,
                userId     : req.session.uId,
                files      : req.files
            };
            var mid;
            var error;
            if (saveObj.commentText) {
                saveObj.commentText = _.escape(saveObj.commentText);
            }

            if (!context) {
                error = new Error();
                error.status = 400;
                error.message = 'No context';

                return next(error);
            }

            switch (context) {
                case CONTENT_TYPES.BRANDINGANDDISPLAYITEMS:
                    ContextModel = CompetitorBrandingItemModel;
                    mid = 40;
                    break;
                case CONTENT_TYPES.COMPETITORBRANDING:
                    ContextModel = CompetitorBrandingModel;
                    mid = 34;
                    break;
                case CONTENT_TYPES.COMPETITORPROMOTION:
                    ContextModel = CompetitorPromotionModel;
                    mid = 32;
                    break;
                case CONTENT_TYPES.PROMOTIONSITEMS:
                    ContextModel = PromotionsItemsModel;
                    mid = 35;
                    break;
                case CONTENT_TYPES.PROMOTIONS:
                    ContextModel = PromotionsModel;
                    mid = 33;
                    break;
                case CONTENT_TYPES.OBJECTIVES:
                    ContextModel = ObjectiveModel;
                    mid = 7;
                    break;
                case CONTENT_TYPES.INSTORETASKS:
                    ContextModel = ObjectiveModel;
                    mid = 18;
                    break;
            }

            if (ContextModel) {
                async.waterfall([
                    function (waterfallCb) {
                        self.commentCreator(saveObj, ContextModel, waterfallCb);
                    },
                    function (comment, waterfallCb) {
                        var pipeLine = [];
                        var aggregateHelper;
                        var aggregation;

                        aggregateHelper = new AggregationHelper($defProjection);

                        pipeLine.push({
                            $match: {
                                _id: comment._id
                            }
                        });

                        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                            from         : 'files',
                            key          : 'attachments',
                            addProjection: ['contentType', 'originalName']
                        }));

                        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                            from           : 'personnels',
                            key            : 'createdBy.user',
                            isArray        : false,
                            addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['accessRole']),
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
                        }

                        pipeLine.push({
                            $project: aggregateHelper.getProjection({
                                createdBy: {
                                    user    : 1,
                                    date    : 1,
                                    diffDate: {
                                        $let: {
                                            vars: {
                                                dateNow   : new Date(),
                                                createDate: '$createdBy.date'
                                            },
                                            in  : {$subtract: ['$$dateNow', '$$createDate']}
                                        }
                                    }
                                }
                            })
                        });

                        aggregation = Model.aggregate(pipeLine);

                        aggregation.options = {
                            'allowDiskUse': true
                        };

                        aggregation.exec(function (err, response) {
                            var options = {
                                data: {}
                            };
                            var personnelIds = [];
                            var fileIds;
                            var keys;
                            if (err) {
                                return waterfallCb(err);
                            }

                            response = response[0] ? response[0] : {};
                            keys = Object.keys(response);

                            if (!keys.length) {
                                return waterfallCb(null, response);
                            }

                            personnelIds.push(response.createdBy.user._id);
                            fileIds = _.map(response.attachments, '_id');
                            options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                            options.data[CONTENT_TYPES.FILES] = fileIds;

                            getImagesHelper.getImages(options, function (err, result) {
                                var fieldNames = {};
                                var setOptions;
                                if (err) {
                                    return waterfallCb(err);
                                }

                                setOptions = {
                                    response  : response,
                                    imgsObject: result
                                };
                                fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                                fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                                setOptions.fields = fieldNames;

                                getImagesHelper.setIntoResult(setOptions, function (response) {
                                    waterfallCb(null, response);
                                })
                            });
                        });
                    },
                    function (comment, waterfallCb) {
                        ContextModel.findByIdAndUpdate(saveObj.objectiveId, {
                            $push: {comments: comment._id},
                            $set : {
                                editedBy: {
                                    user: ObjectId(userId),
                                    date: new Date()
                                }
                            }
                        }, function (err) {
                            if (err) {
                                return waterfallCb(err);
                            }

                            event.emit('activityChange', {
                                module     : mid,
                                actionType : ACTIVITY_TYPES.COMMENTED,
                                createdBy  : comment.createdBy,
                                itemId     : saveObj.objectiveId,
                                itemType   : context,
                                itemDetails: CONTENT_TYPES.COMMENT
                            });

                            waterfallCb(null, comment);
                        });
                    }
                ], function (err, comment) {
                    if (err) {
                        return next(err);
                    }

                    if (comment.body) {
                        comment.body = _.unescape(comment.body);
                    }

                    res.status(201).send(comment);
                });
            } else {
                error = new Error();
                error.status(404);
                error.message('Model for comments not found');

                next(error);
            }
        }

        access.getWriteAccess(req, 1010, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMMENT, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    function getAllPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var forSync = options.forSync;
        var isMobile = options.isMobile;
        var skip = options.skip;
        var limit = options.limit;
        var pipeLine = [];

        pipeLine.push({
            $match: queryObject
        });

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'files',
                key          : 'attachments',
                isArray      : true,
                addProjection: ['contentType', 'originalName', 'extension']
            }));
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'editedBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
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

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                createdBy: {
                    user    : 1,
                    date    : 1,
                    diffDate: {
                        $let: {
                            vars: {
                                dateNow   : new Date(),
                                createDate: '$createdBy.date'
                            },

                            in: {$subtract: ['$$dateNow', '$$createDate']}
                        }
                    }
                }
            })
        });

       /* pipeLine.push({
            $sort: {'createdBy.date': -1}
        });

        if (limit && limit !== -1) {
            pipeLine.push({
                $skip: skip
            });

            pipeLine.push({
                $limit: limit
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

        pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            skip             : skip,
            limit            : limit
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun() {
            var query = req.query;
            var isMobile = req.isMobile;
            var objectiveId = [query.objectiveId] || [];
            var context = query.context;
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper;

            aggregateHelper = new AggregationHelper($defProjection);

            async.waterfall([
                function (waterfallCb) {
                    var key;
                    if (!context || [CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS].indexOf(context) === -1 && !isMobile) {
                        return waterfallCb(null);
                    }
                    key = req.session.id + '.' + context;
                    redis.cacheStore.readFromStorage(key, function (err, value) {
                        var valueJSON;
                        if (err) {
                            return waterfallCb(err);
                        }

                        if (value) {
                            valueJSON = JSON.parse(value);
                        }
                        if (valueJSON && valueJSON.objectiveIds) {
                            objectiveId = _.union(valueJSON.objectiveIds, objectiveId);
                        }

                        return waterfallCb(null);

                    });
                },
                function (waterfallCb) {
                    var aggregation;
                    var queryObject = {
                        taskId: {
                            $in: objectiveId.objectID()
                        }
                    };
                    var pipeLine;

                    if (!objectiveId.length) {
                        return waterfallCb(null, {data: [], total: 0});
                    }

                    aggregateHelper.setSyncQuery(queryObject, lastLogOut);

                    pipeLine = getAllPipeline({
                        aggregateHelper: aggregateHelper,
                        queryObject    : queryObject,
                        forSync        : true,
                        isMobile       : req.isMobile
                    });

                    aggregation = Model.aggregate(pipeLine);

                    aggregation.options = {
                        'allowDiskUse': true
                    };

                    aggregation.exec(function (err, response) {
                        var options = {
                            data: {}
                        };
                        var personnelIds = [];
                        var fileIds = [];
                        if (err) {
                            return waterfallCb(err);
                        }

                        response = response && response[0] ? response[0] : {data: [], total: 0};

                        if (response && response.data && response.data.length) {
                            response.data = _.map(response.data, function (comment) {
                                if (comment.body) {
                                    comment.body = _.unescape(comment.body);
                                }
                                personnelIds.push(comment.createdBy.user._id);
                                fileIds = _.union(fileIds, _.map(comment.attachments, '_id'));

                                return comment;
                            });
                        }

                        if (!response.data.length) {
                            return waterfallCb(null, response);
                        }

                        personnelIds = _.uniqBy(personnelIds, 'id');
                        options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                        options.data[CONTENT_TYPES.FILES] = fileIds;

                        getImagesHelper.getImages(options, function (err, result) {
                            var fieldNames = {};
                            var setOptions;
                            if (err) {
                                return waterfallCb(err);
                            }

                            setOptions = {
                                response  : response,
                                imgsObject: result
                            };
                            fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                            fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                            setOptions.fields = fieldNames;

                            getImagesHelper.setIntoResult(setOptions, function (response) {
                                waterfallCb(null, response);
                            })
                        });
                    });
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: result});
            });
        }

        access.getReadAccess(req, 1010, function (err, allowed) {
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
            var query = req.query;
            var isMobile = req.isMobile;
            var objectiveId = [query.objectiveId] || [];
            var context = query.context;
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var aggregateHelper;

            aggregateHelper = new AggregationHelper($defProjection);

            async.waterfall([
                function (waterfallCb) {
                    var key;
                    if (!context || [CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS].indexOf(context) === -1 && !isMobile) {
                        return waterfallCb(null);
                    }
                    key = req.session.id + '.' + context;
                    redis.cacheStore.readFromStorage(key, function (err, value) {
                        var valueJSON;
                        if (err) {
                            return waterfallCb(err);
                        }

                        if (value) {
                            valueJSON = JSON.parse(value);
                        }
                        if (valueJSON && valueJSON.objectiveIds) {
                            objectiveId = _.union(valueJSON.objectiveIds, objectiveId);
                        }

                        return waterfallCb(null);

                    });
                },
                function (waterfallCb) {
                    var queryObject;
                    var pipeLine;
                    var aggregation;

                    if (!objectiveId.length) {
                        return waterfallCb(null, {data: [], total: 0});
                    }

                    queryObject = {
                        taskId: {
                            $in: objectiveId.objectID()
                        }
                    };

                    pipeLine = getAllPipeline({
                        aggregateHelper: aggregateHelper,
                        queryObject    : queryObject,
                        isMobile       : isMobile,
                        skip           : skip,
                        limit          : limit
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
                            return waterfallCb(err);
                        }

                        response = response && response[0] ? response[0] : {data: [], total: 0};

                        if (response && response.data && response.data.length) {
                            response.data = _.map(response.data, function (comment) {
                                if (comment.body) {
                                    comment.body = _.unescape(comment.body);
                                }
                                personnelIds.push(comment.createdBy.user._id);
                                fileIds = _.union(fileIds, _.map(comment.attachments, '_id'));

                                return comment;
                            });
                        }

                        if (!response.data.length) {
                            return waterfallCb(null, response);
                        }

                        personnelIds = _.uniqBy(personnelIds, 'id');
                        options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                        options.data[CONTENT_TYPES.FILES] = fileIds;

                        getImagesHelper.getImages(options, function (err, result) {
                            var fieldNames = {};
                            var setOptions;
                            if (err) {
                                return waterfallCb(err);
                            }

                            setOptions = {
                                response  : response,
                                imgsObject: result
                            };
                            fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                            fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                            setOptions.fields = fieldNames;

                            getImagesHelper.setIntoResult(setOptions, function (response) {
                                waterfallCb(null, response);
                            })
                        });
                    });
                }
            ], function (err, comments) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: comments});
            });
        }

        access.getReadAccess(req, 1010, function (err, allowed) {
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

    this.getAllWithAttachments = function (req, res, next) {
        function queryRun() {
            var objectiveId = req.query.objectiveId;
            var context = req.query.context;
            var aggregateHelper;
            var ContextModel;
            var isMobile = req.isMobile;

            switch (context) {
                case CONTENT_TYPES.BRANDINGANDDISPLAYITEMS:
                    ContextModel = CompetitorBrandingItemModel;
                    break;
                case CONTENT_TYPES.COMPETITORBRANDING:
                    ContextModel = CompetitorBrandingModel;
                    break;
                case CONTENT_TYPES.COMPETITORPROMOTION:
                    ContextModel = CompetitorPromotionModel;
                    break;
                case CONTENT_TYPES.PROMOTIONSITEMS:
                    ContextModel = PromotionsItemsModel;
                    break;
                case CONTENT_TYPES.PROMOTIONS:
                    ContextModel = PromotionsModel;
                    break;
                default:
                    ContextModel = ObjectiveModel;
                    break;
            }
            async.waterfall([
                function (waterfallCb) {
                    ContextModel.findById(objectiveId, function (err, objective) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        waterfallCb(null, objective || {});
                    });
                },
                function (objective, waterfallCb) {
                    var pipeLine = [];
                    var aggregation;

                    aggregateHelper = new AggregationHelper($defProjection);

                    pipeLine.push({
                        $match: {
                            _id: {
                                $in: objective.comments
                            }
                        }
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from         : 'files',
                        key          : 'attachments',
                        isArray      : true,
                        addProjection: ['contentType', 'originalName', 'extension']
                    }));

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

                    pipeLine.push({
                        $project: aggregateHelper.getProjection({
                            createdBy: {
                                user    : 1,
                                date    : 1,
                                diffDate: {
                                    $let: {
                                        vars: {
                                            dateNow   : new Date(),
                                            createDate: '$createdBy.date'
                                        },
                                        in  : {$subtract: ['$$dateNow', '$$createDate']}
                                    }
                                }
                            }
                        })
                    });

                    pipeLine.push({
                        $sort: {'createdBy.date': -1}
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

                    pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

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
                            return waterfallCb(err);
                        }

                        response = response && response[0] ? response[0] : {data: [], total: 0};

                        if (response && response.data && response.data.length) {
                            response.data = _.map(response.data, function (comment) {
                                if (comment.body) {
                                    comment.body = _.unescape(comment.body);
                                }
                                personnelIds.push(comment.createdBy.user._id);
                                fileIds = _.union(fileIds, _.map(comment.attachments, '_id'));

                                return comment;
                            });
                        }

                        if (!response.data.length) {
                            return waterfallCb(null, response);
                        }

                        personnelIds = _.uniqBy(personnelIds, 'id');
                        options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                        options.data[CONTENT_TYPES.FILES] = fileIds;

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
                            fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                            setOptions.fields = fieldNames;

                            getImagesHelper.setIntoResult(setOptions, function (response) {
                                waterfallCb(null, response);
                            })
                        });
                    });
                }
            ], function (err, comments) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: comments});
            });
        }

        access.getReadAccess(req, 1010, function (err, allowed) {
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
            var commentId = req.params.id;

            async.waterfall([
                function (cb) {
                    Model.findById(commentId, function (err, commentModel) {
                        var error;
                        var attachments;

                        if (err) {
                            return cb(err);
                        }

                        if (!commentModel) {
                            error = new Error('Comment not found');
                            error.status = 400;
                            return cb(error);
                        }
                        if (commentModel.body) {
                            commentModel.body = _.unescape(commentModel.body);
                        }
                        attachments = commentModel.get('attachments');

                        cb(null, attachments);
                    });
                },
                function (attachments, cb) {
                    FilesModel
                        .find({_id: {$in: attachments}}, function (err, filesModelsArray) {
                            if (err) {
                                return cb(err);
                            }

                            filesModelsArray = filesModelsArray.map(function (fileModel) {
                                var jsonFile = fileModel.toJSON();

                                jsonFile.url = fileHandler.computeUrl(jsonFile.name, CONTENT_TYPES.COMMENT);

                                return jsonFile;
                            });

                            return cb(null, filesModelsArray);
                        });
                }
            ], function (err, filesModelsArray) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(filesModelsArray);
            });
        }

        access.getReadAccess(req, 1010, function (err, allowed) {
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

    this.saveToRedis = function (req, res, next) {
        var body = req.body;
        var sessionId;
        var objectToSave;
        var key;
        var err;

        if (!body.ids) {
            err = new Error(500);
            return next(err);
        }
        sessionId = req.session.id;
        key = sessionId + '.' + body.type;
        objectToSave = {
            objectiveIds: body.ids
        };
        redis.cacheStore.writeToStorage(key, JSON.stringify(objectToSave), '864000');

        res.status(200).send();
    };
};
module.exports = Comment;
