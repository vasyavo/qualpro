const ActivityLog = require('./../stories/push-notifications/activityLog');

var OutletHandler = function (db, redis, event) {
    var async = require('async');
    var mongoose = require('mongoose');
    var _ = require('lodash');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var OutletModel = require('./../types/outlet/model');
    var BranchesModel = require('./../types/branch/model');
    var DomainModel = require('./../types/domain/model');
    var FilterMapper = require('../helpers/filterMapper');
    var Archiver = require('../helpers/archiver');
    var access = require('../helpers/access')(db);
    var archiver = new Archiver(OutletModel);
    var BranchModel = require('./../types/branch/model');
    var PersonnelModel = require('./../types/personnel/model');
    var SessionModel = require('./../types/session/model');
    var bodyValidator = require('../helpers/bodyValidator');
    var SomeEvents = require('../helpers/someEvents');
    var someEvents = new SomeEvents();
    var logWriter = require('../helpers/logWriter.js');
    var ObjectId = mongoose.Types.ObjectId;
    var $defProjection = {
        _id           : 1,
        name          : 1,
        archived      : 1,
        subRegions    : 1,
        retailSegments: 1,
        createdBy     : 1,
        editedBy      : 1,
        topArchived   : 1,
        translated    : 1
    };
    var self = this;

    this.getSubRegionsByCountryOrRegion = function (filter, type, cb) {
        if (filter[type] || filter.subRegions) {
            return cb(null, null);
        }
        var ids = [];
        var pipeLineInWaterfall = [];
        var aggregation;

        if (filter.country) {
            filter.parent = filter.country;
            delete filter.country;
        }
        if (filter.region) {
            filter.parent = filter.region;
            delete filter.region;
        }

        pipeLineInWaterfall.push({
            $match: filter
        });

        aggregation = DomainModel.aggregate(pipeLineInWaterfall);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function (err, result) {
            if (err) {
                return cb(err);
            }

            _.map(result, function (model) {
                ids.push(model._id);
            });
            cb(null, ids);
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var model;
            var createdBy = {
                user: req.session.uId,
                date: new Date()
            };

            if (!body.imageSrc) {
                delete body.imageSrc;
            }

            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : ''
                }
            }

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            model = new OutletModel(body);
            model.save(function (error, model) {
                if (error) {
                    return next(error);
                }

                ActivityLog.emit('customer:create', {
                    actionOriginator: req.session.uId,
                    accessRoleLevel : req.session.level,
                    body            : model.toJSON()
                });

                if (model && model.name) {
                    model.name = {
                        en: model.name.en ? _.unescape(model.name.en) : '',
                        ar: model.name.ar ? _.unescape(model.name.ar) : ''
                    };
                }

                res.status(201).send(model);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.OUTLET, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            var filter = req.body.filter || {};
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var branches = true;
            var uId = req.session.uId;
            var options = [
                {
                    idsToArchive   : idsToArchive,
                    keyForCondition: '_id',
                    topArchived    : archived,
                    archived       : archived,
                    model          : OutletModel
                }
            ];
            var branchesOption;
            var type = ACTIVITY_TYPES.ARCHIVED;
            var editedBy = {
                user: req.session.uId,
                date: new Date()
            };
            if (!archived) {
                type = ACTIVITY_TYPES.UNARCHIVED;
            }
            if (filter.subRegions) {
                delete options[0].topArchived;
                delete options[0].archived;
            }

            if (req.body.branches) {
                branches = req.body.branches === 'false' ? false : !!req.body.branches;
            }

            if (branches) {
                branchesOption = {
                    keyForCondition: 'outlet',
                    archived       : archived,
                    model          : BranchesModel
                };

                if (filter.subRegions) {
                    branchesOption.topArchived = archived;
                }

                options.push(branchesOption);
            }

            archiver.archive(uId, options, function (err) {
                if (err) {
                    return next(err);
                }

                async.each(idsToArchive, (id, eCb)=>{
                    OutletModel.findById(id)
                        .lean()
                        .exec((err, resp)=>{
                            if (err){
                                return eCb(err)
                            }

                            const bodyObject = {
                                actionOriginator: req.session.uId,
                                accessRoleLevel : req.session.level,
                                body            : resp.toJSON()
                            };

                            ActivityLog.emit('customer:archived', bodyObject);

                            eCb();
                        })
                }, (err)=>{
                    if (err) {
                        logWriter.log('customer archived error', err);
                    }
                });

                if (archived) {
                    someEvents.locationArchived({
                        id       : idsToArchive,
                        type     : CONTENT_TYPES.OUTLET,
                        Personnel: PersonnelModel,
                        Session  : SessionModel,
                        Branch   : BranchModel
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }

                        res.status(200).send();
                    });
                } else {
                    res.status(200).send();
                }
            });
        }

        access.getArchiveAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
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
            var id = req.params.id;

            OutletModel.findById(id)
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    if (result && result.name) {
                        result.name = {
                            en: result.name.en ? _.unescape(result.name.en) : '',
                            ar: result.name.ar ? _.unescape(result.name.ar) : ''
                        }
                    }

                    res.status(200).send(result);
                });
        }

        access.getReadAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
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

    this.getForDD = function (req, res, next) {
        function queryRun() {
            var query = req.query;

            OutletModel.find(query, '_id name').exec(function (err, response) {
                if (err) {
                    return next(err);
                }
                if (response.length) {
                    response = _.map(response, function (element) {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en)
                        };
                        return element;
                    });
                }

                res.status(200).send(response);
            });
        }

        access.getReadAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
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
        var pipeLine = [];
        var skip = options.skip;
        var limit = options.limit;
        var sort = options.sort;
        var isMobile = options.isMobile;
        var queryObject = options.queryObject;
        var translated = options.translated;
        var translateFields = options.translateFields;
        var language = options.language;
        var aggregateHelper = options.aggregateHelper;
        var searchObject = options.searchObject;
        var pipeObject;

        pipeLine.push({
            $match: isMobile ? _.pick(queryObject, 'subRegion', 'retailSegment', 'archived') : _.pick(queryObject, 'subRegions', 'retailSegments', 'archived')
        });

        if (translated && translated.length === 1) {
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

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'outlets',
                key          : 'outlet',
                isArray      : false,
                addProjection: ['createdBy', 'editedBy', 'imageSrc', 'archived', 'topArchived', 'retailSegments', 'subRegions']
            }));

            pipeLine.push({
                $project: {
                    _id           : '$outlet._id',
                    name          : '$outlet.name',
                    createdBy     : '$outlet.createdBy',
                    editedBy      : '$outlet.editedBy',
                    archived      : '$outlet.archived',
                    topArchived   : '$outlet.topArchived',
                    retailSegments: '$outlet.retailSegments',
                    subRegions    : '$outlet.subRegions'
                }
            });
        }

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

            pipeLine.push({
                $group: {
                    _id : null,
                    data: {
                        $addToSet: '$$ROOT'
                    }
                }
            });

            pipeLine.push({
                $unwind: {
                    path                      : '$data',
                    preserveNullAndEmptyArrays: true
                }
            });

            pipeObject = {
                $project: {
                    _id           : '$data._id',
                    editedBy      : '$data.editedBy',
                    retailSegments: '$data.retailSegments',
                    archived      : '$data.archived',
                    topArchived   : '$data.topArchived',
                    total         : '$data.total',
                    name          : '$data.name',
                    createdBy     : '$data.createdBy',
                    subRegions    : '$data.subRegions'
                }
            };

            pipeLine.push(pipeObject);

            pipeLine.push({
                $match: _.pick(queryObject, '$or')
            });
        } else {
            pipeLine.push({
                $match: searchObject
            });
        }

        /*        pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

         if (limit && limit !== -1) {
         pipeLine.push({$sort: sort});
         pipeLine.push({$skip: skip});
         pipeLine.push({$limit: limit});
         }

         pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile: isMobile,
            skip    : skip,
            limit   : limit,
            sort    : sort
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var filter = query.filter || {};
            var lastLogOut = new Date(query.lastLogOut);
            var filterMapper = new FilterMapper();
            var pipeLine;
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.OUTLET,
                filter     : filter,
                personnel  : personnel
            });
            var aggregateHelper;
            var ids;
            var aggregation;

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }

            async.waterfall([
                function (waterfallCb) {
                    self.getSubRegionsByCountryOrRegion(queryObject, 'region', waterfallCb);
                },
                function (regionIds, waterfallCb) {
                    queryObject.region = regionIds ? {$in: regionIds} : queryObject.region;
                    self.getSubRegionsByCountryOrRegion(queryObject, 'subRegion', waterfallCb);
                },
                function (ids, waterfallCb) {
                    if (ids) {
                        if (isMobile) {
                            queryObject.subRegion = {$in: ids};
                        } else {
                            queryObject.subRegions = {$in: ids};
                        }
                    }

                    aggregateHelper = new AggregationHelper($defProjection, queryObject);

                    aggregateHelper.setSyncQuery(queryObject, lastLogOut);

                    pipeLine = getAllPipeLine({
                        aggregateHelper: aggregateHelper,
                        queryObject    : queryObject,
                        isMobile       : isMobile
                    });

                    aggregation = BranchModel.aggregate(pipeLine);
                    aggregation.options = {
                        allowDiskUse: true
                    };
                    aggregation.exec(function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        waterfallCb(null, result);
                    });
                }

            ], function (err, response) {
                var options = {
                    data: {}
                };
                var outletIds = [];

                if (err) {
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                response.data = _.map(response.data, function (element) {
                    if (element.name) {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en)
                        };
                    }

                    outletIds.push(element._id);

                    return element;
                });

                options.data[CONTENT_TYPES.OUTLET] = outletIds;

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
                    fieldNames[CONTENT_TYPES.OUTLET] = [];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, 4, function (err, allowed, personnel) {
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
            var isMobile = req.isMobile;
            var filter = query.filter || {};
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;

            var language = req.cookies.currentLanguage;
            var sortObject = language === 'en' ? {'name.en': 1} : {'name.ar': 1};
            var translateFields = ['name'];
            var translated = (query.filter && query.filter.translated) ? query.filter.translated.values : [];

            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject = !isMobile ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.OUTLET,
                filter     : filter,
                personnel  : personnel
            }) :
                filterMapper.mapFilter({
                    contentType: CONTENT_TYPES.OUTLET,
                    filter     : filter,
                    context    : CONTENT_TYPES.OUTLET,
                    personnel  : personnel
                });

            var key;
            var pipeLine;
            var sort = query.sort || sortObject;
            var searchFieldsArray = [
                'name.en',
                'name.ar'
            ];
            var searchObject;
            var aggregateHelper;
            var aggregation;
            var archived = queryObject.archived;
            delete queryObject.archived;

            delete filter.globalSearch;

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            if (!archived && !isMobile) {
                queryObject.archived = false;
            }

            async.waterfall([
                function (waterfallCb) {
                    self.getSubRegionsByCountryOrRegion(queryObject, 'region', waterfallCb);
                },
                function (regionIds, waterfallCb) {
                    queryObject.region = regionIds ? {$in: regionIds} : queryObject.region;
                    self.getSubRegionsByCountryOrRegion(queryObject, 'subRegion', waterfallCb);
                },
                function (ids, waterfallCb) {
                    if (ids) {
                        if (isMobile) {
                            queryObject.subRegion = {$in: ids};
                        } else {
                            queryObject.subRegions = {$in: ids};
                        }
                    }

                    if (archived) {
                        queryObject.archived = archived;
                    }

                    aggregateHelper = new AggregationHelper($defProjection, queryObject);
                    searchObject = aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch);

                    pipeLine = getAllPipeLine({
                        skip           : skip,
                        limit          : limit,
                        sort           : sort,
                        isMobile       : isMobile,
                        queryObject    : queryObject,
                        translated     : translated,
                        translateFields: translateFields,
                        language       : language,
                        aggregateHelper: aggregateHelper,
                        searchObject   : searchObject
                    });

                    if (isMobile) {
                        aggregation = BranchModel.aggregate(pipeLine);
                    } else {
                        aggregation = OutletModel.aggregate(pipeLine);
                    }
                    aggregation.options = {
                        allowDiskUse: true
                    };
                    aggregation.exec(function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        waterfallCb(null, result);
                    });
                }

            ], function (err, response) {
                var options = {
                    data: {}
                };
                var outletIds = [];

                if (err) {
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                response.data = _.map(response.data, function (element) {
                    if (element.name) {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en)
                        };
                    }

                    outletIds.push(element._id);

                    return element;
                });

                options.data[CONTENT_TYPES.OUTLET] = outletIds;

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
                    fieldNames[CONTENT_TYPES.OUTLET] = [];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed, personnel) {
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
        function queryRun(body) {
            var id = req.params.id;
            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : ''
                };
            }

            body.editedBy = {
                user: req.session.uId,
                date: new Date()
            };

            OutletModel.findByIdAndUpdate(id, body, {new: true})
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    event.emit('customer:update', {
                        actionOriginator: req.session.uId,
                        accessRoleLevel : req.session.level,
                        body            : result.toJSON()
                    });

                    if (result && result.name) {
                        result.name = {
                            en: result.name.en ? _.unescape(result.name.en) : '',
                            ar: result.name.ar ? _.unescape(result.name.ar) : ''
                        };
                    }

                    res.status(200).send(result);
                });
        }

        access.getEditAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.OUTLET, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };
};

module.exports = OutletHandler;
