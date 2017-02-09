const async = require('async');
const extractBody = require('./../utils/extractBody');
const detectObjectivesForSubordinates = require('../reusableComponents/detectObjectivesForSubordinates');
const TestUtils = require('./../stories/push-notifications/utils/TestUtils');
const ActivityLog = require('./../stories/push-notifications/activityLog');
const ObjectiveUtils = require('./../stories/test-utils').ObjectiveUtils;
const logger = require('./../utils/logger');
const toString = require('./../utils/toString');

var Objectives = function (db, redis, event) {
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
    var getImagesHelper = new GetImageHelper();
    var ObjectiveModel = require('./../types/objective/model');
    var PersonnelModel = require('./../types/personnel/model');
    var ObjectiveHistoryModel = require('./../types/objectiveHistory/model');
    var FilterMapper = require('../helpers/filterMapper');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler();
    var access = require('../helpers/access')();
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

    const createSubObjective = (options, callback) => {
        const {
            parentId,
            files,
            isMobile,
        } = options;
        const saveObjective = options.saveObjective;
        const accessRoleLevel = options.level;
        const actionOriginator = options.createdById;
        const attachments = [];
        const createdBy = {
            user: actionOriginator,
            date: Date.now(),
        };

        if (!parentId || !actionOriginator || !options.assignedToIds.length) {
            const error = new Error('Not enough params');

            error.status = 400;
            return callback(error);
        }

        async.waterfall([

            (cb) => {
                if (!files) {
                    return cb(null, []);
                }

                fileHandler.uploadFile(actionOriginator, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                    if (err) {
                        return cb(err, null);
                    }

                    cb(null, setFileId);
                });
            },

            (setFileId, cb) => {
                ObjectiveModel.findById(parentId, (err, parentObjective) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!parentObjective) {
                        const error = new Error('Objective not found');

                        error.status = 400;
                        return cb(error);
                    }

                    attachments.push(...options.attachments.objectID(), ...setFileId);

                    cb(null, parentObjective);
                });
            },

            (parentObjective, cb) => {
                const createdBy = {
                    user: actionOriginator,
                    date: new Date(),
                };
                const subObjectiveData = {
                    description: options.description,
                    parentObjective: parentObjective.parent,
                    title: options.title,
                    priority: options.priority || parentObjective.priority,
                    objectiveType: parentObjective.objectiveType,
                    status: saveObjective ?
                        OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS,
                    assignedTo: options.assignedToIds || [],
                    level: accessRoleLevel,
                    dateStart: options.dateStart || parentObjective.dateStart,
                    dateEnd: options.dateEnd || parentObjective.dateEnd,
                    createdBy,
                    editedBy: createdBy,
                    attachments,
                    location: options.location,
                    country: options.country,
                    region: options.region,
                    subRegion: options.subRegion,
                    retailSegment: options.retailSegment,
                    outlet: options.outlet,
                    branch: options.branch,
                };

                if (!options.formType && parentObjective.form) {
                    subObjectiveData.form = parentObjective.form;
                }

                if (options.title) {
                    subObjectiveData.title = {
                        en: lodash.escape(lodash.get(options, 'title.en') || ''),
                        ar: lodash.escape(lodash.get(options, 'title.ar') || ''),
                    };
                }

                if (options.description) {
                    subObjectiveData.description = {
                        en: lodash.escape(lodash.get(options, 'description.en') || ''),
                        ar: lodash.escape(lodash.get(options, 'description.ar') || ''),
                    };
                }

                if (parentObjective.parent) {
                    subObjectiveData.parent = {
                        1: parentObjective.parent['1'] || null,
                        2: parentObjective.parent['2'] || null,
                        3: parentObjective.parent['3'] || null,
                        4: parentObjective.parent['4'] || null,
                    };
                    /*
                    * less then or equals to Area in Charge manager without Trade Marketer
                    * */
                    const everyAdmin = [
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN,
                        ACL_CONSTANTS.AREA_MANAGER,
                        ACL_CONSTANTS.AREA_IN_CHARGE,
                        ACL_CONSTANTS.SALES_MAN,
                    ];

                    if (parentObjective.level && everyAdmin.indexOf(parentObjective.level) > -1) {
                        subObjectiveData.parent[parentObjective.get('level')] = parentObjective.get('_id');
                    }
                }

                if (parentObjective.companyObjective) {
                    subObjectiveData.companyObjective = parentObjective.companyObjective;
                }

                if (options.companyObjective) {
                    subObjectiveData.companyObjective = {
                        en: lodash.escape(lodash.get(options, 'companyObjective.en') || ''),
                        ar: lodash.escape(lodash.get(options, 'companyObjective.ar') || ''),
                    };
                }

                const objective = new ObjectiveModel();

                objective.set(subObjectiveData);
                objective.save((err, objective) => {
                    cb(err, objective);
                });
            },

            (objective, cb) => {
                if (options.formType === 'distribution') {
                    const data = {
                        objective: objective.get('_id'),
                    };

                    return distributionFormHandler.createForm(actionOriginator, data, (err, formModel) => {
                        if (err) {
                            return cb(err);
                        }

                        objective.form = {
                            _id: formModel.get('_id'),
                            contentType: options.formType,
                        };

                        cb(null, objective);
                    });
                }

                if (options.formType === 'visibility') {
                    const data = {
                        objective: objective.get('_id'),
                        createdBy,
                    };

                    return visibilityFormHandler.createForm(actionOriginator, data, (err, formModel) => {
                        if (err) {
                            return cb(err);
                        }

                        objective.form = {
                            _id: formModel.get('_id'),
                            contentType: options.formType,
                        };

                        cb(null, objective);
                    });
                }
            },

            (objective, cb) => {
                if (!options.formType) {
                    return cb(null, objective);
                }

                objective.save((err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, objective);
                });
            },

            (objective, cb) => {
                const updateParentObjective = (id, seriesCb) => {
                    async.waterfall([

                        (cb) => {
                            ObjectiveModel.findById(id, (err, parent) => {
                                if (err) {
                                    return cb(err);
                                }

                                if (!parent) {
                                    const error = new Error('Parent objective not found');

                                    error.status = 400;
                                    return cb(error);
                                }

                                cb(null, parent);
                            });
                        },

                        (parent, cb) => {
                            const query = {
                                level: parseInt(parent.level, 10) + 1,
                            };

                            query[`parent.${parent.level}`] = parent._id;

                            ObjectiveModel.find(query, (err, children) => {
                                const countSubTasks = children.filter((child) => (child.status !== 'draft'));
                                const completedSubTasks = children.filter((child) => (child.status === 'completed'));

                                parent.countSubTasks = countSubTasks.length;
                                parent.completedSubTasks = completedSubTasks.length;

                                const complete = Math.floor((parent.completedSubTasks * 100) / parent.countSubTasks);

                                if (isNaN(complete) || !isFinite(complete)) {
                                    parent.complete = 0;
                                } else {
                                    parent.complete = complete;
                                }

                                if (parent.complete >= 100 && parent.status === OBJECTIVE_STATUSES.RE_OPENED) {
                                    parent.status = OBJECTIVE_STATUSES.CLOSED;
                                }

                                if (parent.complete < 100 && parent.status === OBJECTIVE_STATUSES.CLOSED) {
                                    parent.status = OBJECTIVE_STATUSES.RE_OPENED;
                                }

                                cb(null, parent);
                            });
                        },

                    ], (err, parentModel) => {
                        if (err) {
                            return seriesCb(err);
                        }

                        parentModel.save((err) => {
                            if (err) {
                                return seriesCb(err);
                            }

                            ActivityLog.emit('sub-objective:updated', {
                                actionOriginator,
                                accessRoleLevel,
                                body: parentModel.toJSON(),
                            });

                            seriesCb(null);
                        });
                    });
                };
                const series = Object.keys(objective.parent)
                    .map(parentLevel => {
                        const parent = objective.parent[parentLevel];

                        if (parent) {
                            return (cb) => {
                                updateParentObjective(parent, cb);
                            };
                        }

                        return false;
                    })
                    .filter(it => it);

                async.series(series, (err) => {
                    cb(err, objective);
                });
            },

            (objective, cb) => {
                const isNotVisibility = options.formType !== 'visibility';

                if (isNotVisibility) {
                    if (TestUtils.isObjectiveDraft(objective)) {
                        ActivityLog.emit('sub-objective:draft-created', {
                            actionOriginator,
                            accessRoleLevel,
                            body: objective.toJSON(),
                        });
                    }

                    if (TestUtils.isObjectivePublished(objective)) {
                        ActivityLog.emit('sub-objective:published', {
                            actionOriginator,
                            accessRoleLevel,
                            body: objective.toJSON(),
                        });
                    }
                }

                const id = objective.get('_id');

                self.getByIdAggr({
                    id,
                    isMobile,
                }, cb);
            },

        ], callback);
    };

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

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const isMobile = req.isMobile;

        const queryRun = (body, callback) => {
            const files = req.files;
            const createdBy = {
                user: userId,
                date: new Date(),
            };

            const saveObjective = body.saveObjective;

            if (!body.assignedTo || !body.assignedTo.length) {
                const error = new Error('You must assign person to task');

                error.status = 400;
                return next(error);
            }

            async.waterfall([

                (cb) => {
                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, setFileId);
                    });
                },

                (setFileId, cb) => {
                    const status = saveObjective ?
                        OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS;

                    body.title = {
                        en: lodash.escape(lodash.get(body, 'title.en') || ''),
                        ar: lodash.escape(lodash.get(body, 'title.ar') || ''),
                    };
                    body.description = {
                        en: lodash.escape(lodash.get(body, 'description.en') || ''),
                        ar: lodash.escape(lodash.get(body, 'description.ar') || ''),
                    };

                    const data = {
                        objectiveType: body.objectiveType,
                        priority: body.priority,
                        status,
                        assignedTo: body.assignedTo,
                        level: session.level,
                        dateStart: body.dateStart,
                        dateEnd: body.dateEnd,
                        country: body.country,
                        region: body.region,
                        subRegion: body.subRegion,
                        retailSegment: body.retailSegment,
                        outlet: body.outlet,
                        branch: body.branch,
                        location: body.location,
                        attachments: setFileId,
                        createdBy,
                        editedBy: createdBy,
                        title: body.title,
                        description: body.description,
                    };

                    const objective = new ObjectiveModel();

                    objective.set(data);
                    objective.save((err, model) => {
                        cb(err, model);
                    });
                },

                (objective, cb) => {
                    if (body.formType === 'distribution') {
                        const data = {
                            objective: objective.get('_id'),
                        };

                        return distributionFormHandler.createForm(userId, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: body.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    if (body.formType === 'visibility') {
                        const data = {
                            objective: objective.get('_id'),
                            createdBy,
                        };

                        return visibilityFormHandler.createForm(userId, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: body.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    cb(null, objective);
                },

                (objective, cb) => {
                    if (!body.formType) {
                        return cb(null, objective);
                    }

                    objective.save((err) => {
                        cb(err, objective);
                    });
                },

                (objective, cb) => {
                    const hasForm = lodash.has(body, 'formType');
                    const isDistribution = hasForm && body.formType === 'distribution';

                    // skip in case with visibility form
                    if (!hasForm || isDistribution) {
                        if (TestUtils.isObjectiveDraft(objective)) {
                            ActivityLog.emit('objective:draft-created', {
                                actionOriginator: userId,
                                accessRoleLevel,
                                body: objective.toJSON(),
                            });
                        }

                        if (TestUtils.isObjectivePublished(objective)) {
                            ActivityLog.emit('objective:published', {
                                actionOriginator: userId,
                                accessRoleLevel,
                                body: objective.toJSON(),
                            });
                        }
                    }

                    const id = objective.get('_id');

                    self.getByIdAggr({
                        id,
                        isMobile,
                    }, cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (personnel, allowed, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'create', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(result);
        });
    };

    this.update = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const store = new ObjectiveUtils({
            actionOriginator: userId,
            accessRoleLevel,
        });
        const files = req.files;
        const body = extractBody(req.body);
        const objectiveId = req.params.id;
        const attachments = body.attachments;

        const queryRun = ($set, callback) => {
            const fullUpdate = {
                $set,
            };

            const updateCover = (objective) => {
                PersonnelModel.findOne({
                    $and: [{
                        'vacation.cover': ObjectId(userId),
                    }, {
                        $or: [{
                            _id: {
                                $in: objective.assignedTo,
                            },
                            'vacation.onLeave': true,
                        }, {
                            _id: ObjectId(objective.createdBy.user),
                            'vacation.onLeave': true,
                        }],
                    }],
                }, (err, personnel) => {
                    if (err) {
                        logger.error('Query on objective\'s cover fails', err);
                        return;
                    }

                    if (!personnel) {
                        logger.error('Cover personnel not found');
                        return;
                    }

                    const objectiveHistory = new ObjectiveHistoryModel({
                        objective: ObjectId(objective._id),
                        person: ObjectId(userId),
                    });

                    objectiveHistory.save((err) => {
                        if (err) {
                            logger.error('Objective\'s history doesn\'t saved', err);
                            return;
                        }
                    });
                });
            };

            const updateObjective = (setFileId, cb) => {
                if ($set.status && $set.status !== OBJECTIVE_STATUSES.CLOSED) {
                    $set.complete = $set.status === OBJECTIVE_STATUSES.COMPLETED ? 100 : 0;
                }

                $set.editedBy = {
                    user: ObjectId(userId),
                    date: new Date(),
                };

                if (attachments && attachments.length) {
                    $set.attachments = attachments.objectID().concat(setFileId);
                } else {
                    delete $set.attachments;

                    fullUpdate.$addToSet = {
                        attachments: {
                            $each: setFileId,
                        },
                    };
                }

                if ($set.title) {
                    $set['title.en'] = lodash.escape(lodash.get($set, 'title.en') || '');
                    $set['title.ar'] = lodash.escape(lodash.get($set, 'title.ar') || '');

                    delete $set.title;
                }

                if ($set.description) {
                    $set['description.en'] = lodash.escape(lodash.get($set, 'description.en') || '');
                    $set['description.ar'] = lodash.escape(lodash.get($set, 'description.ar') || '');

                    delete $set.description;
                }

                ObjectiveModel.findOne({
                    _id: objectiveId,
                }, (err, model) => {
                    if (err) {
                        return cb(err);
                    }

                    store.setPreviousState(model.toJSON());

                    if (lodash.includes([
                        OBJECTIVE_STATUSES.FAIL,
                        OBJECTIVE_STATUSES.CLOSED,
                    ], model.status)) {
                        const error = new Error(`You could not update task with status: "${model.status}"`);
                        error.status = 400;

                        return cb(error);
                    }

                    if (model.status === OBJECTIVE_STATUSES.OVER_DUE && toString(model, 'createdBy.user') !== userId) {
                        const error = new Error(`You could not update task with status: "${model.status}"`);

                        error.status = 400;
                        return cb(error);
                    }

                    ObjectiveModel.findOneAndUpdate({
                        _id: objectiveId,
                    }, fullUpdate, {
                        new: true,
                    }, (err, objective) => {
                        if (err) {
                            return cb(err);
                        }

                        if (body.cover) {
                            updateCover(objective);
                        }

                        if (objective.status === OBJECTIVE_STATUSES.CLOSED
                            && objective.objectiveType !== 'individual'
                            && objective.level === ACL_CONSTANTS.MASTER_ADMIN) {
                            ObjectiveModel.update({
                                'parent.1': objective._id,
                            }, {
                                $set: {
                                    archived: true,
                                },
                            }, {
                                multi: true,
                            }, (err, result) => {
                                if (err) {
                                    logger.error(err);
                                    return;
                                }

                                logger.info(result);
                            });
                        }

                        store.setNextState(objective.toJSON());
                        store.difference();
                        store.publish();

                        cb(null, objective);
                    });
                });
            };

            const uploadFiles = (cb) => {
                if (files) {
                    return cb(null, []);
                }

                fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, setFileId);
                });
            };

            const waterfall = [
                uploadFiles,
                updateObjective,
            ];

            if ($set.formType) {
                const createForms = (objective, cb) => {
                    if ($set.formType === 'distribution') {
                        /* TODO fill description from task if AM or AincM will link forms */
                        const data = {
                            objective: objective.get('_id'),
                            description: '',
                        };

                        return distributionFormHandler.createForm(userId, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: $set.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    if ($set.formType === 'visibility') {
                        const data = {
                            objective: objective.get('_id'),
                            createdBy: {
                                user: userId,
                                date: objective.createdBy.date,
                            },
                        };

                        return visibilityFormHandler.createForm(userId, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: $set.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    cb(null, objective);
                };

                const updateObjectiveWithForm = (objective, cb) => {
                    if (!$set.formType) {
                        return cb(null, objective);
                    }

                    objective.save((err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, objective);
                    });
                };

                waterfall.push(createForms);
                waterfall.push(updateObjectiveWithForm);
            }

            if ($set.status && $set.status !== OBJECTIVE_STATUSES.CLOSED) {
                const updateParents = (objective, cb) => {
                    const updateParentObjective = (id, cb) => {
                        async.waterfall([

                            (cb) => {
                                ObjectiveModel.findById(id, (err, parentModel) => {
                                    if (err) {
                                        return cb(err);
                                    }

                                    if (!parentModel) {
                                        const error = new Error('Parent objective not found');

                                        error.status = 400;
                                        return cb(error);
                                    }

                                    cb(null, parentModel);
                                });
                            },

                            (parentObjective, cb) => {
                                const parentModelLevel = parseInt(parentObjective.level, 10);
                                const query = {
                                    level: parentModelLevel + 1,
                                    [`parent.${parentModelLevel}`]: parentObjective._id,
                                };

                                ObjectiveModel.find(query, (err, childModels) => {
                                    const currentStatusOfParentObjective = parentObjective.status;

                                    const countSubTasks = childModels.filter((model) => (model.status !== 'draft')).length;
                                    const completedSubTasks = childModels.filter((model) => (model.status === 'completed')).length;
                                    const complete = Math.floor((completedSubTasks * 100) / countSubTasks);
                                    const changes = {
                                        countSubTasks,
                                        completedSubTasks,
                                        complete,
                                    };

                                    if (complete >= 100 && currentStatusOfParentObjective === OBJECTIVE_STATUSES.RE_OPENED) {
                                        changes.status = OBJECTIVE_STATUSES.CLOSED;
                                    }

                                    if (complete < 100 && currentStatusOfParentObjective === OBJECTIVE_STATUSES.CLOSED) {
                                        changes.status = OBJECTIVE_STATUSES.RE_OPENED;
                                    }

                                    parentObjective.set(changes);

                                    cb(null, parentObjective);
                                });
                            },

                        ], (err, parentModel) => {
                            if (err) {
                                return cb(err);
                            }

                            parentModel.save((err) => {
                                if (err) {
                                    return cb(err);
                                }

                                cb(null);
                            });
                        });
                    };
                    const series = Object.keys(objective.parent)
                        .map(parentLevel => {
                            const parent = objective.parent[parentLevel];

                            if (parent) {
                                return (cb) => {
                                    updateParentObjective(parent, cb);
                                };
                            }

                            return false;
                        })
                        .filter(it => it);

                    async.series(series, (err) => {
                        if (err) {
                            logger.error(err);
                            return;
                        }
                    });

                    cb(null, objective);
                };

                waterfall.push(updateParents);
            }

            if ($set.assignedTo && $set.assignedTo[0]) {
                const updateChildObjective = (options) => {
                    const {
                        nextObjectiveIds,
                        assignedTo,
                    } = options;
                    const query = {
                        _id: {
                            $in: nextObjectiveIds,
                        },
                    };

                    ObjectiveModel.update(query, {
                        $set: {
                            'createdBy.user': ObjectId(assignedTo[0]),
                        },
                    }, (err) => {
                        if (err) {
                            logger.error(err);
                            return;
                        }
                    });
                };

                const updateObjectiveByAssigneeLocation = (objective, cb) => {
                    const objectiveLevel = objective.get('level');
                    const objectiveId = objective.get('_id');
                    const query = {
                        [`parent.${objectiveLevel}`]: objectiveId,
                    };

                    ObjectiveModel.find(query, (err, setObjective) => {
                        if (err) {
                            return cb(err);
                        }

                        if (setObjective) {
                            PersonnelModel.findById($set.assignedTo[0], (err, personnel) => {
                                if (err) {
                                    return cb(err);
                                }

                                ObjectiveModel.findByIdAndUpdate(objectiveId, {
                                    $set: {
                                        country: personnel.country,
                                        region: personnel.region,
                                        subRegion: personnel.subRegion,
                                        branch: personnel.branch,
                                    },
                                }, (err) => {
                                    if (err) {
                                        return cb(err);
                                    }

                                    updateChildObjective({
                                        nextObjectiveIds: setObjective.map(item => item._id),
                                        assignedTo: $set.assignedTo,
                                    });
                                });
                            });
                        }

                        cb(null, objective);
                    });
                };

                waterfall.push(updateObjectiveByAssigneeLocation);
            }

            const getResultAndSend = (objective, cb) => {
                const id = objective.get('_id');

                self.getByIdAggr({
                    id,
                    isMobile: req.isMobile,
                }, cb);
            };

            waterfall.push(getResultAndSend);

            async.waterfall(waterfall, callback);
        };

        async.waterfall([

            (cb) => {
                access.getEditAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (personnel, allowed, cb) => {
                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'update', cb);
            },

            queryRun,

        ], (err, model) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(model);
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

    this.createSubObjective = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
            const files = req.files;
            const parentId = body.parentId;
            const options = {
                parentId,
                assignedToIds: body.assignedTo,
                createdById: userId,
                saveObjective: body.saveObjective,
                companyObjective: body.companyObjective,
                description: body.description,
                title: body.title,
                dateStart: body.dateStart,
                dateEnd: body.dateEnd,
                priority: body.priority,
                attachments: body.attachments,
                files,
                objectiveType: body.objectiveType,
                location: body.location,
                country: body.country,
                region: body.region,
                subRegion: body.subRegion,
                retailSegment: body.retailSegment,
                outlet: body.outlet,
                branch: body.branch,
                level: accessRoleLevel,
                formType: body.formType,
                form: body.form,
                isMobile: req.isMobile,
            };

            if (!body.assignedTo || !body.assignedTo.length) {
                const error = new Error('You must assign person to task');

                error.status = 400;
                return next(error);
            }

            createSubObjective(options, callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (personnel, allowed, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'createSubObjective', cb);
            },

            queryRun,

        ], (err, parent) => {
            if (err) {
                return next(err);
            }

            if (!parent) {
                return res.status(200).send();
            }

            res.status(200).send(parent);
        });
    };

    function getAllPipeline(options) {
        const subordinates = options.subordinates;
        const personnel = options.personnel;
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
                const allowedAccessRoles = [
                    ACL_CONSTANTS.COUNTRY_ADMIN,
                    ACL_CONSTANTS.AREA_MANAGER,
                    ACL_CONSTANTS.AREA_IN_CHARGE
                ];

                if (allowedAccessRoles.indexOf(currentUserLevel) > -1 && queryObject) {
                    //get objectives that assigned to subordinate users
                    pipeLine.push({
                        $match: {
                            $or: [
                                {
                                    assignedTo: {$in: subordinates},
                                }, {
                                    assignedTo: {$in: coveredIds},
                                }, {
                                    'createdBy.user': {$in: coveredIds}
                                }
                            ]
                        }
                    });
                }
            }
    
            // prevent retrieving objectives with status === draft if user not creator
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            status: {$ne: OBJECTIVE_STATUSES.DRAFT}
                        },{
                            status    : {$eq: OBJECTIVE_STATUSES.DRAFT},
                            'createdBy.user': {$eq: personnel}
                        }
                    ]
                }
            });
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
                }
            })
        });

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
            const query = req.query;
            const lastLogOut = new Date(query.lastLogOut);
            const currentUserLevel = req.session.level;
            let arrayOfSubordinateUsersId = [];
            let queryObject = {};
            let aggregateHelper;
            let pipeLine;

            queryObject.context = CONTENT_TYPES.OBJECTIVES;

            aggregateHelper = new AggregationHelper($defProjection);

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            async.waterfall([
                (cb) => {
                    PersonnelModel.distinct('_id', {manager: req.session.uId})
                        .exec((err, subordinateIds) => {
                            if (err) {
                                return cb(err);
                            }

                            arrayOfSubordinateUsersId = subordinateIds;

                            cb(null)
                        });
                },

                (cb) => {
                    coveredByMe(PersonnelModel, ObjectId(req.session.uId), cb);
                },

                (coveredIds, cb) => {
                    pipeLine = getAllPipeline({
                        aggregateHelper : aggregateHelper,
                        queryObject     : queryObject,
                        isMobile        : true,
                        forSync         : true,
                        personnel       : ObjectId(req.session.uId),
                        coveredIds      : coveredIds,
                        currentUserLevel: currentUserLevel,
                        subordinates    : arrayOfSubordinateUsersId
                    });

                    ObjectiveModel.aggregate(pipeLine).allowDiskUse(true).exec((err, response) => {
                        if (err) {
                            return next(err);
                        }

                        response = response && response[0] ? response[0] : {data: [], total: 0};

                        cb(null, response);
                    });
                }
            ], (err, response) => {
                var idsPersonnel = [];
                var idsFile = [];
                var options = {
                    data: {}
                };

                if (err) {
                    return next(err);
                }

                response.data = _.map(response.data, (model) => {
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

                options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
                options.data[CONTENT_TYPES.FILES] = idsFile;

                getImagesHelper.getImages(options, (err, result) => {
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

                    getImagesHelper.setIntoResult(setOptions, (response) => {
                        const subordinatesId = arrayOfSubordinateUsersId.map((ObjectId) => {
                            return ObjectId.toString();
                        });
                        const currentUserId = req.session.uId;

                        response.data = detectObjectivesForSubordinates(response.data, subordinatesId, currentUserId);

                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, (err, allowed) => {
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
            let arrayOfSubordinateUsersId = [];

            var searchFieldsArray = [
                'myCC',
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
                'assignedTo._id',
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

            if (cover || isMobile) {
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
                // if request with myCC, then Appends to queryObject _id of user that subordinate to current user.
                (cb) => {
                    if (myCC || isMobile) {
                        PersonnelModel.distinct('_id', {manager: req.session.uId}).exec((err, subordinateIds) => {
                            if (err) {
                                return cb(err);
                            }

                            arrayOfSubordinateUsersId = subordinateIds;

                            cb(null)
                        });
                    } else {
                        cb(null);
                    }
                },
                function (cb) {
                    if (myCC) {
                        queryObject.$and[0]['assignedTo'].$in = arrayOfSubordinateUsersId;
                    }

                    coveredByMe(PersonnelModel, ObjectId(uId), cb);
                },

                function (coveredIds, cb) {
                    var pipeLine;
    
                    pipeLine = getAllPipeline({
                        aggregateHelper  : aggregateHelper,
                        queryObject      : queryObject,
                        positionFilter   : positionFilter,
                        isMobile         : isMobile,
                        searchFieldsArray: searchFieldsArray,
                        filterSearch     : filterSearch,
                        skip             : skip,
                        limit            : limit,
                        personnel        : ObjectId(uId),
                        coveredIds       : coveredIds,
                        subordinates     : arrayOfSubordinateUsersId,
                        currentUserLevel : currentUserLevel
                    });

                    ObjectiveModel.aggregate(pipeLine).allowDiskUse(true).exec(function (err, response) {
                        if (err) {
                            return cb(err, null);
                        }

                        response = response && response[0] ? response[0] : {data: [], total: 0};

                        cb(null, response);
                    });
                },

                function (response, cb) {
                    var mobilePipeLine;

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
                        currentUserLevel : currentUserLevel
                    });

                    ObjectiveModel.aggregate(mobilePipeLine).allowDiskUse(true).exec(function (err, responseMobile) {
                        if (err) {
                            return cb(err, null);
                        }

                        responseMobile = responseMobile && responseMobile[0] ? responseMobile[0] : {data: [], total: 0};

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
                        const subordinatesId = arrayOfSubordinateUsersId.map((ObjectId) => {
                            return ObjectId.toString();
                        });
                        const currentUserId = req.session.uId;

                        response.data = detectObjectivesForSubordinates(response.data, subordinatesId, currentUserId);

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
                        addMainProjection: ['retailSegment', 'outlet'],
                        addProjection: ['outlet']
                    }));

                    if (objectiveType && objectiveType !== 'individual') {
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
            key : 'branch',
            addProjection : ['_id', 'name', 'outlet']
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
                    return callback(err);
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
