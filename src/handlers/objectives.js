var Objectives = function (db, redis, event) {
    var async = require('async');
    var _ = require('underscore');
    var lodash = require('lodash');
    var mongoose = require('mongoose');
    var ACL_CONSTANTS = require('../constants/aclRolesNames');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var VALIDATION = require('../public/js/constants/validation.js');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var CONSTANTS = require('../constants/mainConstants');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImageHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImageHelper(db);
    var ObjectiveModel = require('./../types/objective/model');
    var PersonnelModel = require('./../types/personnel/model');
    var ObjectiveHistoryModel = require('./../types/objectiveHistory/model');
    var FilterMapper = require('../helpers/filterMapper');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var access = require('../helpers/access')(db);
    var ObjectId = mongoose.Types.ObjectId;
    var FileModel = require('./../types/file/model');
    var DistributionFormHandler = require('../handlers/distributionForm');
    var VisibilityFormHandler = require('../handlers/visibilityForm');
    var distributionFormHandler = new DistributionFormHandler(db);
    var visibilityFormHandler = new VisibilityFormHandler(db);
    var bodyValidator = require('../helpers/bodyValidator');
    var coveredByMe = require('../helpers/coveredByMe');
    var logWriter = require('../helpers/logWriter');
    var self = this;

    var $defProjection = {
        _id              : 1,
        title            : 1,
        companyObjective : 1,
        description      : 1,
        objectiveType    : 1,
        priority         : 1,
        status           : 1,
        assignedTo       : 1,
        complete         : 1,
        parent           : 1,
        level            : 1,
        countSubTasks    : 1,
        completedSubTasks: 1,
        dateStart        : 1,
        dateEnd          : 1,
        dateClosed       : 1,
        comments         : 1,
        attachments      : 1,
        editedBy         : 1,
        createdBy        : 1,
        country          : 1,
        region           : 1,
        subRegion        : 1,
        retailSegment    : 1,
        outlet           : 1,
        branch           : 1,
        location         : 1,
        form             : 1,
        efforts          : 1,
        context          : 1,
        creationDate     : 1,
        updateDate       : 1,
        archived         : 1
    };

    function createSubObjective(options, callback) {
        options = options || {};
        var parentId = options.parentId;
        var files = options.files;
        var assignedToIds = options.assignedToIds;
        var createdById = options.createdById;
        var isMobile = options.isMobile;
        var companyObjective;
        var description;
        var parent;
        var title;
        var model;
        var subObjective;
        var createdBy;
        var dateStart;
        var dateEnd;
        var priority;
        var newAttachments;
        var newCountSubTasks;
        var newProgress;
        var parentIds;
        var level = options.level;
        var saveObjective = options.saveObjective;
        var attachments = options.attachments || [];
        var error;
        var formType = options.formType;
        var newObjectiveId;

        if (!parentId || !createdById) {
            error = new Error('Not enough params');
            error.status = 400;
            return callback(error);
        }

        if (!assignedToIds.length) {
            error = new Error('Not enough params');
            error.status = 400;
            return callback(error);
        }

        async.waterfall([

            function (cb) {
                if (!files) {
                    return cb(null, []);
                }

                // TODO: change bucket from constants
                fileHandler.uploadFile(createdById, files, 'objectives', function (err, filesIds) {
                    if (err) {
                        return cb(err, null);
                    }

                    cb(null, filesIds);
                });
            },

            function (filesIds, cb) {
                ObjectiveModel
                    .findById(parentId, function (err, parentObjectiveModel) {
                        var error;

                        if (err) {
                            return cb(err, null);
                        }

                        if (!parentObjectiveModel) {
                            error = new Error('Objective not found');
                            error.status = 400;

                            return cb(error, null);
                        }

                        companyObjective = options.companyObjective || parentObjectiveModel.companyObjective;
                        description = options.description;
                        parent = parentObjectiveModel.parent;
                        title = options.title;
                        createdBy = {
                            user: createdById,
                            date: new Date()
                        };
                        dateStart = options.dateStart || parentObjectiveModel.dateStart;
                        dateEnd = options.dateEnd || parentObjectiveModel.dateEnd;
                        priority = options.priority || parentObjectiveModel.priority;
                        attachments = attachments.objectID();
                        newAttachments = attachments.concat(filesIds);

                        cb(null, parentObjectiveModel);
                    });
            },

            function (parentObjectiveModel, cb) {
                subObjective = {
                    objectiveType: parentObjectiveModel.objectiveType,
                    priority     : priority,
                    status       : saveObjective ? OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS,
                    assignedTo   : assignedToIds || [],
                    level        : level,
                    dateStart    : dateStart,
                    dateEnd      : dateEnd,
                    createdBy    : createdBy,
                    editedBy     : createdBy,
                    attachments  : newAttachments,
                    location     : options.location,
                    country      : options.country,
                    region       : options.region,
                    subRegion    : options.subRegion,
                    retailSegment: options.retailSegment,
                    outlet       : options.outlet,
                    branch       : options.branch
                };

                if (!formType && parentObjectiveModel.form) {
                    subObjective.form = parentObjectiveModel.form;
                }

                if (title && (title.en || title.ar)) {
                    subObjective.title = {
                        en: _.escape(title.en),
                        ar: _.escape(title.ar)
                    };
                }

                if (description && (description.en || description.ar)) {
                    subObjective.description = {
                        en: _.escape(description.en),
                        ar: _.escape(description.ar)
                    };
                }

                if (parent) {
                    subObjective.parent = {
                        1: parent['1'] || null,
                        2: parent['2'] || null,
                        3: parent['3'] || null,
                        4: parent['4'] || null
                    };

                    if (parentObjectiveModel.level && parentObjectiveModel.level <= ACL_CONSTANTS.AREA_IN_CHARGE) {
                        subObjective.parent[parentObjectiveModel.get('level')] = parentObjectiveModel.get('_id');
                    }
                }

                if (companyObjective && subObjective.parent && (companyObjective.en || companyObjective.ar)) {
                    subObjective.companyObjective = {
                        en: _.escape(companyObjective.en),
                        ar: _.escape(companyObjective.ar)
                    };
                }

                cb(null, subObjective, parentObjectiveModel);
            },

            function (saveData, parentObjectiveModel, cb) {
                model = new ObjectiveModel(saveData);
                model.save(function (err, objective) {
                    if (err) {
                        return cb(err);
                    }
                    newObjectiveId = objective._id;
                    event.emit('activityChange', {
                        module    : ACL_MODULES.OBJECTIVE,
                        actionType: ACTIVITY_TYPES.CREATED,
                        createdBy : createdBy,
                        itemId    : newObjectiveId,
                        itemType  : CONTENT_TYPES.OBJECTIVES
                    });

                    parentObjectiveModel.save(function (err) {
                        if (err) {
                            return cb(err);
                        }
                        event.emit('activityChange', {
                            module    : ACL_MODULES.OBJECTIVE,
                            actionType: ACTIVITY_TYPES.UPDATED,
                            createdBy : createdBy,
                            itemId    : parentObjectiveModel._id,
                            itemType  : CONTENT_TYPES.OBJECTIVES
                        });

                        cb(null, objective);
                    });
                });
            },

            function (objectiveModel, cb) {
                var data;

                if (!formType && formType !== 'distribution' && formType !== 'visibility') {
                    return cb(null, objectiveModel);
                }

                if (formType === 'distribution') {
                    data = {
                        objective: objectiveModel.get('_id')
                    };

                    distributionFormHandler.createForm(createdById, data, function (err, formModel) {
                        if (err) {
                            return cb(err);
                        }

                        objectiveModel.form = {
                            _id        : formModel.get('_id'),
                            contentType: formType
                        };

                        cb(null, objectiveModel);
                    });
                } else {
                    data = {
                        objective  : objectiveModel.get('_id'),
                        description: ''
                    };
                    visibilityFormHandler.createForm(createdById, data, null, function (err, formModel) {
                        if (err) {
                            return cb(err);
                        }

                        objectiveModel.form = {
                            _id        : formModel.get('_id'),
                            contentType: formType
                        };

                        cb(null, objectiveModel);
                    });
                }
            },

            function (objectiveModel, cb) {
                if (!formType) {
                    return cb(null, objectiveModel);
                }

                objectiveModel.save(function (err) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, objectiveModel);
                });
            },

            function (objectiveModel, cb) {
                var nextParent;
                var objectiveModelClone = _.extend({}, objectiveModel.toObject());
                var level = objectiveModelClone.level;
                var parents = objectiveModelClone.parent;

                var seriesTasks = [];

                function updateParentObjective(id, seriesCb) {
                    async.waterfall([
                        function (waterFallCB) {
                            ObjectiveModel.findById(id, function (err, parentModel) {
                                if (err) {
                                    return waterFallCb(err);
                                }

                                if (!parentModel) {
                                    return waterFallCB('Parent objective not found');
                                }

                                waterFallCB(null, parentModel);
                            });
                        },

                        function (parentModel, waterFallCB) {
                            var query = {
                                level: parseInt(parentModel.level, 10) + 1
                            };

                            query['parent.' + parentModel.level] = parentModel._id;

                            ObjectiveModel.find(query, function (err, childModels) {
                                var complete;

                                parentModel.countSubTasks = _.filter(childModels, function (model) {
                                    return model.status !== 'draft';
                                }).length;
                                parentModel.completedSubTasks = _.filter(childModels, function (model) {
                                    return model.status === 'completed';
                                }).length;

                                complete = Math.floor(parentModel.completedSubTasks * 100 / parentModel.countSubTasks);

                                if (isNaN(complete) || !isFinite(complete)) {
                                    parentModel.complete = 0;
                                } else {
                                    parentModel.complete = complete;
                                }

                                if (parentModel.complete >= 100 && parentModel.status === OBJECTIVE_STATUSES.RE_OPENED) {
                                    parentModel.status = OBJECTIVE_STATUSES.CLOSED;
                                }

                                if (parentModel.complete < 100 && parentModel.status === OBJECTIVE_STATUSES.CLOSED) {
                                    parentModel.status = OBJECTIVE_STATUSES.RE_OPENED;
                                }

                                waterFallCB(null, parentModel);
                            });
                        }

                    ], function (err, parentModel) {
                        if (err) {
                            return seriesCb(err);
                        }

                        parentModel.save(function (err) {
                            if (err) {
                                return seriesCb(err);
                            }
                            event.emit('activityChange', {
                                module    : 7,
                                actionType: ACTIVITY_TYPES.UPDATED,
                                createdBy : createdBy,
                                itemId    : parentModel._id,
                                itemType  : CONTENT_TYPES.OBJECTIVES
                            });
                            seriesCb(null);
                        });
                    });
                }

                for (var i = level - 1; i >= 1; i--) {
                    nextParent = parents[i];
                    if (nextParent) {
                        seriesTasks.push(
                            async.apply(updateParentObjective, nextParent)
                        );
                    }
                }

                async.series(seriesTasks, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    parentIds = _.compact(_.values(parents));
                    cb(null, parents);
                });
            },

            function (parents, cb) {
                if (isMobile) {
                    return cb(null, null);
                }
                coveredByMe(PersonnelModel, ObjectId(options.createdById), cb);
            },

            function (coveredIds, cb) {
                if (isMobile) {
                    newObjectiveId = ObjectId(newObjectiveId);
                    self.getByIdAggr({id: newObjectiveId, isMobile: isMobile}, function (err, result) {
                        if (err) {
                            return cb(err);
                        }
                        return cb(null, result);
                    });
                } else {
                    var pipeLine;
                    var aggregation;
                    var queryObject = {
                        _id: {
                            $in: parentIds
                        }
                    };
                    var aggregateHelper = new AggregationHelper($defProjection);

                    pipeLine = getAllPipeline({
                        aggregateHelper: aggregateHelper,
                        queryObject    : queryObject,
                        isMobile       : isMobile,
                        forSync        : true,
                        coveredIds     : coveredIds
                    });

                    aggregation = ObjectiveModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, response) {
                        var idsPersonnel = [];
                        var idsFile = [];
                        var options = {
                            data: {}
                        };
                        if (err) {
                            return cb(err);
                        }
                        response = response ? response[0] : {data: [], total: 0};

                        if(!response.data.length){
                            return cb(null, response);
                        }

                        response.data = _.map(response.data, function (model) {
                            if (model.title) {
                                model.title = {
                                    en: model.title.en ? _.unescape(model.title.en) : '',
                                    ar: model.title.ar ? _.unescape(model.title.ar) : ''
                                };
                            }
                            if (model.description) {
                                model.description = {
                                    en: model.description.en ? _.unescape(model.description.en) : '',
                                    ar: model.description.ar ? _.unescape(model.description.ar) : ''
                                };
                            }
                            if (model.companyObjective) {
                                model.companyObjective = {
                                    en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                                    ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : ''
                                };
                            }

                            idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                            idsPersonnel.push(model.createdBy.user._id);
                            idsPersonnel = _.union(idsPersonnel, _.map(model.assignedTo, '_id'));

                            return model;
                        });

                        idsPersonnel = lodash.uniqBy(idsPersonnel, 'id');
                        options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
                        options.data[CONTENT_TYPES.FILES] = idsFile;

                        getImagesHelper.getImages(options, function (err, result) {
                            var fieldNames = {};
                            var setOptions;
                            if (err) {
                                return cb(err);
                            }

                            setOptions = {
                                response  : response,
                                imgsObject: result
                            };
                            fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], 'createdBy.user'];
                            fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                            setOptions.fields = fieldNames;

                            getImagesHelper.setIntoResult(setOptions, function (response) {
                                cb(null, response);
                            })
                        });
                    });
                }
            }

        ], function (err, parentCollection) {

            if (err) {
                return callback(err);
            }

            callback(null, parentCollection);
        });
    }

    this.getUrl = function (req, res, next) {
        var imageName = req.params.imageName;
        var url = fileHandler.computeUrl(imageName);

        res.status(200).send(url);
    };

    this.removeFileFromObjective = function (req, res, next) {
        var body = req.body;
        var session = req.session;
        var userId = session.uId;
        var fileId = body.fileId;
        var objectiveId = body.objectiveId;
        var error;
        var fileName;

        if (!objectiveId || !fileId) {
            error = new Error('Not enough params');
            error.status = 400;
            return next(error);
        }

        async.waterfall([

            function (cb) {
                FileModel.findById(fileId, function (err, fileModel) {
                    if (err) {
                        return cb(err, null);
                    }

                    if (!fileModel) {
                        error = new Error('File not found');
                        error.status = 400;
                        return cb(err, null);
                    }

                    fileName = fileModel.get('name');

                    if (userId === fileModel.get('createdBy.user').toString()) {
                        return cb(null, true);
                    }

                    cb(null, false);
                });
            },

            function (removeFile, cb) {
                ObjectiveModel.update(objectiveId, {$pull: {attachments: ObjectId(fileId)}}, function (err) {
                    if (err) {
                        return cb(err);
                    }

                    if (removeFile) {
                        fileHandler.deleteFile(fileName, 'objectives', function (err) {
                            if (err) {
                                return cb(err);
                            }
                        });
                    }

                    cb();
                });
            }

        ], function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send();
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var session = req.session;
            var userId = session.uId;
            var model;
            var saveObjective;
            var objective;
            var error;

            saveObjective = body.saveObjective;

            if (!body.assignedTo || !body.assignedTo.length) {
                error = new Error('You must assign person to task');
                error.status = 400;
                return next(error);
            }

            async.waterfall([

                function (cb) {
                    if (!files) {
                        return cb(null, []);
                    }

                    //TODO: change bucket from constants
                    fileHandler.uploadFile(userId, files, 'objectives', function (err, filesIds) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, filesIds);
                    });
                },

                function (filesIds, cb) {
                    var createdBy = {
                        user: userId,
                        date: new Date()
                    };
                    var status = saveObjective ? OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS;

                    body.title = {
                        en: body.title.en ? _.escape(body.title.en) : '',
                        ar: body.title.ar ? _.escape(body.title.ar) : ''
                    };
                    body.description = {
                        en: body.description.en ? _.escape(body.description.en) : '',
                        ar: body.description.ar ? _.escape(body.description.ar) : ''
                    };

                    objective = {
                        objectiveType: body.objectiveType,
                        priority     : body.priority,
                        status       : status,
                        assignedTo   : body.assignedTo,
                        level        : session.level,
                        dateStart    : body.dateStart,
                        dateEnd      : body.dateEnd,
                        country      : body.country,
                        region       : body.region,
                        subRegion    : body.subRegion,
                        retailSegment: body.retailSegment,
                        outlet       : body.outlet,
                        branch       : body.branch,
                        location     : body.location,
                        attachments  : filesIds,
                        createdBy    : createdBy,
                        editedBy     : createdBy,
                        title        : body.title,
                        description  : body.description
                    };

                    model = new ObjectiveModel(objective);
                    model.save(function (err, model) {
                        if (err) {
                            return cb(err);
                        }

                        event.emit('activityChange', {
                            module    : ACL_MODULES.OBJECTIVE,
                            actionType: ACTIVITY_TYPES.CREATED,
                            createdBy : createdBy,
                            itemId    : model._id,
                            itemType  : CONTENT_TYPES.OBJECTIVES
                        });

                        if (model) {
                            if (model.title) {
                                model.title = {
                                    en: model.title.en ? _.unescape(model.title.en) : '',
                                    ar: model.title.ar ? _.unescape(model.title.ar) : ''
                                }
                            }
                            if (model.description) {
                                model.description = {
                                    en: model.description.en ? _.unescape(model.description.en) : '',
                                    ar: model.description.ar ? _.unescape(model.description.ar) : ''
                                }
                            }
                        }

                        cb(null, model);
                    });
                },

                function (objectiveModel, cb) {
                    var data;

                    if (!body.formType && body.formType !== 'distribution' && body.formType !== 'visibility') {
                        return cb(null, objectiveModel);
                    }

                    if (body.formType === 'distribution') {
                        data = {
                            objective: objectiveModel.get('_id')
                        };

                        distributionFormHandler.createForm(userId, data, function (err, formModel) {
                            if (err) {
                                return cb(err);
                            }

                            objectiveModel.form = {
                                _id        : formModel.get('_id'),
                                contentType: body.formType
                            };

                            cb(null, objectiveModel);
                        });
                    } else {
                        data = {
                            objective  : objectiveModel.get('_id'),
                            description: ''
                        };
                        visibilityFormHandler.createForm(userId, data, null, function (err, formModel) {
                            if (err) {
                                return cb(err);
                            }

                            objectiveModel.form = {
                                _id        : formModel.get('_id'),
                                contentType: body.formType
                            };

                            cb(null, objectiveModel);
                        });
                    }
                },

                function (objectiveModel, cb) {
                    if (!body.formType) {
                        return cb(null, objectiveModel);
                    }

                    objectiveModel.save(function (err) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, objectiveModel);
                    });
                },

                function (objectiveModel, cb) {
                    var id = objectiveModel.get('_id');

                    self.getByIdAggr({id: id, isMobile: req.isMobile}, cb);
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });

        }

        access.getWriteAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.OBJECTIVES, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.update = function (req, res, next) {
        function queryRun(updateObject, body) {
            var files = req.files;
            var attachments = body.attachments;
            var session = req.session;
            var userId = session.uId;
            var objectiveId = req.params.id;
            var description = updateObject.description;
            var title = updateObject.title;

            var fullUpdate = {
                $set: updateObject
            };
            var waterFallTasks = [];

            function updateCover(objective) {
                PersonnelModel.findOne({
                    'vacation.cover': ObjectId(userId),
                    $or             : [
                        {
                            _id               : ObjectId(objective.assignedTo),
                            'vacation.onLeave': true
                        },
                        {
                            _id               : ObjectId(objective.createdBy.user),
                            'vacation.onLeave': true
                        }
                    ]
                }, function (err, personnel) {
                    var history;
                    var objectiveHistory;

                    if (err) {
                        //TODO: need logger
                        return console.log(err);
                    }
                    if (!personnel) {
                        //TODO: need logger
                        return console.log('personnel  not found');
                    }

                    history = {
                        objective: ObjectId(objective._id),
                        person   : ObjectId(userId)
                    };

                    objectiveHistory = new ObjectiveHistoryModel(history);

                    objectiveHistory.save(function (err) {
                        if (err) {
                            // TODO: need logger
                            return console.log(err);
                        }
                    });
                });
            }

            function uploadFiles(waterFallCb) {
                fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, function (err, filesIds) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    waterFallCb(null, filesIds);
                });
            }

            function updateObjective(filesIds, waterFallCb) {
                if (typeof filesIds === 'function') {
                    waterFallCb = filesIds;
                }

                if (updateObject.status && updateObject.status !== OBJECTIVE_STATUSES.CLOSED) {
                    updateObject.complete = updateObject.status === OBJECTIVE_STATUSES.COMPLETED ? 100 : 0;
                }

                updateObject.editedBy = {
                    user: ObjectId(userId),
                    date: new Date()
                };

                if (attachments && attachments.length) {
                    attachments = attachments.objectID();

                    updateObject.attachments = attachments.concat(filesIds);
                } else {
                    delete updateObject.attachments;

                    fullUpdate.$addToSet = {
                        attachments: {
                            $each: filesIds
                        }
                    };
                }

                if (updateObject.title) {
                    delete updateObject.title;

                    updateObject['title.en'] = _.escape(title.en || '');
                    updateObject['title.ar'] = _.escape(title.ar || '');
                }

                if (description) {
                    delete updateObject.description;

                    updateObject['description.en'] = _.escape(description.en || '');
                    updateObject['description.ar'] = _.escape(description.ar || '');
                }

                ObjectiveModel.findOneAndUpdate({_id: objectiveId}, fullUpdate, {new: true}, function (err, objectiveModel) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    if (body.cover) {
                        updateCover(objectiveModel);
                    }

                    if (objectiveModel.status === OBJECTIVE_STATUSES.CLOSED
                        && objectiveModel.objectiveType !== 'individual'
                        && objectiveModel.level === ACL_CONSTANTS.MASTER_ADMIN) {
                        ObjectiveModel
                            .update({
                                'parent.1': objectiveModel._id
                            }, {
                                $set: {'archived': true}
                            }, {
                                multi: true
                            }, function (err, result) {
                                if (err) {
                                    console.log(err);
                                }

                                console.dir(result);
                            });
                    }

                    event.emit('activityChange', {
                        module    : ACL_MODULES.OBJECTIVE,
                        actionType: ACTIVITY_TYPES.UPDATED,
                        createdBy : updateObject.editedBy,
                        itemId    : objectiveId,
                        itemType  : CONTENT_TYPES.OBJECTIVES
                    });

                    waterFallCb(null, objectiveModel);
                });
            }

            function createForms(objectiveModel, waterFallCb) {
                var data;

                function callBack(err, formModel) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    objectiveModel.form = {
                        _id        : formModel.get('_id'),
                        contentType: updateObject.formType
                    };

                    waterFallCb(null, objectiveModel);
                }

                if (updateObject.formType === 'distribution') {
                    data = {
                        objective: objectiveModel.get('_id')
                    };

                    distributionFormHandler.createForm(userId, data, callBack);
                } else {

                    /* TODO fill description from task if AM or AincM will link forms */
                    data = {
                        objective  : objectiveModel.get('_id'),
                        description: ''
                    };

                    visibilityFormHandler.createForm(userId, data, null, callBack);
                }
            }

            function updateObjectiveWithForm(objectiveModel, waterFallCb) {
                if (!updateObject.formType) {
                    return waterFallCb(null, objectiveModel);
                }

                objectiveModel.save(function (err) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    waterFallCb(null, objectiveModel);
                });
            }

            function consoleLogENV(message) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(message);
                }
            }

            function updateParents(objectiveModel, waterFallCb) {
                var nextParent;
                var objectiveModelClone = _.extend({}, objectiveModel.toObject());
                var level = objectiveModelClone.level;
                var parents = objectiveModelClone.parent;

                var seriesTasks = [];

                function updateParentObjective(id, seriesCb) {
                    async.waterfall([
                        function (waterFallCB) {
                            ObjectiveModel.findById(id, function (err, parentModel) {
                                if (err) {
                                    return waterFallCb(err);
                                }

                                if (!parentModel) {
                                    return waterFallCB('Parent objective not found');
                                }

                                waterFallCB(null, parentModel);
                            });
                        },

                        function (parentModel, waterFallCB) {
                            var query = {
                                level: parseInt(parentModel.level, 10) + 1
                            };

                            query['parent.' + parentModel.level] = parentModel._id;

                            ObjectiveModel.find(query, function (err, childModels) {
                                parentModel.countSubTasks = _.filter(childModels, function (model) {
                                    return model.status !== 'draft';
                                }).length;
                                parentModel.completedSubTasks = _.filter(childModels, function (model) {
                                    return model.status === 'completed';
                                }).length;

                                //if (childComplete >= 100) {
                                parentModel.complete = Math.floor(parentModel.completedSubTasks * 100 / parentModel.countSubTasks);
                                //} else {
                                //parentModel.complete = Math.floor((parentModel.completedSubTasks + (childComplete / 100)) * 100 / parentModel.countSubTasks);
                                //}

                                if (parentModel.complete >= 100 && parentModel.status === OBJECTIVE_STATUSES.RE_OPENED) {
                                    parentModel.status = OBJECTIVE_STATUSES.CLOSED;
                                }

                                if (parentModel.complete < 100 && parentModel.status === OBJECTIVE_STATUSES.CLOSED) {
                                    parentModel.status = OBJECTIVE_STATUSES.RE_OPENED;
                                }

                                waterFallCB(null, parentModel);
                            });
                        }/*,

                         function (parentModel, cb) {
                         parentModel
                         .save(function (err) {
                         var nextParent;
                         var i;

                         if (err) {
                         return cb(err);
                         }

                         // nextParent = parentModel.parent[parentModel.level - 1];

                         for (i = 1; i < 4; i++) {
                         if (parentModel.level - i < 1) {
                         break;
                         }

                         nextParent = parentModel.parent[parentModel.level - i];

                         if (nextParent) {
                         break;
                         }
                         }

                         cb(null, parentModel.get('complete'), nextParent);
                         });
                         }*/

                    ], function (err, parentModel) {
                        if (err) {
                            return seriesCb(err);
                        }

                        parentModel.save(function (err) {
                            if (err) {
                                return seriesCb(err);
                            }

                            seriesCb(null);
                        });
                    });
                }

                for (var i = level - 1; i >= 1; i--) {
                    nextParent = parents[i];
                    if (nextParent) {
                        seriesTasks.push(
                            async.apply(updateParentObjective, nextParent)
                        );
                    }
                }

                async.series(seriesTasks, function (err) {
                    if (err) {
                        logWriter.log(err);
                        return consoleLogENV(err);
                    }
                });

                waterFallCb(null, objectiveModel);
            }

            function updateChildObjective(options) {
                var nextObjectiveIds;
                var assignedTo;

                options = options || {};
                nextObjectiveIds = options.nextObjectiveIds;
                assignedTo = options.assignedTo;

                ObjectiveModel.update({_id: {$in: nextObjectiveIds}}, {$set: {'createdBy.user': ObjectId(assignedTo[0])}}, function (err) {
                    if (err) {
                        return consoleLogENV(err);
                    }
                });
            }

            function updateObjectiveByAssigneeLocation(objectiveModel, waterFallCb) {
                var level;
                var objectiveModelId;
                var query = {};

                level = objectiveModel.get('level');
                objectiveModelId = objectiveModel.get('_id');
                query['parent.' + level] = objectiveModelId;

                ObjectiveModel.find(query, function (err, models) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    if (models) {
                        PersonnelModel.findById(updateObject.assignedTo[0], function (err, personnel) {
                            if (err) {
                                return waterFallCb(err);
                            }

                            ObjectiveModel.findByIdAndUpdate(objectiveModelId, {
                                $set: {
                                    country  : personnel.country,
                                    region   : personnel.region,
                                    subRegion: personnel.subRegion,
                                    branch   : personnel.branch
                                }
                            }, function (err) {
                                if (err) {
                                    return waterFallCb(err);
                                }

                                updateChildObjective({
                                    nextObjectiveIds: _.pluck(models, '_id'),
                                    assignedTo      : updateObject.assignedTo
                                });
                            });
                        });
                    }

                    waterFallCb(null, objectiveModel);
                });
            }

            function getResultAndSend(objectiveModel, waterFallCb) {
                var id = objectiveModel.get('_id');

                self.getByIdAggr({id: id, isMobile: req.isMobile}, waterFallCb);
            }

            if (files) {
                waterFallTasks.unshift(uploadFiles);
            }

            waterFallTasks.push(updateObjective);

            if (updateObject.formType) {
                waterFallTasks.push(createForms);

                waterFallTasks.push(updateObjectiveWithForm);
            }

            if (updateObject.status && updateObject.status !== OBJECTIVE_STATUSES.CLOSED) {
                waterFallTasks.push(updateParents);
            }

            if (updateObject.assignedTo && updateObject.assignedTo[0]) {
                waterFallTasks.push(updateObjectiveByAssigneeLocation);
            }

            waterFallTasks.push(getResultAndSend);

            async.waterfall(waterFallTasks, function (err, model) {
                if (err) {
                    return next(err);
                }
                if (model) {
                    if (model.title) {
                        model.title = {
                            en: model.title.en ? _.unescape(model.title.en) : '',
                            ar: model.title.ar ? _.unescape(model.title.ar) : ''
                        }
                    }
                    if (model.description) {
                        model.description = {
                            en: model.description.en ? _.unescape(model.description.en) : '',
                            ar: model.description.ar ? _.unescape(model.description.ar) : ''
                        }
                    }
                }

                res.status(200).send(model);
            });
        }

        access.getEditAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
            var body;
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
                    body = JSON.parse(req.body.data);
                } else {
                    body = req.body;
                }

                updateObject = body.changed;

                if (typeof updateObject === 'string') {
                    updateObject = JSON.parse(updateObject);
                }

                if (typeof body.attachments === 'string') {
                    body.attachments = JSON.parse(body.attachments);
                }
            } catch (err) {
                return next(err);
            }

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.OBJECTIVES, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData, body);
            });
        });
    };

    this.duplicateObjective = function (req, res, next) {
        function queryRun() {
            var objectiveId = body.id;
            var session = req.session;

            ObjectiveModel
                .findById(objectiveId, function (err, objective) {
                    var error;
                    var options;
                    var objectiveJSON;

                    if (err) {
                        return next(err);
                    }

                    if (!objective) {
                        error = new Error('Objective not found');
                        error.status = 400;

                        return next(error);
                    }

                    objectiveJSON = objective.toJSON();

                    options = {
                        objectiveType   : objectiveJSON.objectiveType,
                        priority        : objectiveJSON.priority,
                        status          : OBJECTIVE_STATUSES.DRAFT,
                        //assignedTo: body.assignedTo,
                        level           : session.level,
                        //dateStart: body.dateStart,
                        //dateEnd: body.dateEnd,
                        //country: body.country,
                        //region: body.region,
                        //subRegion: body.subRegion,
                        //retailSegment: body.retailSegment,
                        //outlet: body.outlet,
                        //branch: body.branch,
                        //location: body.location,
                        createdBy       : {
                            user: session.uId,
                            date: Date.now()
                        },
                        title           : objectiveJSON.title,
                        description     : objectiveJSON.description,
                        companyObjective: objectiveJSON.companyObjective
                    };

                    options.description.en = _.unescape(options.description.en);
                    options.description.ar = _.unescape(options.description.ar);

                    req.body = options;

                    self.create(req, res, next);
                });
        }

        access.getWriteAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
                if (err) {
                    return next(err);
                }
                if (!allowed) {
                    err = new Error();
                    err.status = 403;

                    return next(err);
                }

                queryRun();
            }
        );
    };

    this.createSubObjective = function (req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var userId = req.session.uId;
            var level = req.session.level;
            var parentId = body.parentId;
            var error;
            var options = {
                parentId        : parentId,
                assignedToIds   : body.assignedTo,
                createdById     : userId,
                saveObjective   : body.saveObjective,
                companyObjective: body.companyObjective,
                description     : body.description,
                title           : body.title,
                dateStart       : body.dateStart,
                dateEnd         : body.dateEnd,
                priority        : body.priority,
                attachments     : body.attachments,
                files           : files,
                objectiveType   : body.objectiveType,
                location        : body.location,
                country         : body.country,
                region          : body.region,
                subRegion       : body.subRegion,
                retailSegment   : body.retailSegment,
                outlet          : body.outlet,
                branch          : body.branch,
                level           : level,
                formType        : body.formType,
                form            : body.form,
                isMobile        : req.isMobile
            };

            if (!body.assignedTo || !body.assignedTo.length) {
                error = new Error('You must assign person to task');
                error.status = 400;
                return next(error);
            }

            createSubObjective(options, function (err, parent) {
                if (err) {
                    return next(err);
                }
                if (!parent) {
                    return res.status(200).send();
                }
                res.status(200).send(parent);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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
                body = JSON.parse(req.body.data);
            } catch (err) {
                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.OBJECTIVES, 'createSubObjective', function (err, saveData) {
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
        var parentIds = options.parentIds;
        var positionFilter = options.positionFilter;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var coveredIds = options.coveredIds;
        var pipeLine = [];
        var currentUserLevel = options.currentUserLevel;

        if (parentIds && parentIds.length) {
            pipeLine.push({
                $match: {
                    $and: [
                        {
                            $or: [
                                {
                                    'parent.1': {$in: parentIds}
                                },
                                {
                                    'parent.2': {$in: parentIds}
                                },
                                {
                                    'parent.3': {$in: parentIds}
                                },
                                {
                                    'parent.4': {$in: parentIds}
                                }
                            ]
                        },
                        {
                            _id: {$nin: parentIds}
                        }
                    ]
                }
            });

        } else {
            if (queryObject) {
                pipeLine.push({
                    $match: queryObject
                });
            }

            if (isMobile && currentUserLevel && currentUserLevel !== ACL_CONSTANTS.MASTER_ADMIN) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                assignedTo: {$in: coveredIds},
                                status    : {$nin: [OBJECTIVE_STATUSES.DRAFT]}
                            },
                            {
                                'createdBy.user': {$in: coveredIds}
                            }
                        ]
                    }
                });
            }
        }

        if (!isMobile) {
            pipeLine.push({
                $match: {
                    $or: [
                        {archived: false},
                        {archived: {$exists: false}}
                    ]
                }
            });
        }

        if (isMobile) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    parent: {
                        level1: '$parent.1',
                        level2: '$parent.2',
                        level3: '$parent.3',
                        level4: '$parent.4'
                    }
                })
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'assignedTo',
            addProjection: ['position', 'accessRole', 'firstName', 'lastName'],
            isArray      : true
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
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

        pipeLine.push({
            $unwind: {
                path                      : '$assignedTo',
                preserveNullAndEmptyArrays: true
            }
        });

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter
            });
        }

        if (!isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'accessRoles',
                key            : 'assignedTo.accessRole',
                isArray        : false,
                addProjection  : ['_id', 'name', 'level'],
                includeSiblings: {
                    assignedTo: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1
                    }
                }
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'positions',
                key            : 'assignedTo.position',
                isArray        : false,
                includeSiblings: {
                    assignedTo: {
                        _id       : 1,
                        accessRole: 1,
                        firstName : 1,
                        lastName  : 1
                    }
                }
            }));
        }

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                assignedTo: {$addToSet: '$assignedTo'}
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

            /*pipeLine.push({
             $project: aggregateHelper.getProjection({
             creationDate: '$createdBy.date',
             updateDate  : '$editedBy.date'
             })
             });*/
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                assignedTo: {
                    $filter: {
                        input: '$assignedTo',
                        as   : 'oneItem',
                        cond : {$ne: ['$$oneItem', null]}
                    }
                },
                /*lastDate  : {
                 $ifNull: [
                 '$editedBy.date',
                 '$createdBy.date'
                 ]
                 }*/
            })
        });

        /*if (!forSync) {
         pipeLine.push({
         $sort: {
         lastDate: -1
         }
         });

         pipeLine.push({
         $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
         });
         }

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
            limit            : limit,
            creationDate     : true
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun() {
            var query = req.query;
            var aggregateHelper;
            var lastLogOut = new Date(query.lastLogOut);
            var queryObject = {};
            var pipeLine;
            var aggregation;
            var ids;
            var currentUserLevel = req.session.level;

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }

            queryObject.context = CONTENT_TYPES.OBJECTIVES;

            aggregateHelper = new AggregationHelper($defProjection);

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            async.waterfall([
                function (cb) {
                    coveredByMe(PersonnelModel, ObjectId(req.session.uId), cb);
                },
                function (coveredIds, cb) {
                    pipeLine = getAllPipeline({
                        aggregateHelper : aggregateHelper,
                        queryObject     : queryObject,
                        isMobile        : req.isMobile,
                        forSync         : true,
                        coveredIds      : coveredIds,
                        currentUserLevel: currentUserLevel
                    });

                    aggregation = ObjectiveModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, response) {
                        if (err) {
                            return next(err);
                        }

                        response = response && response[0] ? response[0] : {data: [], total: 0};

                        response.data = _.map(response.data, function (objective) {
                            if (objective.title) {
                                objective.title = {
                                    ar: _.unescape(objective.title.ar),
                                    en: _.unescape(objective.title.en)
                                };
                            }

                            if (objective.description) {
                                objective.description = {
                                    ar: _.unescape(objective.description.ar),
                                    en: _.unescape(objective.description.en)
                                };
                            }

                            return objective;
                        });

                        cb(null, response);
                    });
                }
            ], function (err, response) {
                var idsPersonnel = [];
                var idsFile = [];
                var options = {
                    data: {}
                };
                if (err) {
                    return next(err);
                }

                response.data = _.map(response.data, function (model) {
                    if (model.title) {
                        model.title = {
                            en: model.title.en ? _.unescape(model.title.en) : '',
                            ar: model.title.ar ? _.unescape(model.title.ar) : ''
                        };
                    }
                    if (model.description) {
                        model.description = {
                            en: model.description.en ? _.unescape(model.description.en) : '',
                            ar: model.description.ar ? _.unescape(model.description.ar) : ''
                        };
                    }
                    if (model.companyObjective) {
                        model.companyObjective = {
                            en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                            ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : ''
                        };
                    }

                    idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                    idsPersonnel.push(model.createdBy.user._id);
                    idsPersonnel = _.union(idsPersonnel, _.map(model.assignedTo, '_id'));

                    return model;
                });

                idsPersonnel = lodash.uniqBy(idsPersonnel, 'id');
                options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
                options.data[CONTENT_TYPES.FILES] = idsFile;

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
                    fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], 'createdBy.user'];
                    fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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
            // var contentType = query.contentType;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var isMobile = req.isMobile;
            var positionFilter = {};
            var uId = req.session.uId;
            var currentUserLevel = req.session.level;

            var searchFieldsArray = [
                'title.en',
                'title.ar',
                'description.en',
                'description.ar',
                'objectiveType',
                'priority',
                'status',
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
                'createdBy.user.firstName.en',
                'createdBy.user.lastName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.ar',
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'assignedTo.firstName.en',
                'assignedTo.lastName.en',
                'assignedTo.firstName.ar',
                'assignedTo.lastName.ar',
                'assignedTo.position.name.ar',
                'assignedTo.position.name.en'
            ];

            var cover = filter.cover;
            var myCC = filter.myCC;

            delete filter.cover;
            delete filter.globalSearch;
            delete filter.myCC;

            queryObject = filterMapper
                .mapFilter({
                    contentType: CONTENT_TYPES.OBJECTIVES,
                    filter     : filter,
                    personnel  : personnel
                });

            if (cover) {
                delete queryObject.region;
                delete queryObject.subRegion;
                delete queryObject.branch;
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {
                    $or: [
                        {
                            'assignedTo.position': queryObject.position
                        },
                        {
                            'createdBy.user.position': queryObject.position
                        }
                    ]
                };

                delete queryObject.position;
            }

            queryObject.context = CONTENT_TYPES.OBJECTIVES;

            async.waterfall([
                // Appends to query object _ids of users that are subordinates to current user.
                (cb) => {
                    if (myCC) {
                        PersonnelModel.find({manager: req.session.uId})
                            .select('_id')
                            .lean()
                            .exec(cb);
                    } else {
                        cb(null, true);
                    }
                },
                function (arrayOfUserId, cb) {
                    if (myCC) {
                        queryObject.$and[0]['createdBy.user'].$in = [arrayOfUserId[0]._id];
                    }
                    coveredByMe(PersonnelModel, ObjectId(req.session.uId), cb);
                },
                function (coveredIds, cb) {
                    var pipeLine;
                    var aggregation;

                    pipeLine = getAllPipeline({
                        aggregateHelper  : aggregateHelper,
                        queryObject      : queryObject,
                        positionFilter   : positionFilter,
                        isMobile         : isMobile,
                        searchFieldsArray: searchFieldsArray,
                        filterSearch     : filterSearch,
                        skip             : skip,
                        limit            : limit,
                        coveredIds       : coveredIds,
                        currentUserLevel : currentUserLevel
                    });

                    aggregation = ObjectiveModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, response) {
                        if (err) {
                            return cb(err, null);
                        }

                        response = response && response[0] ? response[0] : {data: [], total: 0};

                        response.data = _.map(response.data, function (objective) {
                            objective.description = {
                                ar: _.unescape(objective.description.ar),
                                en: _.unescape(objective.description.en)
                            };

                            objective.companyObjective = {
                                ar: _.unescape(objective.companyObjective.ar),
                                en: _.unescape(objective.companyObjective.en)
                            };

                            return objective;
                        });

                        cb(null, response, coveredIds);
                    });
                },
                function (response, coveredIds, cb) {
                    var mobilePipeLine;
                    var mobileAggregation;

                    if (!isMobile) {
                        return cb(null, response);
                    }

                    mobilePipeLine = getAllPipeline({
                        aggregateHelper  : aggregateHelper,
                        parentIds        : isMobile ? _.pluck(response.data, '_id') : [],
                        positionFilter   : positionFilter,
                        isMobile         : isMobile,
                        searchFieldsArray: searchFieldsArray,
                        filterSearch     : filterSearch,
                        skip             : skip,
                        limit            : limit,
                        coveredIds       : coveredIds,
                        currentUserLevel : currentUserLevel
                    });

                    mobileAggregation = ObjectiveModel.aggregate(mobilePipeLine);

                    mobileAggregation.options = {
                        allowDiskUse: true
                    };

                    mobileAggregation.exec(function (err, responseMobile) {
                        if (err) {
                            return cb(err, null);
                        }

                        responseMobile = responseMobile && responseMobile[0] ? responseMobile[0] : {data: [], total: 0};

                        responseMobile.data = _.map(responseMobile.data, function (objective) {
                            if (objective.title) {
                                objective.title = {
                                    ar: _.unescape(objective.title.ar),
                                    en: _.unescape(objective.title.en)
                                };
                            }
                            if (objective.description) {
                                objective.description = {
                                    ar: _.unescape(objective.description.ar),
                                    en: _.unescape(objective.description.en)
                                };
                            }

                            if (objective.companyObjective) {
                                objective.companyObjective = {
                                    ar: _.unescape(objective.companyObjective.ar),
                                    en: _.unescape(objective.companyObjective.en)
                                };
                            }

                            return objective;
                        });

                        response.data = response.data.concat(responseMobile.data);
                        response.total += responseMobile.total;

                        cb(null, response);
                    });

                }

            ], function (err, response) {
                var idsPersonnel = [];
                var idsFile = [];
                var options = {
                    data: {}
                };
                if (err) {
                    return next(err);
                }

                response.data = _.map(response.data, function (model) {
                    if (model.title) {
                        model.title = {
                            en: model.title.en ? _.unescape(model.title.en) : '',
                            ar: model.title.ar ? _.unescape(model.title.ar) : ''
                        };
                    }
                    if (model.description) {
                        model.description = {
                            en: model.description.en ? _.unescape(model.description.en) : '',
                            ar: model.description.ar ? _.unescape(model.description.ar) : ''
                        };
                    }
                    if (model.companyObjective) {
                        model.companyObjective = {
                            en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                            ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : ''
                        };
                    }

                    idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                    idsPersonnel.push(model.createdBy.user._id);
                    idsPersonnel = _.union(idsPersonnel, _.map(model.assignedTo, '_id'));

                    return model;
                });

                idsPersonnel = lodash.uniqBy(idsPersonnel, 'id');
                options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
                options.data[CONTENT_TYPES.FILES] = idsFile;

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
                    fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], 'createdBy.user'];
                    fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed, personnel) {
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

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;
            var error;

            if (!VALIDATION.OBJECT_ID.test(id)) {
                error = new Error('Invalid parameter id');
                error.status = 400;
                return next(error);
            }

            self.getByIdAggr({id: ObjectId(id), isMobile: req.isMobile}, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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

    this.getPersonnelFroSelection = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var page = query.page || 1;
            var limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;

            var language = req.cookies.currentLanguage;
            var translateFields = ['firstName', 'lastName'];
            var translated = (query.filter && query.filter.translated) ? query.filter.translated.values : [];

            var filterMapper = new FilterMapper();
            var filter = query.filter || {};
            var objectiveType = filter.objectiveType && filter.objectiveType.values || query.objectiveType ? query.objectiveType || filter.objectiveType.values[0] : null;
            var filterSearch = filter.globalSearch || '';
            var currentUserId = req.session.uId;

            var queryObject;
            var queryObjectAfterLookup = {};
            var key;

            var $personnelDefProjection = {
                _id            : 1,
                position       : 1,
                avgRating      : 1,
                manager        : 1,
                lastAccess     : 1,
                firstName      : 1,
                lastName       : 1,
                email          : 1,
                phoneNumber    : 1,
                accessRole     : 1,
                createdBy      : 1,
                vacation       : 1,
                status         : 1,
                region         : 1,
                subRegion      : 1,
                retailSegment  : 1,
                outlet         : 1,
                branch         : 1,
                country        : 1,
                currentLanguage: 1,
                super          : 1,
                archived       : 1,
                temp           : 1,
                confirmed      : 1,
                translated     : 1
            };

            var sort = query.sort || {
                    'editedBy.date': 1
                };

            var aggregateHelper;

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            delete filter.globalSearch;
            delete filter.objectiveType;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.OBJECTIVES,
                filter     : filter,
                context    : 'objectivesAssign',
                personnel  : personnel
            });

            aggregateHelper = new AggregationHelper($personnelDefProjection, queryObject);

            if (queryObject.retailSegment) {
                queryObjectAfterLookup.retailSegment = queryObject.retailSegment;
                delete queryObject.retailSegment;
            }

            if (queryObject.outlet) {
                queryObjectAfterLookup.outlet = queryObject.outlet;
                delete queryObject.outlet;
            }

            if (queryObject.assignLevel) {
                queryObjectAfterLookup['accessRole.level'] = queryObject.assignLevel;
                delete queryObject.assignLevel;
            }

            if (!queryObject.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            async.waterfall([
                function (waterfallCb) {
                    PersonnelModel.aggregate([
                        {
                            $match: {
                                _id: ObjectId(currentUserId)
                            }
                        },
                        {
                            $lookup: {
                                from        : 'accessRoles',
                                localField  : 'accessRole',
                                foreignField: '_id',
                                as          : 'accessRole'
                            }
                        },
                        {
                            $project: {
                                accessRole: {$arrayElemAt: ['$accessRole', 0]},
                                country   : 1,
                                region    : 1,
                                subRegion : 1
                            }
                        }
                    ]).exec(function (err, personnels) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        waterfallCb(null, personnels[0]);
                    });
                },
                function (personnel, waterfallCb) {
                    var pipeLine = [];
                    var aggregation;
                    var domainsArray = ['country', 'region', 'subRegion'];
                    var personnelLocations = _.pick(personnel, 'country', 'region', 'subRegion');
                    var personnelLocationKey;
                    var searchFieldsArray = [
                        'firstName.en',
                        'firstName.ar',
                        'lastName.en',
                        'lastName.ar',
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
                        'email',
                        'phoneNumber',
                        'accessRole.name.en',
                        'accessRole.name.ar',
                        'position.name.en',
                        'position.name.ar'
                    ];

                    for (personnelLocationKey in
                        personnelLocations) {
                        if (!personnelLocations[personnelLocationKey][0]) {
                            delete personnelLocations[personnelLocationKey];
                        }
                    }

                    queryObject.super = {
                        $ne: true
                    };

                    queryObject._id = {
                        $ne: ObjectId(currentUserId)
                    };

                    pipeLine.push({
                        $match: queryObject
                    });

                    if (translated.length === 1) {
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
                        from   : 'positions',
                        key    : 'position',
                        isArray: false
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from         : 'accessRoles',
                        key          : 'accessRole',
                        isArray      : false,
                        addProjection: 'level'
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from             : 'branches',
                        key              : 'branch',
                        addMainProjection: ['retailSegment', 'outlet']
                    }));

                    if (objectiveType !== 'individual') {
                        if (personnel.accessRole.level <= 2) {
                            queryObjectAfterLookup['accessRole.level'] = {
                                $eq: personnel.accessRole.level + 1
                            };
                        }
                    } else {
                        queryObjectAfterLookup.$and = [
                            {'accessRole.level': {$gte: personnel.accessRole.level}},
                            {'accessRole.level': {$lt: 8}}
                        ];
                    }

                    for (personnelLocationKey in personnelLocations) {
                        queryObjectAfterLookup[personnelLocationKey] = {
                            $in: personnelLocations[personnelLocationKey]
                        };
                    }

                    pipeLine.push({
                        $match: queryObjectAfterLookup
                    });

                    domainsArray.forEach(function (element) {
                        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                            from: 'domains',
                            key : element
                        }));
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from: 'retailSegments',
                        key : 'retailSegment'
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from: 'outlets',
                        key : 'outlet'
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from           : 'personnels',
                        key            : 'createdBy.user',
                        isArray        : false,
                        mameFields     : ['firstName', 'lastName'],
                        includeSiblings: {createdBy: {date: 1}}
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from         : 'personnels',
                        key          : 'manager',
                        isArray      : false,
                        addProjection: ['_id', 'firstName', 'lastName']
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from           : 'personnels',
                        key            : 'vacation.cover',
                        isArray        : false,
                        addProjection  : ['_id', 'firstName', 'lastName'],
                        includeSiblings: {vacation: {onLeave: 1}}
                    }));

                    pipeLine.push({
                        $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
                    });

                    pipeLine.push({
                        $sort: sort
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

                    pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

                    aggregation = PersonnelModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, response) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        response = response && response[0] ? response[0] : {data: [], total: 0};

                        waterfallCb(null, response);
                    });
                }
            ], function (err, response) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: response});
            });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed, personnel) {
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
        var pipeObject;

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {_id: id}
        });

        if (isMobile) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    parent: {
                        level1: '$parent.1',
                        level2: '$parent.2',
                        level3: '$parent.3',
                        level4: '$parent.4'
                    }
                })
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'assignedTo',
            addProjection: ['firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole'])
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
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

        pipeLine.push({
            $unwind: {
                path                      : '$assignedTo',
                preserveNullAndEmptyArrays: true
            }
        });

        if (!isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'accessRoles',
                key            : 'assignedTo.accessRole',
                isArray        : false,
                addProjection  : ['_id', 'name', 'level'],
                includeSiblings: {
                    assignedTo: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1
                    }
                }
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'positions',
                key            : 'assignedTo.position',
                isArray        : false,
                includeSiblings: {
                    assignedTo: {
                        _id       : 1,
                        accessRole: 1,
                        firstName : 1,
                        lastName  : 1
                    }
                }
            }));
        }

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                assignedTo: {$addToSet: '$assignedTo'}
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

        pipeObject = {
            $project: aggregateHelper.getProjection({
                assignedTo: {
                    $filter: {
                        input: '$assignedTo',
                        as   : 'oneItem',
                        cond : {$ne: ['$$oneItem', null]}
                    }
                }
            })
        };

        if (isMobile) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    creationDate: '$createdBy.date'
                })
            });
        }

        pipeLine.push(pipeObject);

        aggregation = ObjectiveModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, response) {
            var idsPersonnel;
            var idsFile;
            var response = response[0];
            var options = {
                data: {}
            };
            if (err) {
                return callback(err);
            }
            if (!response || !Object.keys(response).length) {
                return callback(null, response);
            }
            idsFile = _.map(response.attachments, '_id');
            idsPersonnel = _.union([response.createdBy.user._id], _.map(response.assignedTo, '_id'));
            idsPersonnel = lodash.uniqBy(idsPersonnel, 'id');
            options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
            options.data[CONTENT_TYPES.FILES] = idsFile;

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
                fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], 'createdBy.user'];
                fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, function (model) {
                    if (model) {
                        if (model.title) {
                            model.title = {
                                en: model.title.en ? _.unescape(model.title.en) : '',
                                ar: model.title.ar ? _.unescape(model.title.ar) : ''
                            };
                        }
                        if (model.description) {
                            model.description = {
                                en: model.description.en ? _.unescape(model.description.en) : '',
                                ar: model.description.ar ? _.unescape(model.description.ar) : ''
                            };
                        }
                        if (model.companyObjective) {
                            model.companyObjective = {
                                en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                                ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : ''
                            };
                        }
                    }
                    callback(null, model);
                })
            });
        });
    };

    this.deleteByIds = function (req, res, next) {
        var ids = req.body.ids;
        var errorFlag = false;
        var data = [];
        var func;

        function getParallelFunction(id) {
            return function (callback) {
                ObjectiveModel.findByIdAndRemove(id, function (error, result) {
                    if (error) {
                        return callback(error);
                    }
                    return callback(null, result);
                });
            };
        }

        for (var i = 0; i < ids.length; i++) {
            if (ids[i].length === 24) {
                func = getParallelFunction(ids[i]);
                data.push(func);
            } else {
                errorFlag = new Error('Incorrect input');
            }
        }

        async.parallel(data, function (err, result) {
            if (err) {
                res.status(400).send(err);
            } else if (errorFlag) {
                res.status(400).send({error: 'Incorrect input'});
            } else {
                res.status(200).send(result);
            }
        });

    };

    this.getByIdHistory = function (req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);
            var pipeline = [];
            var $lookup1 = {
                from        : 'personnels',
                localField  : 'person',
                foreignField: '_id',
                as          : 'person'
            };
            var $lookup2 = {
                from        : 'objectives',
                localField  : 'objective',
                foreignField: '_id',
                as          : 'objective'
            };

            var aggregation;

            pipeline.push({
                $match: {person: id}
            });

            pipeline.push({
                $project: {
                    _id      : 1,
                    objective: 1,
                    person   : 1
                }
            });

            pipeline.push({$lookup: $lookup1});
            pipeline.push({$lookup: $lookup2});

            pipeline.push({
                $project: {
                    _id      : 1,
                    objective: {$arrayElemAt: ['$objective', 0]},
                    person   : {$arrayElemAt: ['$person', 0]}
                }
            });

            pipeline.push({
                $project: {
                    _id      : 1,
                    objective: {
                        _id   : '$objective._id',
                        title : '$objective.title',
                        status: '$objective.status'
                    },
                    person   : {
                        _id      : '$person._id',
                        firstName: '$person.firstName',
                        lastName : '$person.lastName'
                    }
                }
            });

            aggregation = ObjectiveHistoryModel.aggregate(pipeline);
            aggregation.exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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

    this.getByIdForObjectiveTreePreview = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;
            var aggregateHelper;
            var pipeLine = [];
            var isMobile = req.isMobile;
            var aggregation;
            var error;

            if (!VALIDATION.OBJECT_ID.test(id)) {
                error = new Error('Invalid parameter id');
                error.status = 400;
                return next(error);
            }

            id = ObjectId(id);

            aggregateHelper = new AggregationHelper($defProjection);

            pipeLine.push({
                $match: {
                    $or: [
                        {_id: id},
                        {'parent.1': id},
                        {'parent.2': id},
                        {'parent.3': id},
                        {'parent.4': id}
                    ]
                }
            });

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'personnels',
                key          : 'assignedTo',
                addProjection: ['firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole', 'imageSrc'])
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'createdBy.user',
                isArray        : false,
                addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole', 'imageSrc']),
                includeSiblings: {createdBy: {date: 1}}
            }));

            pipeLine.push({
                $unwind: {
                    path                      : '$assignedTo',
                    preserveNullAndEmptyArrays: true
                }
            });

            if (!isMobile) {
                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from           : 'accessRoles',
                    key            : 'assignedTo.accessRole',
                    isArray        : false,
                    addProjection  : ['_id', 'name', 'level'],
                    includeSiblings: {
                        assignedTo: {
                            _id      : 1,
                            position : 1,
                            firstName: 1,
                            lastName : 1,
                            imageSrc : 1
                        }
                    }
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from           : 'positions',
                    key            : 'assignedTo.position',
                    isArray        : false,
                    includeSiblings: {
                        assignedTo: {
                            _id       : 1,
                            accessRole: 1,
                            firstName : 1,
                            lastName  : 1,
                            imageSrc  : 1
                        }
                    }
                }));
            }

            pipeLine.push({
                $group: aggregateHelper.getGroupObject({
                    assignedTo: {$addToSet: '$assignedTo'}
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
                                lastName : 1,
                                imageSrc : 1
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
                                imageSrc  : 1
                            }
                        }
                    }
                }));
            }

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    assignedTo: {
                        $filter: {
                            input: '$assignedTo',
                            as   : 'oneItem',
                            cond : {$ne: ['$$oneItem', null]}
                        }
                    }
                })
            });

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    parentNew: {
                        $cond: {
                            if  : {$eq: ['$level', 1]},
                            then: 0,
                            else: {
                                $cond: {
                                    if  : {$eq: ['$level', 2]},
                                    then: '$parent.1',
                                    else: {
                                        $cond: {
                                            if  : {$eq: ['$level', 3]},
                                            then: '$parent.2',
                                            else: {
                                                $cond: {
                                                    if  : {$eq: ['$level', 4]},
                                                    then: '$parent.3',
                                                    else: 0
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    child    : []
                })
            });

            pipeLine.push({
                $group: {
                    _id     : '$level',
                    subTasks: {
                        $addToSet: '$$ROOT'
                    }
                }
            });

            aggregation = ObjectiveModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                if (result.length) {
                    result.map(function (model) {
                        var subTasks = model.subTasks;

                        subTasks.map(function (task) {
                            task.description = {
                                ar: _.unescape(task.description.ar),
                                en: _.unescape(task.description.en)
                            };
                        });
                    });
                }

                next({status: 200, body: result});
            });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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

module.exports = Objectives;
