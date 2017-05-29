const ActivityLog = require('./../stories/push-notifications/activityLog');

var CompetitorBranding = function() {
    const logger = require('../utils/logger');
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var CompetitorBrandingModel = require('./../types/competitorBranding/model');
    var EventModel = require('./../types/event/model');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler();
    var access = require('../helpers/access')();
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
    var bodyValidator = require('../helpers/bodyValidator');
    const errorSender = require('../utils/errorSender');
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
        location : 1,
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
            var competitorBrand;

            async.waterfall([
                function(cb) {
                    var createdBy = {
                        user : userId,
                        date : new Date()
                    };
                    if (body.description) {
                        body.description = {
                            en : _.escape(body.description.en),
                            ar : _.escape(body.description.ar)
                        };
                    }
                    if (body.location) {
                        body.location = {
                            en : _.escape(body.location.en),
                            ar : _.escape(body.location.ar)
                        };
                    }

                    competitorBrand = {
                        description : body.description,
                        category : body.category,
                        brand : body.brand,
                        country : body.country,
                        region : body.region,
                        subRegion : body.subRegion,
                        retailSegment : body.retailSegment,
                        outlet : body.outlet,
                        branch : body.branch,
                        location : body.location,
                        displayType : body.displayType,
                        dateStart : body.dateStart,
                        dateEnd : body.dateEnd,
                        createdBy: createdBy,
                        editedBy : createdBy
                    };

                    CompetitorBrandingModel.create(competitorBrand, function (err, model) {
                        if (err) {
                            return cb(err);
                        }

                        // fire and forget
                        res.status(201).send(model);

                        cb(null, model);
                    });
                },

                function(model, cb) {
                    if (!files) {
                        return cb(null, model, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.COMPETITORS, function(err, filesIds) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, model, filesIds);
                    });
                },

                function(model, filesIds, cb) {
                    model.set('attachments', filesIds);
                    model.save(cb);
                }
            ], function(err, model) {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }

                    return logger.error(err);
                }

                ActivityLog.emit('reporting:competitor-branding-and-display-report:published', {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body : model.toJSON()
                });
            });

        }

        var body;

        try {
            if (req.body.data) {
                body = JSON.parse(req.body.data);
            } else {
                body = req.body;
            }
        } catch (err) {
            return next(err);
        }

        bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMPETITORBRANDING, 'create', function(err, saveData) {
            if (err) {
                return next(err);
            }

            queryRun(saveData);
        });

    };
    
    this.removeItem = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const id = req.params.id;
        
        const queryRun = (callback) => {
            async.waterfall([
                
                (cb) => {
                    CompetitorBrandingModel.findOne({ _id : id }).lean().exec(cb);
                },
                (removeItem, cb) => {
                    const eventModel = new EventModel();
                    const options = {
                        headers: {
                            contentType: "CompetitorBranding",
                            actionType : "remove",
                            user       : userId,
                        },
                        payload: removeItem
                    };
                    eventModel.set(options);
                    eventModel.save((err) => {
                        cb(null, err);
                    });
                },
                (err) => {
                    if (err) {
                        if (!res.headersSent) {
                            next(err);
                        }
                        
                        return logger.error(err);
                    }
    
                    CompetitorBrandingModel.findOneAndRemove({_id: id}, callback)
                },
            ], (err, body) => {
                if (err) {
                    return next(err);
                }
                
                res.status(200).send(body);
            });
        };
        
        async.waterfall([
            (cb) => {
                queryRun(cb);
            }
        ], (err, body) => {
            if (err) {
                return next(err);
            }
            
            res.status(200).send(body);
        });
    };

    this.update = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const requestBody = req.body;
        const id = req.params.id;

        const queryRun = (body, callback) => {
            body.editedBy = {
                user: userId,
                date: Date.now()
            };
            CompetitorBrandingModel.findByIdAndUpdate(id, body, { new: true }).populate('displayType').exec(callback)
        };

        async.waterfall([
            (cb) => {
                bodyValidator.validateBody(requestBody, accessRoleLevel, CONTENT_TYPES.COMPETITORBRANDING, 'update', cb);
            },

            (body, cb) => {
                queryRun(body, cb);
            },

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(body);
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
            var isMobile = req.isMobile;
            var queryObject;
            var pipeLine;
            var aggregation;
            var positionFilter = {};

            var searchFieldsArray = [
                'category.name.en',
                'category.name.ar',
                'description.en',
                'description.ar',
                'displayType.name.en',
                'displayType.name.ar',
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
                'createdBy.user.lastName.ar',
                'brand.name.en',
                'brand.name.ar'
            ];

            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType : CONTENT_TYPES.COMPETITORBRANDING,
                filter : filter,
                personnel : personnel
            });

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
                limit : limit,
                isMobile : isMobile
            });

            aggregation = CompetitorBrandingModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse : true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ?
                    result[0] : { data: [], total: 0 };

                body.data.forEach(model => {
                    if (model.description) {
                        model.description = {
                            en: _.unescape(model.description.en),
                            ar: _.unescape(model.description.ar),
                        };
                    }

                    if (model.location) {
                        model.location = {
                            en: _.unescape(model.location.en),
                            ar: _.unescape(model.location.ar),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function(err, allowed, personnel) {
            if (err) {
                return next(err);
            }

            queryRun(personnel);
        });
    };

    function getAllPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var forSync = options.forSync;
        var isMobile = options.isMobile;
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
            addProjection : ['contentType', 'originalName', 'createdBy', 'preview']
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
            from : 'displayTypes',
            key : 'displayType',
            isArray : true
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'createdBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
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
                        lastName : 1,
                        imageSrc: 1,
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
                        lastName : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'personnels',
                key : 'editedBy.user',
                isArray : false,
                addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
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
                            lastName : 1,
                            imageSrc: 1,
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
                            lastName : 1,
                            imageSrc: 1,
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

    this.getById = function(req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);
            var isMobile = req.isMobile;

            self.getByIdAggr({
                id : id,
                isMobile : isMobile
            }, function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        queryRun();
    };

    this.getByIdAggr = function(options, callback) {
        var aggregateHelper;
        var isMobile = options.isMobile;
        var pipeLine = [];
        var aggregation;
        var id = options.id || '';

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match : {
                _id : id
            }
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

        aggregation = CompetitorBrandingModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse : true
        };

        aggregation.exec((err, result) => {
            if (err) {
                return callback(err);
            }

            const body = result.length ? result[0] : {};

            if (body.description) {
                body.description = {
                    en: _.unescape(body.description.en),
                    ar: _.unescape(body.description.ar),
                };
            }

            if (body.location) {
                body.location = {
                    en: _.unescape(body.location.en),
                    ar: _.unescape(body.location.ar),
                };
            }

            callback(null, body);
        });
    };
};
module.exports = CompetitorBranding;
