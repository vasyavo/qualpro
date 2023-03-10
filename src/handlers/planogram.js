const RetailSegmentModel = require('./../types/retailSegment/model');
const ActivityLog = require('./../stories/push-notifications/activityLog');
const logger = require('./../utils/logger');
const extractBody = require('./../utils/extractBody');

var planogramsHandler = function () {
    var async = require('async');
    var mongoose = require('mongoose');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler();
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var _ = require('lodash');
    var PlanogramModel = require('./../types/planogram/model');
    var access = require('../helpers/access')();
    var logWriter = require('../helpers/logWriter.js');
    var FilterMapper = require('../helpers/filterMapper');
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(PlanogramModel);
    var populateByType = require('../helpers/populateByType');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var bodyValidator = require('../helpers/bodyValidator');
    var ObjectId = mongoose.Types.ObjectId;
    var errorSender = require('../utils/errorSender');
    var ERROR_MESSAGES = require('../constants/errorMessages');
    var self = this;
    var $defProjection = {
        _id          : 1,
        country      : 1,
        retailSegment: 1,
        product      : 1,
        productInfo  : 1,
        fileID       : 1,
        configuration: 1,
        editedBy     : 1,
        createdBy    : 1,
        archived     : 1,
        displayType  : 1
    };

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const body = extractBody(req.body);

        const queryRun = (body, callback) => {
            const files = req.files;
            const configurationId = body.configuration;

            async.waterfall([

                // retrieve retail segment which has configuration name by provided configuration id
                (cb) => {
                    RetailSegmentModel.findOne({'configurations._id': configurationId}, 'configurations', cb);
                },

                // pick configuraiton name from result set and upload attached picture
                (retailSegment, cb) => {
                    async.parallel({

                        configurationName: (cb) => {
                            const configurationName = retailSegment.configurations.filter((item) => {
                                return `${item._id}` === configurationId;
                            }).map((item) => {
                                return item.configuration;
                            }).pop();

                            if (!configurationName) {
                                return cb('No such configuration found.');
                            }

                            cb(null, configurationName);
                        },

                        setFileId: (cb) => {
                            fileHandler.uploadFile(userId, files, CONTENT_TYPES.PLANOGRAM, cb);
                        },

                    }, cb);
                },

                (options, cb) => {
                    const {
                        configurationName,
                        setFileId,
                    } = options;
                    const fileId = setFileId.slice().pop();
                    const createdBy = {
                        user: ObjectId(userId),
                        date: new Date(),
                    };

                    const dataToSave = Object.assign({}, body, {
                        configuration: {
                            _id : configurationId,
                            name: configurationName,
                        },
                        createdBy,
                        editedBy     : createdBy,
                    });

                    if (fileId) {
                        dataToSave.fileID = fileId;
                    }

                    const planogram = new PlanogramModel();

                    planogram.set(dataToSave);
                    planogram.save((err, model) => {
                        cb(err, model);
                    });
                },

                (planogramModel, cb) => {
                    ActivityLog.emit('planogram:published', {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body            : planogramModel.toJSON(),
                    });

                    const id = planogramModel.get('_id');

                    self.getByIdAggr({
                        id,
                        isMobile: req.isMobile,
                    }, cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                const {
                    country,
                    retailSegment,
                    product,
                    displayType: {name},
                    configuration,
                } = body;
                const query = {
                    country,
                    retailSegment      : {
                        $in: retailSegment,
                    },
                    product,
                    'displayType.name' : name,
                    'configuration._id': configuration,
                };

                PlanogramModel.findOne(query, (err, result) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!result) {
                        return cb();
                    }

                    errorSender.badRequest(cb, ERROR_MESSAGES.PLANOGRAM_SAME_PARAMETERS);
                });
            },

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.PLANOGRAM, cb);
            },

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.PLANOGRAM, 'create', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(result);
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
            from         : 'files',
            key          : 'fileID',
            addProjection: ['contentType', 'originalName', 'createdBy'],
            isArray      : false
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'categories',
            key          : 'product',
            isArray      : false,
            addProjection: ['archived', 'information']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'retailSegment',
            isArray: true
        }));

        pipeLine.push({
            $project: {
                _id          : 1,
                country      : 1,
                retailSegment: 1,
                product      : 1,
                fileID       : 1,
                configuration: 1,
                editedBy     : 1,
                createdBy    : 1,
                archived     : 1,
                displayType  : 1,
                productInfo  : '$product.information',
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'productInfo',
            isArray      : true,
            addProjection: ['originalName', 'preview', 'contentType',]
        }));

        aggregation = PlanogramModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec((err, result) => {
            if (err) {
                return callback(err);
            }

            const body = result.length ? result[0] : {};

            callback(null, body);
        });
    };

    this.archive = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (callback) => {
            const setIdToArchive = req.body.ids.objectID();
            const archived = req.body.archived === 'false' ? false : !!req.body.archived;
            const options = [{
                idsToArchive   : setIdToArchive,
                keyForCondition: '_id',
                archived,
                topArchived    : archived,
                model          : PlanogramModel,
            }];
            const activityType = archived ? 'archived' : 'unarchived';

            async.waterfall([

                (cb) => {
                    archiver.archive(userId, options, cb);
                },

                (done, cb) => {
                    callback();

                    PlanogramModel.find({
                        _id: {
                            $in: setIdToArchive,
                        },
                    }).lean().exec(cb);
                },

                (setItem, cb) => {
                    async.each(setItem, (item, eachCb) => {
                        ActivityLog.emit(`planogram:${activityType}`, {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body            : item,
                        });
                        eachCb();
                    }, cb);
                },

            ]);
        };

        async.waterfall([

            (cb) => {
                access.getArchiveAccess(req, ACL_MODULES.PLANOGRAM, cb);
            },

            (personnel, allowed, cb) => {
                queryRun(cb);
            },

        ], (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send({});
        });
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;

            self.getByIdAggr({
                id      : ObjectId(id),
                isMobile: req.isMobile
            }, function (err, model) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(model);
            })
        }

        access.getReadAccess(req, ACL_MODULES.PLANOGRAM, function (err, allowed) {
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

    function getAllPipeLine(options) {
        var queryObject = options.queryObject;
        var aggregateHelper = options.aggregateHelper;
        var isMobile = options.isMobile;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var sort = options.sort;
        var pipeLine = [];

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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'country',
            isArray      : false,
            addProjection: ['archived']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'retailSegments',
            key          : 'retailSegment',
            isArray      : true,
            addProjection: ['archived']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'categories',
            key          : 'product',
            isArray      : false,
            addProjection: ['archived', 'information']
        }));

        pipeLine.push({
            $project: {
                _id          : 1,
                country      : 1,
                retailSegment: 1,
                product      : 1,
                fileID       : 1,
                configuration: 1,
                editedBy     : 1,
                createdBy    : 1,
                archived     : 1,
                displayType  : 1,
                productInfo  : '$product.information',
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'productInfo',
            isArray      : true,
            addProjection: ['originalName', 'preview', 'contentType',]
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'fileID',
            addProjection: ['contentType', 'originalName', 'createdBy', 'preview'],
            isArray      : false
        }));

        if (!isMobile) {
            pipeLine.push({
                $match: {
                    'retailSegment.archived': false,
                    'product.archived'      : false,
                    'country.archived'      : false
                }
            });
        }

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
        function queryRun() {
            var query = req.query;
            var isMobile = req.isMobile;
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper = new AggregationHelper($defProjection);
            var sort = {'createdBy.date': -1};
            var queryObject = {};
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

            pipeLine = getAllPipeLine({
                queryObject    : queryObject,
                aggregateHelper: aggregateHelper,
                isMobile       : isMobile,
                forSync        : true,
                sort           : sort
            });

            aggregation = PlanogramModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ?
                    result[0] : {data: [], total: 0};

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PLANOGRAM, function (err, allowed) {
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
            var page = query.page || 1;
            var limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var queryObject = query.filter || {};
            var filterSearch = queryObject.globalSearch || '';
            var isMobile = req.isMobile;
            var aggregateHelper;
            var key;

            var searchFieldsArray = [
                'country.name.en',
                'country.name.ar',
                'retailSegment.name.en',
                'retailSegment.name.ar',
                'category.name.en',
                'category.name.ar',
                'configuration',
                'displayType.name.en',
                'displayType.name.ar'
            ];

            var sort = query.sort || {
                'editedBy.date': 1
            };

            delete queryObject.globalSearch;

            if (query.filter && query.filter.displayType) {
                query.filter.displayType.type = 'string';
                query.filter['displayType._id'] = query.filter.displayType;
                delete query.filter.displayType;
            }

            if (query.filter && query.filter.configuration) {
                query.filter['configuration._id'] = query.filter.configuration;
                delete query.filter.configuration;
            }

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.PLANOGRAM,
                filter     : query.filter || {},
                personnel  : personnel
            });

            aggregateHelper = new AggregationHelper($defProjection, queryObject);
            delete queryObject.region;
            delete queryObject.subRegion;

            for (key in sort) {
                sort[key] = parseInt(sort[key]);
            }

            if (!queryObject.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            const pipeline = getAllPipeLine({
                queryObject,
                aggregateHelper,
                isMobile,
                searchFieldsArray,
                filterSearch,
                skip,
                limit,
                sort,
            });

            PlanogramModel.aggregate(pipeline)
                .allowDiskUse(true)
                .exec((err, result) => {
                    if (err) {
                        return next(err);
                    }

                    const body = result.length ?
                        result[0] : {data: [], total: 0};

                    next({
                        status: 200,
                        body,
                    });
                });
        }

        access.getReadAccess(req, ACL_MODULES.PLANOGRAM, function (err, allowed, personnel) {
            if (err) {
                return next(err);
            }

            queryRun(personnel);
        });
    };

    this.update = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var files = req.files.inputImg.name ? req.files : null;
            var userId = req.session.uId;
            var id = req.params.id;

            body.editedBy = {
                user: ObjectId(userId),
                date: new Date(),
            };

            async.waterfall([
                function (callback) {
                    if (!files) {
                        return callback(null, null);
                    }
                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.PLANOGRAM, function (err, fileId) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, fileId[0]);
                    })
                },
                function (fileId, callback) {
                    if (fileId) {
                        body.fileID = fileId;
                    }
                    PlanogramModel.findByIdAndUpdate(id, {$set: body}, {new: true})
                        .exec(function (err, model) {
                            if (err) {
                                return callback(err);
                            }

                            ActivityLog.emit(`planogram:updated`, {
                                actionOriginator: userId,
                                accessRoleLevel,
                                body            : model.toJSON(),
                            });

                            callback(null, model);
                        });
                },
                function (model, callback) {
                    var id = model.get('_id');

                    self.getByIdAggr({
                        id      : id,
                        isMobile: req.isMobile
                    }, callback);
                }

            ], function (err, model) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(model);
            });
        }

        access.getEditAccess(req, ACL_MODULES.COMPETITOR_LIST, err => {
            var body = req.body;

            if (err) {
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

            const {
                country,
                retailSegment,
                product,
                displayType: {
                    name,
                },

                configuration: {
                    _id: configuration,
                },
            } = body;
            const query = {
                country,
                retailSegment: {
                    $in: retailSegment,
                },

                product,
                'displayType.name' : name,
                'configuration._id': configuration,
            };

            PlanogramModel.findOne(query, (err, result) => {
                if (err) {
                    return next(err);
                }

                if (result) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.PLANOGRAM_SAME_PARAMETERS);
                }

                bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.PLANOGRAM, 'update', (err, saveData) => {
                    if (err) {
                        return next(err);
                    }

                    queryRun(saveData);
                });
            });

        });
    };

};
module.exports = planogramsHandler;
