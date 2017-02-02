const async = require('async');
const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ACL_CONSTANTS = require('./../constants/aclRolesNames');
const ACL_MODULES = require('./../constants/aclModulesNames');
const CONTENT_TYPES = require('./../public/js/constants/contentType.js');
const OTHER_CONSTANTS = require('./../public/js/constants/otherConstants.js');
const CONSTANTS = require('./../constants/mainConstants');
const mongo = require('./../utils/mongo');
const AggregationHelper = require('./../helpers/aggregationCreater');
const GetImagesHelper = require('./../helpers/getImages');
const ObjectiveModel = require('././../types/objective/model');
const PersonnelModel = require('./../types/personnel/model');
const FilterMapper = require('./../helpers/filterMapper');
const FileHandler = require('./../handlers/file');
const ACTIVITY_TYPES = require('./../constants/activityTypes');
const coveredByMe = require('./../helpers/coveredByMe');
const FileModel = require('./../types/file/model');
const VisibilityFormHandler = require('./../handlers/visibilityForm');
const access = require('./../helpers/access')();
const bodyValidator = require('./../helpers/bodyValidator');
const extractBody = require('./../utils/extractBody');
const event = require('./../utils/eventEmitter');
const detectObjectivesForSubordinates = require('../reusableComponents/detectObjectivesForSubordinates');
const ActivityLog = require('./../stories/push-notifications/activityLog');
const TestUtils = require('./../stories/push-notifications/utils/TestUtils');
const InStoreTaskUtils = require('./../stories/test-utils').InStoreTaskUtils;

const ObjectId = mongoose.Types.ObjectId;
const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
const getImagesHelper = new GetImagesHelper();
const fileHandler = new FileHandler(mongo.db);
const visibilityFormHandler = new VisibilityFormHandler(mongo.db);

