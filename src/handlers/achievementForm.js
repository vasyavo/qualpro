var AchievementForm = function (db, redis, event) {
    var async = require('async');
    var _ = require('lodash');
    var logger = require('../utils/logger');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var AchievementFormModel = require('./../types/achievementForm/model');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var access = require('../helpers/access')(db);
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
    var FileModel = require('./../types/file/model');
    var bodyValidator = require('../helpers/bodyValidator');
    var self = this;

    var $defProjection = {
        _id              : 1,
        description      : 1,
        additionalComment: 1,
        country          : 1,
        region           : 1,
        subRegion        : 1,
        retailSegment    : 1,
        outlet           : 1,
        branch           : 1,
        archived         : 1,
        createdBy        : 1,
        editedBy         : 1,
        attachments      : 1,
        startDate        : 1,
        endDate          : 1
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var session = req.session;
            var userId = session.uId;
            var model;
            var achievementForm;

            async.waterfall([
                function (cb) {
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
                    if (body.additionalComment) {
                        body.additionalComment = {
                            en: _.escape(body.additionalComment.en),
                            ar: _.escape(body.additionalComment.ar)
                        };
                    }

                    achievementForm = {
                        description      : body.description,
                        additionalComment: body.additionalComment,
                        country          : body.country,
                        region           : body.region,
                        subRegion        : body.subRegion,
                        retailSegment    : body.retailSegment,
                        outlet           : body.outlet,
                        branch           : body.branch,
                        location         : body.location,
                        date             : body.date,
                        createdBy        : createdBy,
                        editedBy         : createdBy,
                        startDate        : body.startDate,
                        endDate          : body.endDate
                    };

                    AchievementFormModel.create(achievementForm, function (err, model) {
                        if (err) {
                            return cb(err);
                        }

                        res.status(201).send(model);

                        event.emit('activityChange', {
                            module    : 37,
                            actionType: ACTIVITY_TYPES.CREATED,
                            createdBy : achievementForm.createdBy,
                            itemId    : model._id,
                            itemType  : CONTENT_TYPES.ACHIEVEMENTFORM
                        });

                        cb(null, model);
                    });
                },

                function (model, cb) {
                    if (!files) {
                        return cb(null, model, []);
                    }

                    //TODO: change bucket from constants
                    fileHandler.uploadFile(userId, files, 'achievementForm', function (err, filesIds) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, model, filesIds);
                    });
                },

                function (model, filesIds, cb) {
                    model.set('attachments', filesIds);
                    model.save(cb);
                }

            ], function (err) {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }

                    return logger.error(err);
                }
            });
        }

        access.getWriteAccess(req, 37, function (err) {
            var body;

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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.ACHIEVEMENTFORM, 'create', function (err, saveData) {
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
            var isMobile = req.isMobile;
            var filter = query.filter || {};
            var page = query.page || 1;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var pipeLine;
            var aggregation;
            var positionFilter = {};

            var searchFieldsArray = [
                'description.en',
                'description.ar',
                'additionalComment.en',
                'additionalComment.ar',
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
                contentType: CONTENT_TYPES.ACHIEVEMENTFORM,
                filter     : filter,
                personnel  : personnel
            }) : {};

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

            aggregation = AchievementFormModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                if (err) {
                    return next(err);
                }
                var options = {
                    data: {}
                };
                var idsPersonnel = [];
                var idsFile = [];

                response = response && response[0] ? response[0] : {data: [], total: 0};

                response.data = _.map(response.data, function (model) {
                    idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                    idsPersonnel.push(model.createdBy.user._id);
                    if (model.description) {
                        model.description = {
                            en: _.unescape(model.description.en),
                            ar: _.unescape(model.description.ar)
                        };
                    }
                    if (model.additionalComment) {
                        model.additionalComment = {
                            en: _.unescape(model.additionalComment.en),
                            ar: _.unescape(model.additionalComment.ar)
                        };
                    }

                    return model;
                });

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                idsPersonnel = _.uniqBy(idsPersonnel, 'id');
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
                    fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                    fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, 37, function (err, allowed, personnel) {
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
        var isMobile = options.isMobile;
        var skip = options.skip;
        var limit = options.limit;
        var forSync = options.forSync;
        var employeeFilter = queryObject.personnel ? {'createdBy.user': _.pick(queryObject, 'personnel').personnel} : {};
        var pipeLine = [];
        var filesObj = {
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'extension', 'createdBy']
        };

        delete queryObject.personnel;

        pipeLine.push({
            $match: queryObject
        });

        pipeLine.push({
            $match: employeeFilter
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker(filesObj));

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
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: {createdBy: {date: 1}}
        }));

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter
            });
        }

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

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);
            var isMobile = req.isMobile;

            self.getByIdAggr({id: ObjectId(id), isMobile: isMobile}, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, 37, function (err, allowed) {
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
        var isMobile = options.isMobile;
        var filesObj = {
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'extension', 'createdBy']
        };

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {_id: id}
        });

        if (!isMobile) {
            filesObj.addProjection.push('preview');
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker(filesObj));

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

        aggregation = AchievementFormModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, response) {
            var idsPersonnel = [];
            var idsFile = [];
            response = response[0] ? response[0] : {};
            var keys = Object.keys(response);
            if (err) {
                return callback(err);
            }
            var options = {
                data: {}
            };

            if (keys.length) {
                if (response.description) {
                    response.description = {
                        en: _.unescape(response.description.en),
                        ar: _.unescape(response.description.ar)
                    };
                }
                if (response.additionalComment) {
                    response.additionalComment = {
                        en: _.unescape(response.additionalComment.en),
                        ar: _.unescape(response.additionalComment.ar)
                    };
                }
            }

            if (!keys.length) {
                return callback(null, response);
            }

            idsFile = _.map(response.attachments, '_id');
            idsPersonnel.push(response.createdBy.user._id);
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
                fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, function (model) {
                    callback(null, model);
                })
            });
        });
    };

};
module.exports = AchievementForm;
