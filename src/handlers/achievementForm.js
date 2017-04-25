const async = require('async');
const ACL_MODULES = require('./../constants/aclModulesNames');
const ActivityLog = require('./../stories/push-notifications/activityLog');
const extractBody = require('./../utils/extractBody');

var AchievementForm = function () {
    var _ = require('lodash');
    var logger = require('../utils/logger');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var AchievementFormModel = require('./../types/achievementForm/model');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler();
    var access = require('../helpers/access')();
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
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

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const files = req.files;

        const queryRun = (body, callback) => {
            async.waterfall([
                (cb) => {
                    const createdBy = {
                        user: userId,
                        date: new Date(),
                    };

                    if (body.description) {
                        body.description = {
                            en: _.escape(body.description.en),
                            ar: _.escape(body.description.ar),
                        };
                    }
                    if (body.additionalComment) {
                        body.additionalComment = {
                            en: _.escape(body.additionalComment.en),
                            ar: _.escape(body.additionalComment.ar),
                        };
                    }

                    const achievementForm = {
                        description: body.description,
                        additionalComment: body.additionalComment,
                        country: body.country,
                        region: body.region,
                        subRegion: body.subRegion,
                        retailSegment: body.retailSegment,
                        outlet: body.outlet,
                        branch: body.branch,
                        location: body.location,
                        date: body.date,
                        createdBy,
                        editedBy: createdBy,
                        startDate: body.startDate,
                        endDate: body.endDate,
                    };

                    const newReport = new AchievementFormModel();

                    newReport.set(achievementForm);
                    newReport.save((err, model) => {
                        cb(err, model);
                    });
                },

                (report, cb) => {
                    res.status(201).send(report);

                    if (!files) {
                        return cb(null);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.ACHIEVEMENTFORM, (err, setFileId) => {
                        if (err) {
                            return cb(err);
                        }

                        report.set('attachments', setFileId);
                        report.save((err, model) => {
                            cb(err, model);
                        });
                    });
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.ACHIEVEMENT_FORM, cb);
            },

            (allowed, personnel, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.ACHIEVEMENTFORM, 'create', cb);
            },

            queryRun,

        ], (err, report) => {
            if (err) {
                if (!res.headersSent) {
                    next(err);
                }

                logger.error(err);
            } else {
                ActivityLog.emit('reporting:achievement-form:published', {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body: report.toJSON(),
                });
            }
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
            AchievementFormModel.findByIdAndUpdate(id, body, { new: true }, callback)
        };

        async.waterfall([
            (cb) => {
                access.getEditAccess(req, ACL_MODULES.ACHIEVEMENT_FORM, cb);
            },

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(requestBody, accessRoleLevel, CONTENT_TYPES.ACHIEVEMENTFORM, 'update', cb);
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
                    if (model.additionalComment) {
                        model.additionalComment = {
                            en: _.unescape(model.additionalComment.en),
                            ar: _.unescape(model.additionalComment.ar),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
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
            addProjection: ['contentType', 'originalName', 'extension', 'createdBy', 'preview']
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
            addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? [] : ['position', 'accessRole']),
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
                            lastName : 1,
                            imageSrc: 1,
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
                            imageSrc: 1,
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
            addProjection: ['contentType', 'originalName', 'extension', 'createdBy', 'preview']
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
            addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? [] : ['position', 'accessRole']),
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
                            lastName : 1,
                            imageSrc: 1,
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
                            imageSrc: 1,
                        }
                    }
                }
            }));
        }

        aggregation = AchievementFormModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec((err, result) => {
            if (err) {
                return callback(err);
            }

            const model = result[0];

            if (model) {
                if (model.description) {
                    model.description = {
                        en: _.unescape(model.description.en),
                        ar: _.unescape(model.description.ar),
                    };
                }
                if (model.additionalComment) {
                    model.additionalComment = {
                        en: _.unescape(model.additionalComment.en),
                        ar: _.unescape(model.additionalComment.ar),
                    };
                }
            }

            callback(null, model);
        });
    };

};
module.exports = AchievementForm;