var InStoreReports = function() {
    const self = this;
    const $defProjection = {
        _id: 1,
        title: 1,
        description: 1,
        objectiveType: 1,
        priority: 1,
        status: 1,
        assignedTo: 1,
        complete: 1,
        level: 1,
        dateStart: 1,
        dateEnd: 1,
        dateClosed: 1,
        comments: 1,
        attachments: 1,
        editedBy: 1,
        createdBy: 1,
        country: 1,
        region: 1,
        subRegion: 1,
        retailSegment: 1,
        outlet: 1,
        branch: 1,
        location: 1,
        form: 1,
        history: 1,
        creationDate: 1,
        updateDate   : 1
    };

    this.removeFileFromInStoreTask = function (req, res, next) {
        function queryRun() {
            var body = req.body;
            var session = req.session;
            var userId = session.uId;
            var fileId = body.fileId;
            var inStoreTaskId = body.inStoreTaskId;
            var error;
            var fileName;

            if (!inStoreTaskId || !fileId) {
                error = new Error('Not enough params');
                error.status = 400;
                return next(error)
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
                    })
                },

                function (removeFile, cb) {
                    ObjectiveModel.update(inStoreTaskId, {$pull: {attachments: ObjectId(fileId)}}, function (err) {
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
                    })
                }

            ], function (err) {
                if (err) {
                    return next(err);
                }

                res.status(200).send();
            });
        }

        access.getEditAccess(req, ACL_MODULES.IN_STORE_REPORTING, function (err, allowed) {
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

    this.create = (req, res, next) => {
        const accessRoleLevel = req.session.level;
        const queryRun = (body, callback) => {
            const files = req.files;
            const session = req.session;
            const userId = session.uId;
            const isMobile = req.isMobile;

            const saveObjective = body.saveObjective;

            if (!body.formType || body.formType !== 'visibility') {
                const error = new Error('Please link visibility form');

                error.status = 400;
                return callback(error);
            }

            if (!body.assignedTo || !body.assignedTo.length) {
                const error = new Error('You must assign person to task');

                error.status = 400;
                return callback(error);
            }

            if (body.assignedTo.length !== 1) {
                const error = new Error('In store task can be assigned only to one person');

                error.status = 400;
                return callback(error);
            }

            async.waterfall([

                (cb) => {
                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, cb);
                },

                (filesIds, cb) => {
                    const createdBy = {
                        user: userId,
                        date: new Date()
                    };
                    const status = saveObjective ?
                        OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS;

                    body.title = {
                        en: body.title.en ? _.escape(body.title.en) : '',
                        ar: body.title.ar ? _.escape(body.title.ar) : ''
                    };
                    body.description = {
                        en: body.description.en ? _.escape(body.description.en) : '',
                        ar: body.description.ar ? _.escape(body.description.ar) : ''
                    };

                    const inStoreTasks = {
                        title: body.title,
                        description: body.description,
                        objectiveType: body.objectiveType,
                        priority: body.priority,
                        status: status,
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
                        attachments: filesIds,
                        context: CONTENT_TYPES.INSTORETASKS,
                        createdBy,
                        editedBy: createdBy,
                        history: {
                            assignedTo: body.assignedTo[0],
                            index: 1
                        }
                    };

                    const model = new ObjectiveModel();

                    model.set(inStoreTasks);
                    model.save((err, model, numAffected) => {
                        cb(err, model);
                    });
                },

                (inStoreTaskModel, cb) => {
                    if (TestUtils.isInStoreTaskDraft(inStoreTaskModel)) {
                        ActivityLog.emit('in-store-task:draft-created', {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: inStoreTaskModel.toJSON(),
                        });
                    }

                    if (TestUtils.isInStoreTaskPublished(inStoreTaskModel)) {
                        ActivityLog.emit('in-store-task:published', {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: inStoreTaskModel.toJSON(),
                        });
                    }

                    const data = {
                        objective: inStoreTaskModel.get('_id'),
                        description: ''
                    };

                    async.waterfall([

                        (cb) => {
                            visibilityFormHandler.createForm(userId, data, cb);
                        },

                        (formModel, cb) => {
                            inStoreTaskModel.form = {
                                _id: formModel.get('_id'),
                                contentType: body.formType
                            };

                            inStoreTaskModel.save((err, model, numAffected) => {
                                cb(err, model);
                            });
                        }

                    ], cb);
                },

                (inStoreTaskModel, cb) => {
                    const id = inStoreTaskModel.get('_id');

                    self.getByIdAggr({ id, isMobile }, cb);
                }

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.IN_STORE_REPORTING, cb);
            },

            (allowed, personnel, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.INSTORETASKS, 'create', cb);
            },

            queryRun

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(body);
        });
    };

    this.update = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const store = new InStoreTaskUtils({
            actionOriginator: userId,
            accessRoleLevel,
        });

        function queryRun(updateObject, body) {
            var files = req.files;
            var attachments;
            var inStoreTaskId = req.params.id;
            var index;
            var fullUpdate = {
                $set: updateObject
            };

            attachments = body.attachments;

            async.waterfall([

                function (cb) {
                    if (!files) {
                        return cb(null, []);
                    }

                    //TODO: change bucket from constants
                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, function (err, filesIds) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, filesIds);
                    });
                },

                function (filesIds, cb) {
                    updateObject.editedBy = {
                        user: ObjectId(userId),
                        date: new Date()
                    };

                    if (attachments && attachments.length) {
                        attachments = attachments.objectID();

                        updateObject.attachments = attachments.concat(filesIds);
                    } else {
                        delete updateObject.attachments;

                        fullUpdate.$addToSet = {};
                        fullUpdate.$addToSet.attachments = {$each: filesIds};
                    }

                    ObjectiveModel.findOne({_id: inStoreTaskId}, function (err, inStoreTaskModel) {
                        var error;
                        var assignedTo;
                        var history;

                        if (err) {
                            return cb(err);
                        }

                        if (!inStoreTaskModel) {
                            error = new Error('In store task not found');
                            error.status = 400;
                            return cb(error);
                        }

                        store.setPreviousState(inStoreTaskModel.toJSON());

                        if (lodash.includes([
                                OBJECTIVE_STATUSES.FAIL,
                                OBJECTIVE_STATUSES.CLOSED
                            ], inStoreTaskModel.status)) {
                            error = new Error(`You could not update task with status: "${inStoreTaskModel.status}"`);
                            error.status = 400;

                            return cb(error);
                        }

                        if (inStoreTaskModel.status === OBJECTIVE_STATUSES.OVER_DUE
                            && inStoreTaskModel.createdBy.user.toString() !== userId) {
                            error = new Error(`You could not update task with status: "${inStoreTaskModel.status}"`);
                            error.status = 400;

                            return cb(error);
                        }

                        assignedTo = inStoreTaskModel.get('assignedTo');

                        if (updateObject.assignedTo && updateObject.assignedTo.length) {
                            history = inStoreTaskModel.get('history');

                            if (!history.length) {
                                index = 1;
                            } else {
                                index = history.length + 1;
                            }

                            history.push({
                                assignedTo: updateObject.assignedTo[0],
                                index     : index
                            });

                            updateObject.history = history;
                        }
                        if (updateObject.title) {
                            updateObject.title = {
                                en: updateObject.title.en ? _.escape(updateObject.title.en) : '',
                                ar: updateObject.title.ar ? _.escape(updateObject.title.ar) : ''
                            };
                        }
                        if (updateObject.description) {
                            updateObject.description = {
                                en: updateObject.description.en ? _.escape(updateObject.description.en) : '',
                                ar: updateObject.description.ar ? _.escape(updateObject.description.ar) : ''
                            };
                        }

                        ObjectiveModel.findOneAndUpdate({
                            _id: inStoreTaskId,
                        }, fullUpdate, {
                            new: true,
                            runValidators: true,
                        }, (err, updatedModel) => {
                            if (err) {
                                return cb(err);
                            }

                            store.setNextState(updatedModel.toJSON());
                            store.difference();
                            store.publish();

                            cb(null, inStoreTaskModel.get('_id'));
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

        access.getEditAccess(req, ACL_MODULES.IN_STORE_REPORTING, function (err, allowed) {
            var body = {};
            var updateObject;

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

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.INSTORETASKS, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData, body);
            });
        });
    };

    this.duplicateInStoreTask = function (req, res, next) {
        function queryRun() {
            var body = req.body;
            var inStoreTasks = body.id;
            var session = req.session;

            ObjectiveModel
                .findById(inStoreTasks, function (err, inStoreTaskModel) {
                    var error;
                    var options;
                    var inStoreTaskJSON;

                    if (err) {
                        return next(err);
                    }

                    if (!inStoreTaskModel) {
                        error = new Error('In store task not found');
                        error.status = 400;

                        return next(error);
                    }

                    inStoreTaskJSON = inStoreTaskModel.toJSON();

                    options = {
                        objectiveType: inStoreTaskJSON.objectiveType,
                        priority     : inStoreTaskJSON.priority,
                        status       : OBJECTIVE_STATUSES.DRAFT,
                        formType     : 'visibility',
                        level        : session.level,
                        createdBy    : {
                            user: session.uId,
                            date: Date.now()
                        },
                        title        : inStoreTaskJSON.title,
                        description  : inStoreTaskJSON.description
                    };

                    req.body = options;

                    self.create(req, res, next);
                });
        }

        access.getWriteAccess(req, ACL_MODULES.IN_STORE_REPORTING, function (err, allowed) {
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

            var showAll = filter.showAll;

            delete filter.showAll;

            var aggregateHelper;

            for (key in sort) {
                sort[key] = parseInt(sort[key]);
            }

            delete filter.globalSearch;
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.INSTORETASKS,
                filter     : filter,
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
                                country   : 1
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
                    var personnelCountryes = personnel.country;
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

                    queryObject.super = {
                        $ne: true
                    };

                    queryObject._id = {
                        $ne: ObjectId(currentUserId)
                    };

                    if (showAll){
                        queryObject.$or = [
                            {country : queryObject.country},
                            {country : {$size : 0}}
                        ];
                        delete queryObject.country;
                        delete queryObject.region;
                        delete queryObject.subRegion;

                    }

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

                    pipeLine.push({
                        $match: {
                            'accessRole.level': {
                                $nin: [
                                    ACL_CONSTANTS.MASTER_UPLOADER,
                                    ACL_CONSTANTS.COUNTRY_UPLOADER
                                ]
                            }
                        }
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from             : 'branches',
                        key              : 'branch',
                        addMainProjection: ['retailSegment', 'outlet']
                    }));

                    if (personnelCountryes.length) {
                        queryObjectAfterLookup['$or'] = [
                            {'country': {$in: personnelCountryes}},
                            {
                                'country'         : {$eq: []},
                                'accessRole.level': ACL_CONSTANTS.MASTER_ADMIN
                            }
                        ]
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
                        nameFields     : ['firstName', 'lastName'],
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

        access.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, function (err, allowed, personnel) {
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

    function getAllPipeLine(options) {
        const subordinates = options.subordinates;
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var isMobile = options.isMobile;
        var skip = options.skip;
        var limit = options.limit;
        var coveredIds = options.coveredIds;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var forSync = options.forSync;
        var currentUserLevel = options.currentUserLevel;

        var pipeLine = [];

        pipeLine.push({
            $match: queryObject
        });

        if (currentUserLevel && currentUserLevel !== ACL_CONSTANTS.MASTER_ADMIN) {
            const allowedAccessRoles = [
                ACL_CONSTANTS.COUNTRY_ADMIN,
                ACL_CONSTANTS.AREA_MANAGER,
                ACL_CONSTANTS.AREA_IN_CHARGE
            ];

            if (allowedAccessRoles.indexOf(currentUserLevel) > -1 && queryObject) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                assignedTo: {$in: subordinates},
                                status    : {$nin: [OBJECTIVE_STATUSES.DRAFT]}
                            },
                            {
                                'history.assignedTo': {$in: coveredIds},
                                status              : {$nin: [OBJECTIVE_STATUSES.DRAFT]}
                            },
                            {
                                'createdBy.user': {$in: coveredIds}
                            }
                        ]
                    }
                });
            } else {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                assignedTo: {$in: coveredIds},
                                status    : {$nin: [OBJECTIVE_STATUSES.DRAFT]}
                            },
                            {
                                'history.assignedTo': {$in: coveredIds},
                                status              : {$nin: [OBJECTIVE_STATUSES.DRAFT]}
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'assignedTo',
            addProjection: ['_id', 'position', 'accessRole', 'firstName', 'lastName']
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
            $project: aggregateHelper.getProjection({
                assignedTo: {$arrayElemAt: ['$assignedTo', 0]}
            })
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
                        firstName: 1,
                        lastName : 1,
                        position : 1
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
                        firstName : 1,
                        lastName  : 1,
                        accessRole: 1
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

        /* if (!forSync) {
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
            var aggregateHelper = new AggregationHelper($defProjection);
            var filterMapper = new FilterMapper();
            var lastLogOut = new Date(query.lastLogOut);
            var queryObject = query.filter ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.INSTORETASKS,
                filter     : query.filter || {}
            }) : {};
            var currentUserLevel = req.session.level;
            var pipeLine;
            var positionFilter;
            var aggregation;
            var ids;
            let arrayOfSubordinateUsersId = [];

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }

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

            queryObject.context = CONTENT_TYPES.INSTORETASKS;

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            async.waterfall([
                (cb) => {
                    PersonnelModel.find({manager: req.session.uId})
                        .select('_id')
                        .lean()
                        .exec(cb);
                },

                function (arrayOfUserId, cb) {
                    arrayOfSubordinateUsersId = arrayOfUserId.map((model) => {
                        return model._id
                    });
                    coveredByMe(PersonnelModel, ObjectId(req.session.uId), cb);
                },
                function (coveredIds, cb) {
                    pipeLine = getAllPipeLine({
                        aggregateHelper : aggregateHelper,
                        queryObject     : queryObject,
                        positionFilter  : positionFilter,
                        isMobile        : req.isMobile,
                        coveredIds      : coveredIds,
                        forSync         : true,
                        currentUserLevel: currentUserLevel,
                        subordinates : arrayOfSubordinateUsersId
                    });

                    aggregation = ObjectiveModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, response) {
                        var result;
                        if (err) {
                            return next(err);
                        }
                        if (response.length) {
                            response[0].data = _.map(response[0].data, function (element) {
                                if (element.description) {
                                    element.description = {
                                        ar: _.unescape(element.description.ar),
                                        en: _.unescape(element.description.en)
                                    };
                                }
                                if (element.title) {
                                    element.title = {
                                        ar: _.unescape(element.title.ar),
                                        en: _.unescape(element.title.en)
                                    };
                                }

                                return element;
                            });
                        }

                        result = response && response[0] ? response[0] : {data: [], total: 0};

                        cb(null, result);
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

                _.map(response.data, function (model) {
                    idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                    idsPersonnel.push(model.createdBy.user._id);
                    idsPersonnel = _.union(idsPersonnel, _.map(model.assignedTo, '_id'));
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

        access.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, function (err, allowed) {
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
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var isMobile = req.isMobile;
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var positionFilter = {};
            var ids;
            var uId = req.session.uId;
            var currentUserLevel = req.session.level;
            let myCC = filter.myCC;
            let arrayOfSubordinateUsersId = [];

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

            delete filter.globalSearch;
            delete filter.myCC;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.INSTORETASKS,
                filter     : query.filter || {},
                personnel  : personnel
            });

            if (query.personnelTasks) {
                $defProjection.context = 1;
            }

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }

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

            queryObject.context = CONTENT_TYPES.INSTORETASKS;

            async.waterfall([
                // if request with myCC, then Appends to queryObject _id of user that subordinate to current user.
                (cb) => {
                    if (myCC || isMobile) {
                        PersonnelModel.find({manager: req.session.uId})
                            .select('_id')
                            .lean()
                            .exec(cb);
                    } else {
                        cb(null, true);
                    }
                },

                function (arrayOfUserId, cb) {
                    if (myCC || isMobile) {
                        //array of subordinate users id, to send on android app
                        arrayOfSubordinateUsersId = arrayOfUserId.map((model) => {
                            return model._id
                        });
                    }
                    if (myCC) {
                        queryObject.$and[0]['assignedTo'].$in = arrayOfSubordinateUsersId;
                    }
                    coveredByMe(PersonnelModel, ObjectId(req.session.uId), cb);
                },

                function (coveredIds, cb) {
                    var pipeLine = [];
                    var aggregation;

                    if (!queryObject.cover) {
                        return cb(null, null, coveredIds);
                    }

                    aggregateHelper = new AggregationHelper($defProjection, queryObject);

                    pipeLine.push({
                        $match: {
                            'vacation.cover': ObjectId(uId)
                        }
                    });

                    pipeLine.push({
                        $lookup: {
                            from        : 'objectives',
                            localField  : '_id',
                            foreignField: 'assignedTo',
                            as          : 'objectives'
                        }
                    });

                    pipeLine.push({
                        $project: {
                            objectives: 1
                        }
                    });

                    pipeLine.push({
                        $unwind: {
                            path                      : '$objectives',
                            preserveNullAndEmptyArrays: true
                        }
                    });

                    pipeLine.push({
                        $project: {
                            _id: '$objectives._id'
                        }
                    });

                    aggregation = PersonnelModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, result) {
                        if (err) {
                            return cb(err, null, coveredIds);
                        }

                        result = _.pluck(result, '_id');
                        cb(null, result, coveredIds);
                    });
                },
                function (objectiveIds, coveredIds, cb) {
                    var pipeLine;
                    var aggregation;

                    if (objectiveIds) {
                        if (queryObject.$or && Array.isArray(queryObject.$or)) {
                            queryObject.$or.push({_id: {$in: objectiveIds}});
                        } else {
                            queryObject._id = {$in: objectiveIds};
                        }

                        delete queryObject.cover;
                    }

                    aggregateHelper = new AggregationHelper($defProjection, queryObject);

                    pipeLine = getAllPipeLine({
                        aggregateHelper  : aggregateHelper,
                        queryObject      : queryObject,
                        positionFilter   : positionFilter,
                        isMobile         : isMobile,
                        searchFieldsArray: searchFieldsArray,
                        filterSearch     : filterSearch,
                        skip             : skip,
                        limit            : limit,
                        coveredIds       : coveredIds,
                        currentUserLevel : currentUserLevel,
                        subordinates : arrayOfSubordinateUsersId
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
                            if (objective.description) {
                                objective.description = {
                                    ar: _.unescape(objective.description.ar),
                                    en: _.unescape(objective.description.en)
                                };
                            }

                            if (objective.title) {
                                objective.title = {
                                    ar: _.unescape(objective.title.ar),
                                    en: _.unescape(objective.title.en)
                                };
                            }

                            return objective;
                        });

                        cb(null, response/*, coveredIds*/);
                    });
                }/*,
                function (response, coveredIds, cb) {
                    var mobilePipeLine;
                    var mobileAggregation;
                    var mobileQuery;
                    var allIds;

                    if (!isMobile) {
                        return cb(null, response);
                    }

                    allIds = _.pluck(response.data, '_id');
                    mobileQuery = {
                        $or: [
                            {
                                'parent.level1': {$in: allIds}
                            },
                            {
                                'parent.level2': {$in: allIds}
                            },
                            {
                                'parent.level3': {$in: allIds}
                            },
                            {
                                'parent.level4': {$in: allIds}
                            }
                        ]
                    };

                    mobilePipeLine = getAllPipeLine({
                        aggregateHelper  : aggregateHelper,
                        queryObject      : mobileQuery,
                        positionFilter   : positionFilter,
                        isMobile         : isMobile,
                        searchFieldsArray: searchFieldsArray,
                        filterSearch     : filterSearch,
                        skip             : skip,
                        limit            : limit,
                        coveredIds       : coveredIds,
                        currentUserLevel : currentUserLevel
                    });

                    mobileAggregation = Model.aggregate(mobilePipeLine);
                    mobileAggregation.options = {
                        allowDiskUse: true
                    };

                    mobileAggregation.exec(function (err, responseMobile) {
                        if (err) {
                            return cb(err, null);
                        }

                        responseMobile = responseMobile && responseMobile[0] ? responseMobile[0] : {data: [], total: 0};

                        responseMobile.data = _.map(responseMobile.data, function (objective) {
                            objective.description = {
                                ar: _.unescape(objective.description.ar),
                                en: _.unescape(objective.description.en)
                            };

                            objective.title = {
                                ar: _.unescape(objective.title.ar),
                                en: _.unescape(objective.title.en)
                            };

                            objective.companyObjective = {
                                ar: _.unescape(objective.companyObjective.ar),
                                en: _.unescape(objective.companyObjective.en)
                            };

                            return objective;
                        });

                        response.data = response.data.concat(responseMobile.data);
                        response.total += responseMobile.total;

                        cb(null, response);
                    });

                }*/

            ], function (err, response) {
                var idsPersonnel = [];
                var idsFile = [];
                var options = {
                    data: {}
                };
                if (err) {
                    return next(err);
                }

                _.map(response.data, function (model) {
                    idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                    idsPersonnel.push(model.createdBy.user._id);
                    idsPersonnel = _.union(idsPersonnel, _.map(model.assignedTo, '_id'));
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

        access.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, function (err, allowed, personnel) {
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
        var pipeObject;
        var aggregation;
        var id = options.id;
        var isMobile = options.isMobile || false;

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {_id: id}
        });

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
            addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
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

    this.getByIdTaskFlow = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;
            var pipeLine = [];
            var aggregation;
            var aggregateHelper;
            var isMobile = req.isMobile;

            aggregateHelper = new AggregationHelper($defProjection);

            pipeLine.push({
                $match: {_id: ObjectId(id)}
            });

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'branches',
                key : 'branch'
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'files',
                key          : 'attachments',
                addProjection: ['contentType', 'originalName', 'createdBy']
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'createdBy.user',
                isArray        : false,
                addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
                includeSiblings: {createdBy: {date: 1}}
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'personnels',
                key          : 'assignedTo',
                addProjection: ['position', 'accessRole', 'firstName', 'lastName']
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
                $unwind: {
                    path                      : '$history',
                    preserveNullAndEmptyArrays: true
                }
            });

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'history.assignedTo',
                isArray        : false,
                addProjection  : ['_id', 'position', 'firstName', 'lastName', 'accessRole'],
                includeSiblings: {history: {index: 1}}
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'accessRoles',
                key            : 'history.assignedTo.accessRole',
                isArray        : false,
                addProjection  : ['_id', 'name', 'level'],
                includeSiblings: {
                    history: {
                        index     : 1,
                        assignedTo: {
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
                key            : 'history.assignedTo.position',
                isArray        : false,
                includeSiblings: {
                    history: {
                        index     : 1,
                        assignedTo: {
                            _id       : 1,
                            accessRole: 1,
                            firstName : 1,
                            lastName  : 1
                        }
                    }
                }
            }));

            pipeLine.push({
                $group: aggregateHelper.getGroupObject({
                    history: {
                        $addToSet: {
                            assignedTo: '$history.assignedTo',
                            index     : '$history.index'
                        }
                    }
                })
            });

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    history: {
                        $filter: {
                            input: '$history',
                            as   : 'oneItem',
                            cond : {$ne: ['$$oneItem.assignedTo', {}]}
                        }
                    }
                })
            });

            pipeLine.push(...aggregateHelper.aggregationPartMaker({
                from : 'visibilityForms',
                key : 'form._id',
                as : 'form',
                isArray : false,
                addProjection : ['_id', 'after']
            }));

            aggregation = ObjectiveModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                var idsPersonnel;
                var idsFile;
                var options = {
                    data: {}
                };
                if (err) {
                    return next(err);
                }

                if (!response.length) {
                    return next({status: 200, body: {}});
                }

                response = response[0];

                idsFile = _.map(response.attachments, '_id');
                idsPersonnel = _.union([response.createdBy.user._id], _.map(response.assignedTo, '_id'));
                response.history.forEach(function (history) {
                    idsPersonnel.push(history.assignedTo._id);
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
                    fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], ['history.assignedTo'], 'createdBy.user'];
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
                        next({status: 200, body: model});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, function (err, allowed) {
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
            var isMobile = req.isMobile;

            self.getByIdAggr({id: id, isMobile: isMobile}, function (err, model) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(model);
            });
        }

        access.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, function (err, allowed) {
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

module.exports = InStoreReports;
