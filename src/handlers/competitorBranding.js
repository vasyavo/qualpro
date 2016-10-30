var CompetitorBranding = function (db, redis, event) {
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
    var CompetitorBrandingModel = require('./../types/competitorBranding/model');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var access = require('../helpers/access')(db);
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
    var FileModel = require('./../types/file/model');
    var bodyValidator = require('../helpers/bodyValidator');
    var self = this;

    var $defProjection = {
        _id          : 1,
        description  : 1,
        category     : 1,
        brand        : 1,
        country      : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        branch       : 1,
        location     : 1,
        displayType  : 1,
        dateStart    : 1,
        dateEnd      : 1,
        archived     : 1,
        createdBy    : 1,
        editedBy     : 1,
        attachments  : 1,
        comments     : 1
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var session = req.session;
            var userId = session.uId;
            var model;
            var competitorBrand;

            async.waterfall([

                function (cb) {
                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.COMPETITORS, function (err, filesIds) {
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
                    if (body.description) {
                        body.description = {
                            en: _.escape(body.description.en),
                            ar: _.escape(body.description.ar)
                        };
                    }
                    if (body.location) {
                        body.location = {
                            en: _.escape(body.location.en),
                            ar: _.escape(body.location.ar)
                        };
                    }
                    if (body.displayType) {
                        body.displayType = _.escape(body.displayType);
                    }

                    competitorBrand = {
                        description  : body.description,
                        category     : body.category,
                        brand        : body.brand,
                        country      : body.country,
                        region       : body.region,
                        subRegion    : body.subRegion,
                        retailSegment: body.retailSegment,
                        outlet       : body.outlet,
                        branch       : body.branch,
                        location     : body.location,
                        attachments  : filesIds,
                        displayType  : body.displayType,
                        dateStart    : body.dateStart,
                        dateEnd      : body.dateEnd,
                        createdBy    : createdBy,
                        editedBy     : createdBy
                    };

                    model = new CompetitorBrandingModel(competitorBrand);
                    model.save(function (err, model) {
                        if (err) {
                            return cb(err);
                        }

                        event.emit('activityChange', {
                            module    : ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT,
                            actionType: ACTIVITY_TYPES.CREATED,
                            createdBy : competitorBrand.createdBy,
                            itemId    : model._id,
                            itemType  : CONTENT_TYPES.COMPETITORBRANDING
                        });

                        cb(null, model);
                    });
                },

                function (competitorBrandModel, cb) {
                    var id = competitorBrandModel.get('_id');

                    self.getByIdAggr({id: id}, cb);
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });

        }

        access.getWriteAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMPETITORBRANDING, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAll = function (req, res, next) {
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
                contentType: CONTENT_TYPES.COMPETITORBRANDING,
                filter     : filter,
                personnel  : personnel
            });

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {
                    'createdBy.user.position': queryObject.position
                };

                delete queryObject.position;
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine = getAllPipeline({
                aggregateHelper  : aggregateHelper,
                queryObject      : queryObject,
                positionFilter   : positionFilter,
                searchFieldsArray: searchFieldsArray,
                filterSearch     : filterSearch,
                skip             : skip,
                limit            : limit,
                isMobile         : isMobile
            });

            aggregation = CompetitorBrandingModel.aggregate(pipeLine);

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

                response = response && response[0] ? response[0] : {data: [], total: 0};

                response.data = _.map(response.data, function (model) {
                    if (model.description) {
                        model.description = {
                            en: _.unescape(model.description.en),
                            ar: _.unescape(model.description.ar)
                        };
                    }
                    if (model.location) {
                        model.location = {
                            en: _.unescape(model.location.en),
                            ar: _.unescape(model.location.ar)
                        };
                    }
                    personnelIds.push(model.createdBy.user._id);
                    fileIds = _.union(fileIds, _.map(model.attachments, '_id'));

                    return model;
                });

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

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

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function (err, allowed, personnel) {
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
        var employeeFilter = queryObject.personnel ? {'createdBy.user': _.pick(queryObject, 'personnel').personnel} : {};
        var pipeLine = [];

        delete queryObject.personnel;

        pipeLine.push({
            $match: queryObject
        });

        pipeLine.push({
            $match: employeeFilter
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'region',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'subRegion',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'retailSegment',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'outlet',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'branches',
            key    : 'branch',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key : 'category'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'brands',
            key    : 'brand',
            isArray: false
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

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit
        }));

        return pipeLine;
    }

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);
            var isMobile = req.isMobile;

            self.getByIdAggr({id: id, isMobile: isMobile}, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, function (err, allowed) {
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
        var isMobile = options.isMobile;
        var pipeLine = [];
        var aggregation;
        var id = options.id || '';

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {
                _id: id
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'region',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'subRegion',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'retailSegment',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'outlet',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'branches',
            key    : 'branch',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key : 'category'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'brands',
            key    : 'brand',
            isArray: false
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

        aggregation = CompetitorBrandingModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, response) {
            var options = {
                data: {}
            };
            var personnelIds = [];
            var fileIds;
            var keys;
            if (err) {
                return callback(err);
            }

            if (!response.length) {
                return callback(response);
            }

            response = response && response[0] ? response[0] : {};
            keys = Object.keys(response);

            if (keys.length) {
                if (response.description) {
                    response.description = {
                        en: _.unescape(response.description.en),
                        ar: _.unescape(response.description.ar)
                    };
                }
                if (response.location) {
                    response.location = {
                        en: _.unescape(response.location.en),
                        ar: _.unescape(response.location.ar)
                    };
                }
            }

            if (!keys.length) {
                return callback(null, response);
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
module.exports = CompetitorBranding;
