var Promotions = function (db, redis, event) {
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var VALIDATION = require('../public/js/constants/validation.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var modelAndSchemaName = CONTENT_TYPES.PROMOTIONS;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImageHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImageHelper(db);
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')(db);
    var bodyValidator = require('../helpers/bodyValidator');

    var self = this;

    var $defProjection = {
        _id          : 1,
        promotionType: 1,
        category     : 1,
        country      : 1,
        currency     : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        branch       : 1,
        displayType  : 1,
        barcode      : 1,
        packing      : 1,
        ppt          : 1,
        quantity     : 1,
        dateStart    : 1,
        dateEnd      : 1,
        attachments  : 1,
        status       : 1,
        createdBy    : 1,
        editedBy     : 1
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

        if (isMobile) {
            queryObject.status = {
                $nin: ['draft', 'expired']
            };
        } else {
            queryObject.status = {
                $ne: 'expired'
            };
        }

        pipeLine.push({
            $match: queryObject
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'domains',
            key              : 'country',
            isArray          : false,
            addMainProjection: ['currency']
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
            from   : 'displayTypes',
            key    : 'displayType',
            isArray: false
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

        /*pipeLine.push({
            $project: aggregateHelper.getProjection({
                lastDate: {
                    $ifNull: [
                        '$editedBy.date',
                        '$createdBy.date'
                    ]
                }
            })
        });

        if (!forSync) {
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
            limit            : limit
        }));

        return pipeLine;
    }

    this.create = function (req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var session = req.session;
            var userId = session.uId;
            var savePromotion = body.savePromotion;
            var functions;

            var keys = Object.keys(body);
            keys.forEach(function (key) {
                if (_.indexOf(['region', 'subRegion', 'retailSegment', 'outlet', 'branch'], key) !== -1) {
                    if (typeof body[key] === 'string') {
                        body[key] = body[key].split(',');
                        body[key] = body[key].objectID();
                    } else if (_.indexOf(['category', 'country'], key) !== -1) {
                        body[key] = ObjectId(body[key]);
                    }
                }
            });

            function uploadFiles(files, body, userId, cb) {
                if (!files) {
                    return cb(null, [], body, userId);
                }

                fileHandler.uploadFile(userId, files, 'promotions', function (err, filesIds) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, filesIds, body, userId);
                });
            }

            function createPromotion(filesIds, body, userId, cb) {
                var createdBy = {
                    user: ObjectId(userId),
                    date: new Date()
                };
                var model;

                body.attachments = filesIds;
                body.createdBy = createdBy;
                body.editedBy = createdBy;
                body.status = savePromotion ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;
                body.promotionType = {
                    en: _.escape(body.promotionType.en),
                    ar: _.escape(body.promotionType.ar)
                };

                model = new Model(body);
                model.save(function (err, model) {
                    if (err) {
                        return cb(err);
                    }

                    event.emit('activityChange', {
                        module    : ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
                        actionType: ACTIVITY_TYPES.CREATED,
                        createdBy : body.createdBy,
                        itemId    : model._id,
                        itemType  : CONTENT_TYPES.PROMOTIONS
                    });

                    cb(null, model);
                });
            }

            function getPromotionAggr(model, cb) {
                var id = model.get('_id');

                self.getByIdAggr({id: id, isMobile: req.isMobile}, cb);
            }

            functions = [].concat(async.apply(uploadFiles, files, body, userId), createPromotion, getPromotionAggr);

            async.waterfall(functions, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.AL_ALALI_PROMO_EVALUATION, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.PROMOTIONS, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var filter = query.filter || {};
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var lastLogOut = new Date(query.lastLogOut);
            var queryObject;
            var pipeLine;
            var positionFilter;
            var aggregation;
            var ids;

            filterMapper.setFilterLocation(filter, personnel, 'branch', null);
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.PROMOTIONS,
                filter     : filter,
                personnel  : personnel
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

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = getAllPipeline({
                aggregateHelper: aggregateHelper,
                queryObject    : queryObject,
                positionFilter : positionFilter,
                isMobile       : req.isMobile,
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

                response = response && response.length ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                response.data = _.map(response.data, function (element) {
                    if (element.promotionType) {
                        element.promotionType = {
                            ar: _.unescape(element.promotionType.ar),
                            en: _.unescape(element.promotionType.en)
                        };
                    }

                    personnelIds.push(element.createdBy.user._id);
                    fileIds = _.union(fileIds, _.map(element.attachments, '_id'));

                    return element;
                });

                personnelIds = _.uniqBy(personnelIds, 'id');

                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.FILES] = fileIds;

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
                    fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.REPORTING, function (err, allowed, personnel) {
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

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
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
                'promotionType.en',
                'promotionType.ar',
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
                'category.name.en',
                'category.name.ar',
                'displayType.name.en',
                'displayType.name.ar',
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'createdBy.user.accessRole.name.en',
                'createdBy.user.accessRole.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar',
                'currency'
            ];

            delete filter.globalSearch;

            queryObject = filterMapper
                .mapFilter({
                    contentType: CONTENT_TYPES.PROMOTIONS,
                    filter     : filter,
                    personnel  : personnel
                });

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

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

                response = response && response.length ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                response.data = _.map(response.data, function (element) {
                    if (element.promotionType) {
                        element.promotionType = {
                            ar: _.unescape(element.promotionType.ar),
                            en: _.unescape(element.promotionType.en)
                        };
                    }

                    personnelIds.push(element.createdBy.user._id);
                    fileIds = _.union(fileIds, _.map(element.attachments, '_id'));

                    return element;
                });

                personnelIds = _.uniqBy(personnelIds, 'id');

                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.FILES] = fileIds;

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
                    fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.REPORTING, function (err, allowed, personnel) {
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

    this.update = function (req, res, next) {
        function queryRun(updateObject) {
            var files = req.files;
            var filesPresence = Object.keys(files).length;
            var attachPresence = updateObject.attachments;
            var both = attachPresence && filesPresence;
            var session = req.session;
            var userId = session.uId;
            var promotionId = req.params.id;
            var savePromotion = updateObject.savePromotion;
            var fullUpdate = {
                $set: updateObject
            };


            async.waterfall([

                function (cb) {
                    if (!filesPresence) {
                        return cb(null, null);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.PROMOTIONS, function (err, filesIds) {
                        if (err) {
                            return cb(err);
                        }

                        return cb(null, filesIds);
                    });
                },

                function (filesIds, cb) {
                    updateObject.editedBy = {
                        user: ObjectId(userId),
                        date: new Date()
                    };
                    var quantity = updateObject.quantity;
                    var barcode = updateObject.barcode;
                    var packing = updateObject.packing;
                    var subRegion = updateObject.subRegion;
                    var retailSegment = updateObject.retailSegment;
                    var region = updateObject.region;
                    var ppt = updateObject.ppt;
                    var outlet = updateObject.outlet;
                    var branch = updateObject.branch;

                    if (quantity) {
                        updateObject.quantity = _.escape(quantity);
                    }
                    if (barcode) {
                        updateObject.barcode = _.escape(barcode);
                    }
                    if (packing) {
                        updateObject.packing = _.escape(packing);
                    }
                    if (ppt) {
                        updateObject.ppt = _.escape(ppt);
                    }
                    if (outlet) {
                        updateObject.outlet = outlet.split(',');
                    }
                    if (region) {
                        updateObject.region = updateObject.region.split(',');
                    }
                    if (subRegion) {
                        updateObject.subRegion = updateObject.subRegion.split(',');
                    }
                    if (retailSegment) {
                        updateObject.retailSegment = updateObject.retailSegment.split(',');
                    }
                    if (branch) {
                        updateObject.branch = branch.split(',');
                    }
                    if (!filesPresence && attachPresence) {
                        filesIds = updateObject.attachments.objectID();
                    }
                    if (filesIds) {
                        updateObject.attachments = both ? _.union(filesIds, updateObject.attachments.objectID()) : filesIds;
                    }

                    Model.findOne({_id: promotionId}, function (err, promotionModel) {
                        var error;
                        var deletedAttachments = [];
                        var promotionModel = promotionModel;
                        var fileIdsBackend = promotionModel.toObject();
                        fileIdsBackend = fileIdsBackend.attachments.fromObjectID();


                        if (err) {
                            return cb(err);
                        }
                        if (!promotionModel) {
                            error = new Error('Promotion not found');
                            error.status = 400;
                            return cb(error);
                        }

                        async.waterfall([
                            function (callback) {
                                updateObject.status = savePromotion ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;

                                if (updateObject.promotionType) {
                                    if (updateObject.promotionType.en) {
                                        updateObject.promotionType.en = _.escape(updateObject.promotionType.en);
                                    }
                                    if (updateObject.promotionType.ar) {
                                        updateObject.promotionType.ar = _.escape(updateObject.promotionType.ar);
                                    }
                                }

                                if (filesPresence && !both) {
                                    fullUpdate.$addToSet = {};
                                    fullUpdate.$addToSet.attachments = {$each: updateObject.attachments};
                                    delete updateObject.attachments;
                                }

                                Model.findByIdAndUpdate(promotionId, fullUpdate, {new: true}, function (err, result) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    var fileIdsBackendNew = result.toObject();
                                    fileIdsBackendNew = fileIdsBackendNew.attachments.fromObjectID();
                                    deletedAttachments = _.difference(fileIdsBackend, fileIdsBackendNew);
                                    promotionModel = result;
                                    return callback(null, deletedAttachments);
                                });
                            },
                            function (deletedAttachments, callback) {
                                if (!deletedAttachments.length || !filesIds) {
                                    return callback(null, null);
                                }

                                fileHandler.deleteFew(deletedAttachments, function (err, result) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    return callback(null);
                                })
                            }
                        ], function (err, result) {
                            if (err) {
                                return cb(err);
                            }
                            event.emit('activityChange', {
                                module    : ACL_MODULES.AL_ALALI_PROMO_EVALUATION,
                                actionType: ACTIVITY_TYPES.UPDATED,
                                createdBy : updateObject.editedBy,
                                itemId    : promotionId,
                                itemType  : CONTENT_TYPES.PROMOTIONS
                            });
                            return cb(null, promotionModel._id);
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

        access.getEditAccess(req, ACL_MODULES.REPORTING, function (err, allowed) {
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

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.PROMOTIONS, 'update', function (err, saveData) {
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
            var isMobile = req.isMobile;
            var error;

            if (!VALIDATION.OBJECT_ID.test(id)) {
                error = new Error('Invalid parameter id');
                error.status = 400;
                return next(error);
            }

            self.getByIdAggr({id: ObjectId(id), isMobile: isMobile}, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.REPORTING, function (err, allowed) {
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
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            isArray: false
        }));

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
            from   : 'displayTypes',
            key    : 'displayType',
            isArray: false
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
                return callback(null, {});
            }

            response = response[0];

            if (response.promotionType) {
                response.promotionType = {
                    ar: _.unescape(response.promotionType.ar),
                    en: _.unescape(response.promotionType.en)
                };
            }

            personnelIds.push(response.createdBy.user._id);
            fileIds = _.map(response.attachments, '_id');
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
                    callback(null, response);
                })
            });
        });
    };
};

module.exports = Promotions;
