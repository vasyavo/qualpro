const ActivityLog = require('./../stories/push-notifications/activityLog');

var CompetitorBranding = function(db, redis, event) {
    const logger = require('../utils/logger');
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var CompetitorPromotionModel = require('./../types/competitorPromotion/model');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var access = require('../helpers/access')(db);
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
    var FileModel = require('./../types/file/model');
    var bodyValidator = require('../helpers/bodyValidator');
    var CommentHandler = require('./comment');
    var commentHandler = new CommentHandler(db);
    var commentCreator = commentHandler.commentCreator;

    var self = this;

    var $defProjection = {
        _id : 1,
        description : 1,
        category : 1,
        brand : 1,
        country : 1,
        region : 1,
        subRegion : 1,
        retailSegment : 1,
        outlet : 1,
        branch : 1,
        origin : 1,
        promotion : 1,
        price : 1,
        packing : 1,
        packingType : 1,
        expiry : 1,
        displayType : 1,
        dateStart : 1,
        dateEnd : 1,
        archived : 1,
        createdBy : 1,
        editedBy : 1,
        attachments : 1,
        comments : 1
    };

    this.create = function(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var files = req.files;

            async.waterfall([
                function(cb) {
                    let createdBy = {
                        user : req.session.uId,
                        date : new Date()
                    };

                    if (body.description) {
                        body.description = {
                            en : _.escape(body.description.en),
                            ar : _.escape(body.description.ar)
                        };
                    }
                    if (body.promotion) {
                        body.promotion = _.escape(body.promotion);
                    }
                    if (body.price) {
                        body.price = _.escape(body.price);
                    }
                    if (body.packing) {
                        body.packing = _.escape(body.packing);
                    }
                    let competitorPromotion = {
                        description : body.description,
                        category : body.category,
                        brand : body.brand,
                        country : body.country,
                        region : body.region,
                        subRegion : body.subRegion,
                        retailSegment : body.retailSegment,
                        outlet : body.outlet,
                        branch : body.branch,
                        origin : body.origin,
                        promotion : body.promotion,
                        price : body.price,
                        packing : body.packing,
                        packingType : body.packingType,
                        expiry : body.expiry,
                        displayType : body.displayType,
                        dateStart : body.dateStart,
                        dateEnd : body.dateEnd,
                        createdBy : createdBy,
                        editedBy : createdBy
                    };

                    CompetitorPromotionModel.create(competitorPromotion, (err, model) => {
                        if (err) {
                            return cb(err);
                        }

                        // fire and forget
                        res.status(201).send(model);

                        cb(null, model);
                    });
                },

                function (model, cb) {
                    if (!files) {
                        return cb(null, model, []);
                    }

                    // TODO: change bucket from constants
                    fileHandler.uploadFile(userId, files, 'competitorPromotion', (err, fileIds) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, model, fileIds);
                    });
                },

                function (model, fileIds, cb) {
                    model.set('attachments', fileIds);
                    model.save((err, model) => {
                        if (err) {
                            return cb(err);
                        }

                        ActivityLog.emit('reporting:competitor-promotion-activities:published', {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body : model.toJSON()
                        });

                        cb(null, model);
                    });
                },

                function(model, cb) {
                    if (body.commentText) {
                        body.commentText = _.escape(body.commentText);
                    }
                    var saveObj = {
                        text : body.commentText,
                        objectiveId : model._id,
                        userId : userId
                    };

                    commentCreator(saveObj, CompetitorPromotionModel, function(err, comment) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, model, comment);
                    });
                },

                function(model, comment, cb) {
                    CompetitorPromotionModel.findByIdAndUpdate(model._id, {$push : {comments : comment._id}}, {new : true}, cb);
                }

            ], function(err, result) {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }

                    return logger.error(err);
                }
            });
        }

        access.getWriteAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function(err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMPETITORPROMOTION, 'create', function(err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAll = function(req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var filter = query.filter || {};
            var page = query.page || 1;
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
                'category.name.en',
                'category.name.ar',
                'description.en',
                'description.ar',
                'displayType',
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
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'createdBy.user.accessRole.name.en',
                'createdBy.user.accessRole.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar'
            ];

            delete filter.globalSearch;

            queryObject = query.filter ? filterMapper.mapFilter({
                contentType : CONTENT_TYPES.COMPETITORPROMOTION,
                filter : filter,
                personnel : personnel
            }) : {};

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {
                    'createdBy.user.position' : queryObject.position
                };

                delete queryObject.position;
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine = getAllPipeline({
                aggregateHelper : aggregateHelper,
                queryObject : queryObject,
                positionFilter : positionFilter,
                searchFieldsArray : searchFieldsArray,
                filterSearch : filterSearch,
                skip : skip,
                limit : limit
            });

            aggregation = CompetitorPromotionModel.aggregate(pipeLine);

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

                response = response && response[0] ? response[0] : {
                    data : [],
                    total : 0
                };

                response.data = _.map(response.data, function(model) {
                    if (model.description) {
                        model.description = {
                            ar : _.unescape(model.description.ar),
                            en : _.unescape(model.description.en)
                        };
                    }
                    if (model.promotion) {
                        model.promotion = _.unescape(model.promotion);
                    }
                    if (model.price) {
                        model.price = _.unescape(model.price);
                    }
                    if (model.packing) {
                        model.packing = _.unescape(model.packing);
                    }
                    personnelIds.push(model.createdBy.user._id);
                    fileIds = _.union(fileIds, _.map(model.attachments, '_id'));

                    return model;
                });

                if (!response.data.length) {
                    return next({
                        status : 200,
                        body : response
                    });
                }

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
                    fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
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

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function(err, allowed, personnel) {
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

    this.getById = function(req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);
            var isMobile = req.isMobile;

            self.getByIdAggr({
                id,
                isMobile
            }, function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function(err, allowed) {
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

    function getAllPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var isMobile = options.isMobile;
        var skip = options.skip;
        var limit = options.limit;
        var forSync = options.forSync;
        var employeeFilter = queryObject.personnel ? {'createdBy.user' : _.pick(queryObject, 'personnel').personnel} : {};
        var pipeLine = [];

        delete queryObject.personnel;

        pipeLine.push({
            $match : queryObject
        });

        pipeLine.push({
            $match : employeeFilter
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'files',
            key : 'attachments',
            addProjection : ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'country',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'region',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'subRegion',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'retailSegments',
            key : 'retailSegment',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'outlets',
            key : 'outlet',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'branches',
            key : 'branch',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'categories',
            key : 'category'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'origins',
            key : 'origin'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'brands',
            key : 'brand',
            isArray : false
        }));

        pipeLine.push({
            $unwind : {
                path : '$displayType'
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'displayTypes',
            key : 'displayType',
            isArray : true,
            addProjection : ['_id', 'name']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'createdBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings : {createdBy : {date : 1}}
        }));

        if (positionFilter) {
            pipeLine.push({
                $match : positionFilter
            });
        }

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

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile : isMobile,
            searchFieldsArray : searchFieldsArray,
            filterSearch : filterSearch,
            skip : skip,
            limit : limit
        }));

        return pipeLine;
    }

    this.getByIdAggr = function(options, callback) {
        var aggregateHelper;
        var pipeLine = [];
        var aggregation;
        var isMobile = options.isMobile;
        var id = options.id || '';

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match : {_id : id}
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'files',
            key : 'attachments',
            addProjection : ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'country',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'region',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'subRegion',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'retailSegments',
            key : 'retailSegment',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'outlets',
            key : 'outlet',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'branches',
            key : 'branch',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'categories',
            key : 'category'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'brands',
            key : 'brand',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'origins',
            key : 'origin'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'displayTypes',
            key : 'displayType',
            isArray : true
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

        aggregation = CompetitorPromotionModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse : true
        };

        aggregation.exec(function(err, response) {
            var options = {
                data : {}
            };
            var personnelIds = [];
            var fileIds;
            if (err) {
                return callback(err);
            }

            if (!response || !response.length) {
                return callback(null, response);
            }

            response = response ? response[0] : {};

            if (response.description) {
                response.description = {
                    ar : _.unescape(response.description.ar),
                    en : _.unescape(response.description.en)
                };
            }
            if (response.promotion) {
                response.promotion = _.unescape(response.promotion);
            }
            if (response.price) {
                response.price = _.unescape(response.price);
            }
            if (response.packing) {
                response.packing = _.unescape(response.packing);
            }

            personnelIds.push(response.createdBy.user._id);
            fileIds = _.map(response.attachments, '_id');

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
                fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, function(response) {
                    callback(null, response);
                })
            });
        });
    }
};
module.exports = CompetitorBranding;
