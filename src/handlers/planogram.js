const BsonObjectId = require('bson-objectid');
const RetailSegmentModel = require('./../types/retailSegment/model');

var planogramsHandler = function(db, redis, event) {
    var async = require('async');
    var mongoose = require('mongoose');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var _ = require('lodash');
    var PlanogramModel = require('./../types/planogram/model');
    var access = require('../helpers/access')(db);
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var logWriter = require('../helpers/logWriter.js');
    var FilterMapper = require('../helpers/filterMapper');
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(PlanogramModel);
    var populateByType = require('../helpers/populateByType');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var bodyValidator = require('../helpers/bodyValidator');
    var ObjectId = mongoose.Types.ObjectId;
    var self = this;
    var $defProjection = {
        _id : 1,
        country : 1,
        retailSegment : 1,
        product : 1,
        fileID : 1,
        configuration : 1,
        editedBy : 1,
        createdBy : 1,
        archived : 1
    };

    this.create = function(req, res, next) {
        function queryRun(body, callback) {
            const files = req.files ? req.files : null;
            const session = req.session;
            const userId = session.uId;
            const configurationId = body.configuration;

            async.waterfall([

                // retrieve retail segment which has configuration name by provided configuration id
                (cb) => {
                    RetailSegmentModel.findOne({ 'configurations._id': configurationId }, 'configurations', cb)
                },

                // pick configuraiton name from result set and upload attached picture
                function(retailSegment, cb) {
                    const configurationName = retailSegment.configurations.filter((item) => {
                        return `${item._id}` === configurationId;
                    }).map((item) => {
                        return item.configuration;
                    }).pop();

                    if (!configurationName) {
                        return cb('No such configuration found.');
                    }

                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.PLANOGRAM, (err, fileId) => {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, {
                            fileId: fileId.pop(),
                            configurationName
                        });
                    });
                },
                function(options, cb) {
                    const configurationName = options.configurationName;
                    const fileId = options.fileId;
                    const createdBy = {
                        user : ObjectId(userId),
                        date : new Date()
                    };

                    const dataToSave = Object.assign({}, body, {
                        fileID: fileId,
                        configuration: {
                            _id : configurationId,
                            name : configurationName
                        },
                        createdBy,
                        editedBy: createdBy
                    });

                    const model = new PlanogramModel();

                    model.set(dataToSave);

                    model.save((err, model, numAffected) => {
                        // tip: do not remove numAffected
                        if  (err) {
                            return cb(err);
                        }

                        cb(null, model);
                    });
                },
                function(planogramModel, cb) {
                    var id = planogramModel.get('_id');

                    self.getByIdAggr({
                        id : id,
                        isMobile : req.isMobile
                    }, cb);
                }

            ], callback);
        }

        async.waterfall([

            async.apply(access.getWriteAccess, req, ACL_MODULES.PLANOGRAM),

            (allowed, entity, cb) => {
                let body = req.body;

                try {
                    if (req.body.data) {
                        body = JSON.parse(req.body.data);
                    } else {
                        body = req.body;
                    }
                } catch (err) {
                    return cb(err);
                }

                cb(null, body);
            },

            (body, cb) => {
                bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.PLANOGRAM, 'create', (err, saveData) => {
                    if (err) {
                        return cb(err);
                    }

                    queryRun(saveData, cb);
                });
            }

        ], function(err, result) {
            if (err) {
                return next(err);
            }

            event.emit('activityChange', {
                module : ACL_MODULES.PLANOGRAM,
                actionType : ACTIVITY_TYPES.CREATED,
                createdBy : result.createdBy,
                itemId : result._id,
                itemType : CONTENT_TYPES.PLANOGRAM
            });

            res.status(201).send(result);
        });
    };

    this.getByIdAggr = function(options, callback) {
        var aggregateHelper;
        var pipeLine = [];
        var aggregation;
        var id = options.id || '';
        var isMobile = options.isMobile || false;

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match : {_id : id}
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'files',
            key : 'fileID',
            addProjection : ['contentType', 'originalName', 'createdBy'],
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'createdBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings : {createdBy : {date : 1}}
        }));

        if (!isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'accessRoles',
                key : 'createdBy.user.accessRole',
                isArray : false,
                addProjection : ['_id', 'name', 'level'],
                includeSiblings : {
                    createdBy : {
                        date : 1,
                        user : {
                            _id : 1,
                            position : 1,
                            firstName : 1,
                            lastName : 1
                        }
                    }
                }
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'positions',
                key : 'createdBy.user.position',
                isArray : false,
                includeSiblings : {
                    createdBy : {
                        date : 1,
                        user : {
                            _id : 1,
                            accessRole : 1,
                            firstName : 1,
                            lastName : 1
                        }
                    }
                }
            }));

        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'categories',
            key : 'product',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'country',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'retailSegments',
            key : 'retailSegment',
            isArray : true
        }));

        aggregation = PlanogramModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse : true
        };

        aggregation.exec(function(err, response) {
            var options = {
                data : {}
            };
            var personnelIds = [];
            var fileIds = [];

            if (err) {
                return callback(err);
            }

            if (!response.length) {
                return callback(null, {});
            }

            response = response[0];

            personnelIds.push(response.createdBy.user._id);
            fileIds.push(response.fileID._id);

            options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
            options.data[CONTENT_TYPES.FILES] = fileIds;

            getImagesHelper.getImages(options, function(err, result) {
                var fieldNames = {};
                var setOptions;
                if (err) {
                    return callback(err);
                }

                setOptions = {
                    response : response,
                    imgsObject : result
                };
                fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                fieldNames[CONTENT_TYPES.FILES] = ['fileID'];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, function(response) {
                    callback(null, response);
                })
            });
        });
    };

    this.archive = function(req, res, next) {
        function queryRun() {
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var uId = req.session.uId;
            var editedBy = {
                user : req.session.uId,
                date : Date.now()
            };
            var type = ACTIVITY_TYPES.ARCHIVED;
            var options = [
                {
                    idsToArchive : idsToArchive,
                    keyForCondition : '_id',
                    archived : archived,
                    model : PlanogramModel
                }
            ];
            if (!archived) {
                type = ACTIVITY_TYPES.UNARCHIVED;
            }

            archiver.archive(uId, options, function(err) {
                if (err) {
                    return next(err);
                }
                async.eachSeries(idsToArchive, function(item, callback) {
                    event.emit('activityChange', {
                        module : ACL_MODULES.PLANOGRAM,
                        actionType : type,
                        createdBy : editedBy,
                        itemId : item,
                        itemType : CONTENT_TYPES.PLANOGRAM
                    });
                    callback();

                }, function(err) {
                    if (err) {
                        logWriter.log('planogram archived error', err);
                    }
                });


                res.status(200).send();
            });
        }

        access.getArchiveAccess(req, ACL_MODULES.PLANOGRAM, function(err, allowed) {
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

    this.getById = function(req, res, next) {
        function queryRun() {
            var id = req.params.id;

            self.getByIdAggr({
                id : ObjectId(id),
                isMobile : req.isMobile
            }, function(err, model) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(model);
            })
        }

        access.getReadAccess(req, ACL_MODULES.PLANOGRAM, function(err, allowed) {
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
            $match : queryObject
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'createdBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings : {createdBy : {date : 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'accessRoles',
            key : 'createdBy.user.accessRole',
            isArray : false,
            addProjection : ['_id', 'name', 'level'],
            includeSiblings : {
                createdBy : {
                    date : 1,
                    user : {
                        _id : 1,
                        position : 1,
                        firstName : 1,
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'positions',
            key : 'createdBy.user.position',
            isArray : false,
            includeSiblings : {
                createdBy : {
                    date : 1,
                    user : {
                        _id : 1,
                        accessRole : 1,
                        firstName : 1,
                        lastName : 1
                    }
                }
            }
        }));

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'personnels',
                key : 'editedBy.user',
                isArray : false,
                addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
                includeSiblings : {editedBy : {date : 1}}
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'accessRoles',
                key : 'editedBy.user.accessRole',
                isArray : false,
                addProjection : ['_id', 'name', 'level'],
                includeSiblings : {
                    editedBy : {
                        date : 1,
                        user : {
                            _id : 1,
                            position : 1,
                            firstName : 1,
                            lastName : 1
                        }
                    }
                }
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'positions',
                key : 'editedBy.user.position',
                isArray : false,
                includeSiblings : {
                    editedBy : {
                        date : 1,
                        user : {
                            _id : 1,
                            accessRole : 1,
                            firstName : 1,
                            lastName : 1
                        }
                    }
                }
            }));
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'country',
            isArray : false,
            addProjection : ['archived']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'retailSegments',
            key              : 'retailSegment',
            isArray          : true,
            addProjection : ['archived']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'categories',
            key : 'product',
            isArray : false,
            addProjection : ['archived']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'files',
            key : 'fileID',
            addProjection : ['contentType', 'originalName', 'createdBy'],
            isArray : false
        }));

        if (!isMobile) {
            pipeLine.push({
                $match : {
                    'retailSegment.archived' : false,
                    'product.archived' : false,
                    'country.archived' : false
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile : isMobile,
            searchFieldsArray : searchFieldsArray,
            filterSearch : filterSearch,
            skip : skip,
            limit : limit,
            sort : sort
        }));

        return pipeLine;
    }

    this.getAllForSync = function(req, res, next) {
        function queryRun() {
            var query = req.query;
            var isMobile = req.isMobile;
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper = new AggregationHelper($defProjection);
            var sort = {'createdBy.date' : -1};
            var queryObject = {};
            var pipeLine;
            var aggregation;
            var ids;

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function(id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in : ids
                };
            }
            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = getAllPipeLine({
                queryObject : queryObject,
                aggregateHelper : aggregateHelper,
                isMobile : isMobile,
                forSync : true,
                sort : sort
            });

            aggregation = PlanogramModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse : true
            };

            aggregation.exec(function(err, response) {
                var options = {
                    data : {}
                };
                var personnelIds = [];
                var fileIds = [];

                if (err) {
                    return next(err);
                }

                response = response && response.length ? response[0] : {
                    data : [],
                    total : 0
                };

                if (!response.data.length) {
                    return next({
                        status : 200,
                        body : response
                    });
                }

                _.map(response.data, function(element) {
                    personnelIds.push(element.createdBy.user._id);
                    fileIds.push(element.fileID._id);
                });

                personnelIds = _.uniqBy(personnelIds, 'id');

                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.FILES] = fileIds;

                getImagesHelper.getImages(options, function(err, result) {
                    var fieldNames = {};
                    var setOptions;
                    if (err) {
                        return next(err);
                    }

                    setOptions = {
                        response : response,
                        imgsObject : result
                    };
                    fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                    fieldNames[CONTENT_TYPES.FILES] = ['fileID'];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function(response) {
                        next({
                            status : 200,
                            body : response
                        });
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PLANOGRAM, function(err, allowed) {
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

    this.getAll = function(req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var page = query.page || 1;
            var limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var queryObject = query.filter || {};
            var filterSearch = queryObject.globalSearch || '';
            var isMobile = req.isMobile;
            var parallelTasks;
            var aggregateHelper;
            var key;

            var searchFieldsArray = [
                'country.name.en',
                'country.name.ar',
                'retailSegment.name.en',
                'retailSegment.name.ar',
                'category.name.en',
                'category.name.ar',
                'configuration'
            ];

            var sort = query.sort || {
                    'editedBy.date' : 1
                };

            delete queryObject.globalSearch;

            if (query.filter.configuration) {
                query.filter['configuration._id'] = query.filter.configuration;
                delete query.filter.configuration;
            }

            queryObject = filterMapper.mapFilter({
                contentType : CONTENT_TYPES.PLANOGRAM,
                filter : query.filter || {},
                personnel : personnel
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

            function contentFinder(parallelCb) {
                var aggregation;

                var pipeLine = getAllPipeLine({
                    queryObject : queryObject,
                    aggregateHelper : aggregateHelper,
                    isMobile : isMobile,
                    searchFieldsArray : searchFieldsArray,
                    filterSearch : filterSearch,
                    skip : skip,
                    limit : limit,
                    sort : sort
                });

                aggregation = PlanogramModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse : true
                };

                aggregation.exec(function(err, result) {
                    if (err) {
                        return parallelCb(err);
                    }

                    parallelCb(null, result);
                });

            }

            parallelTasks = {
                data : contentFinder
            };

            async.parallel(parallelTasks, function(err, response) {
                var options = {
                    data : {}
                };
                var personnelIds = [];
                var fileIds = [];

                if (err) {
                    return next(err);
                }

                response = response && response.data && response.data.length ? response.data[0] : {
                    data : [],
                    total : 0
                };

                if (!response.data.length) {
                    return next({
                        status : 200,
                        body : response
                    });
                }

                _.map(response.data, function(element) {
                    personnelIds.push(element.createdBy.user._id);
                    if (element.fileID && element.fileID._id) {
                        fileIds.push(element.fileID._id);
                    }
                });

                personnelIds = _.uniqBy(personnelIds, 'id');

                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.FILES] = fileIds;

                getImagesHelper.getImages(options, function(err, result) {
                    var fieldNames = {};
                    var setOptions;
                    if (err) {
                        return next(err);
                    }

                    setOptions = {
                        response : response,
                        imgsObject : result
                    };
                    fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                    fieldNames[CONTENT_TYPES.FILES] = ['fileID'];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function(response) {
                        next({
                            status : 200,
                            body : response
                        });
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PLANOGRAM, function(err, allowed, personnel) {
            if (err) {
                return next(err);
            }

            queryRun(personnel);
        });
    };

    this.update = function(req, res, next) {
        function queryRun(body) {
            var files = req.files.inputImg.name ? req.files : null;
            var userId = req.session.uId;
            var id = req.params.id;

            body.editedBy = {
                user : ObjectId(userId),
                date : new Date()
            };

            async.waterfall([
                function(callback) {
                    if (!files) {
                        return callback(null, null);
                    }
                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.PLANOGRAM, function(err, fileId) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, fileId[0]);
                    })
                },
                function(fileId, callback) {
                    if (fileId) {
                        body.fileID = fileId;
                    }
                    PlanogramModel.findByIdAndUpdate(id, {$set : body}, {new : true})
                        .exec(function(err, model) {
                            if (err) {
                                return callback(err);
                            }

                            event.emit('activityChange', {
                                module : ACL_MODULES.PLANOGRAM,
                                actionType : ACTIVITY_TYPES.UPDATED,
                                createdBy : body.editedBy,
                                itemId : id,
                                itemType : CONTENT_TYPES.PLANOGRAM
                            });

                            callback(null, model);
                        });
                },
                function(model, callback) {
                    var id = model.get('_id');

                    self.getByIdAggr({
                        id : id,
                        isMobile : req.isMobile
                    }, callback);
                }

            ], function(err, model) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(model);
            });
        }

        access.getEditAccess(req, ACL_MODULES.COMPETITOR_LIST, function(err) {
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


            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.PLANOGRAM, 'update', function(err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

};
module.exports = planogramsHandler;