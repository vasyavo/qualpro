const ActivityLog = require('./../stories/push-notifications/activityLog');

var BrandingActivity = function () {
    var _ = require('lodash');
    var async = require('async');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var VALIDATION = require('../public/js/constants/validation.js');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var FilterMapper = require('../helpers/filterMapper');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler();
    var MarketingCampaignModel = require('./../types/marketingCampaign/model');
    var FileModel = require('./../types/file/model');
    var access = require('../helpers/access')();
    var bodyValidator = require('../helpers/bodyValidator');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var ObjectId = mongoose.Types.ObjectId;

    var self = this;

    var $defProjection = {
        _id          : 1,
        description  : 1,
        displayType  : 1,
        dateStart    : 1,
        dateEnd      : 1,
        attachments  : 1,
        category     : 1,
        branch       : 1,
        country      : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        createdBy    : 1,
        editedBy     : 1,
        personnel    : 1,
        status       : 1,
        parent       : 1,
        position     : 1
    };

    function getAllPipeLine(options) {
        var personnel = options.personnel;
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject || {};
        var pipeLine = [];
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;

        var positionFilter;
        var mainFilter = {};

        var isMatch = false;

        // fix do not show draft to other users
        if (isMobile) {
            mainFilter.status = {
                $nin: ['draft', 'expired']
            };
        } else {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user': personnel._id,
                            status          : {$in: ['draft', 'expired']}
                        }, {
                            status: {$nin: ['draft', 'expired']}
                        }
                    ]
                }
            });
        }

        if (queryObject.position) {
            positionFilter = {position: queryObject.position};

            delete queryObject.position;

            isMatch = true;
        }

        if (queryObject.publisher) {
            mainFilter['createdBy.user'] = queryObject.publisher;

            delete queryObject.publisher;

            isMatch = true;
        }

        if (queryObject.status) {
            mainFilter.status = queryObject.status;

            delete queryObject.status;

            isMatch = true;
        }

        if (forSync) {
            pipeLine.push({
                $match: queryObject
            });

            isMatch = true;
        }

        if (Object.keys(mainFilter).length) {
            pipeLine.push({
                $match: mainFilter
            });

            isMatch = true;
        }

        if (queryObject._id) {
            pipeLine.push({
                $match: queryObject
            });

            isMatch = true;
        }

        if (!isMatch) {
            pipeLine.push({
                $match: queryObject
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key : 'category'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'displayTypes',
            key    : 'displayType',
            isArray: true

        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'branches',
            key              : 'branch',
            addMainProjection: ['retailSegment', 'outlet']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'subRegion'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'region'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
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
            from             : 'personnels',
            key              : 'personnel',
            addMainProjection: ['position']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'editedBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {editedBy: {date: 1}}
        }));

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                position: {
                    $setUnion: ['$position', ['$createdBy.user.position']]
                }
            })
        });

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
                        lastName : 1,
                        imageSrc: 1,
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
                        lastName  : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy', 'preview']
        }));

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

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            const CONSTANTS = require('../constants/mainConstants');
            var query = req.query;
            var isMobile = req.isMobile;
            var filter = query.filter || {};
            var page = query.page || 1;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';

            filterMapper.setFilterLocation(filter, personnel, 'branch', null);
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.MARKETING_CAMPAIGN,
                filter     : filter,
                personnel  : personnel
            });
            var pipeLine;
            var aggregation;
            var aggregateHelper;
            var searchFieldsArray = [
                'description.en',
                'description.ar',
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
                'displayType.name.en',
                'displayType.name.ar',
                'category.name.en',
                'category.name.ar'
            ];

            delete filter.globalSearch;

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine = getAllPipeLine({
                personnel        : personnel,
                aggregateHelper  : aggregateHelper,
                searchFieldsArray: searchFieldsArray,
                queryObject      : queryObject,
                filterSearch     : filterSearch,
                skip             : skip,
                limit            : limit,
                isMobile         : isMobile
            });

            aggregation = MarketingCampaignModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    element.description = {
                        ar: _.unescape(element.description.ar),
                        en: _.unescape(element.description.en),
                    };
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY, function (err, allowed, personnel) {
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

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var isMobile = req.isMobile;
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
                contentType: CONTENT_TYPES.MARKETING_CAMPAIGN,
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

            pipeLine = getAllPipeLine({
                personnel      : personnel,
                aggregateHelper: aggregateHelper,
                queryObject    : queryObject,
                positionFilter : positionFilter,
                isMobile       : isMobile,
                forSync        : true
            });

            aggregation = MarketingCampaignModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    element.description = {
                        ar: _.unescape(element.description.ar),
                        en: _.unescape(element.description.en),
                    };
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY, function (err, allowed, personnel) {
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

    this.create = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var files = req.files;
            var saveBrandingAndDisplay = body.save;
            var functions;

            var keys = ['branch', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'category', 'displayType'];
            keys.forEach(function (key) {
                if (typeof body[key] === 'string') {
                    body[key] = body[key].split(',');
                    body[key] = body[key].objectID();
                } else {
                    body[key] = body[key].objectID();
                }
            });

            function uploadFiles(files, body, userId, cb) {
                if (!files) {
                    return cb(null, [], body, userId);
                }

                fileHandler.uploadFile(userId, files, 'brandingAndDisplay', function (err, filesIds) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, filesIds, body, userId);
                });
            }

            function createBrandingAndDisplay(filesIds, body, userId, cb) {
                var model;
                var description = body.description;
                var createdBy = {
                    user: userId,
                    date: new Date()
                };

                if (description) {
                    if (description.en) {
                        description.en = _.escape(description.en);
                    }

                    if (description.ar) {
                        description.ar = _.escape(description.ar);
                    }
                    body.description = description;
                }
                body.attachments = filesIds;
                body.createdBy = createdBy;
                body.editedBy = createdBy;

                body.status = saveBrandingAndDisplay ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;

                model = new MarketingCampaignModel(body);
                model.save(function (err, model) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, model);
                });
            }

            function getBrandingAndDisplayAggr(model, cb) {
                var id = model.get('_id');

                self.getByIdAggr({id: id, isMobile: req.isMobile}, cb);
            }

            functions = [].concat(async.apply(uploadFiles, files, body, userId), createBrandingAndDisplay, getBrandingAndDisplayAggr);
            async.waterfall(functions, function (err, result) {
                if (err) {
                    return next(err);
                }

                ActivityLog.emit('marketing:al-alali-marketing-campaigns:published', {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body: result,
                });

                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY, function (err, allowed) {

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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.MARKETING_CAMPAIGN, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.update = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(updateObject) {
            var files = req.files;
            var filesPresence = Object.keys(files).length;
            var attachPresence = updateObject.attachments;
            var both = attachPresence && filesPresence;
            var brandingAndDisplayId = req.params.id;
            var saveBrandingAndDisplay = updateObject.save;
            var fullUpdate = {
                $set: updateObject
            };
            var keys = ['branch', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'displayType', 'personnel'];
            keys.forEach(function (key) {
                if (typeof updateObject[key] === 'string') {
                    updateObject[key] = updateObject[key].split(',');
                    updateObject[key] = updateObject[key].objectID();
                } else {
                    if (updateObject[key]) {
                        updateObject[key] = updateObject[key].objectID();
                    }
                }
            });

            async.waterfall([

                function (cb) {
                    if (!filesPresence) {
                        return cb(null, null);
                    }

                    fileHandler.uploadFile(userId, files, 'brandingAndDisplay', function (err, filesIds) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, filesIds);
                    });
                },

                function (filesIds, cb) {
                    var description = updateObject.description;
                    updateObject.editedBy = {
                        user: ObjectId(userId),
                        date: new Date()
                    };

                    if (description) {
                        if (description.en) {
                            description.en = _.escape(description.en);
                        }

                        if (description.ar) {
                            description.ar = _.escape(description.ar);
                        }
                        updateObject.description = description;
                    }
                    if (!filesPresence && attachPresence) {
                        filesIds = updateObject.attachments.objectID();
                    }
                    if (filesIds) {
                        updateObject.attachments = both ? _.union(filesIds, updateObject.attachments.objectID()) : filesIds;
                    }

                    if (!filesPresence && !attachPresence) {
                        delete updateObject.attachments;
                    }

                    MarketingCampaignModel.findOne({_id: brandingAndDisplayId}, function (err, brandingAndDisplayModel) {
                        var error;
                        var deletedAttachments = [];
                        var brandingAndDisplay = brandingAndDisplayModel;
                        var fileIdsBackend = brandingAndDisplayModel.toObject();
                        fileIdsBackend = fileIdsBackend.attachments ? fileIdsBackend.attachments.fromObjectID() : [];

                        if (err) {
                            return cb(err);
                        }
                        if (!brandingAndDisplayModel) {
                            error = new Error('Branding and Display not found');
                            error.status = 400;
                            return cb(error);
                        }

                        async.waterfall([
                                function (callback) {
                                    if (filesPresence && !both) {
                                        fullUpdate.$addToSet = {};
                                        fullUpdate.$addToSet.attachments = {$each: updateObject.attachments};
                                        delete updateObject.attachments;
                                    }
                                    updateObject.status = saveBrandingAndDisplay ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;

                                    MarketingCampaignModel.findByIdAndUpdate(brandingAndDisplayModel, fullUpdate, {new: true}, function (err, result) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        var fileIdsBackendNew = result.toObject();
                                        fileIdsBackendNew = fileIdsBackendNew.attachments ? fileIdsBackendNew.attachments.fromObjectID() : fileIdsBackendNew.attachments;
                                        deletedAttachments = _.difference(fileIdsBackend, fileIdsBackendNew);
                                        brandingAndDisplay = result;

                                        ActivityLog.emit('marketing:al-alali-marketing-campaigns:updated', {
                                            actionOriginator: userId,
                                            accessRoleLevel,
                                            body: result.toJSON(),
                                        });

                                        return callback(null, deletedAttachments);
                                    });
                                },
                                function (deletedAttachments, callback) {
                                    if (!deletedAttachments.length || !filesIds) {
                                        return callback(null);
                                    }

                                    fileHandler.deleteFew(deletedAttachments, function (err, result) {
                                        if (err) {
                                            return callback(err);
                                        }
                                        return callback(null);
                                    })
                                }],
                            function (err, result) {
                                if (err) {
                                    return cb(err);
                                }

                                return cb(null, brandingAndDisplay._id);
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

        access.getEditAccess(req, ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY, function (err, allowed) {
            if (err) {
                return next(err);
            }

            let updateObject;

            try {
                if (req.body.data) {
                    updateObject = JSON.parse(req.body.data);
                } else {
                    updateObject = req.body;
                }
            } catch (err) {
                return next(err);
            }

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.MARKETING_CAMPAIGN, 'update', function (err, saveData) {
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

        access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY, function (err, allowed) {
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
            addProjection: ['id', 'contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key : 'category'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'displayTypes',
            key    : 'displayType',
            isArray: true
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'branches',
            key              : 'branch',
            addMainProjection: ['retailSegment', 'outlet']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'subRegion'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'region'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet'
        }));

        aggregation = MarketingCampaignModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec((err, result) => {
            if (err) {
                return callback(err);
            }

            const body = result.length ? result[0] : {};

            if (body.description) {
                body.description = {
                    ar: _.unescape(body.description.ar),
                    en: _.unescape(body.description.en),
                };
            }

            if (isMobile) {
                if (body.displayType && body.displayType.length) {
                    body.displayType = body.displayType[0];
                }
            }

            callback(null, body);
        });
    };

    this.removeFileFromBrandingActivity = function (req, res, next) {
        var body = req.body;
        var session = req.session;
        var userId = session.uId;
        var fileId = body.fileId;
        var objectiveId = body.objectiveId;
        var error;
        var fileName;

        if (!objectiveId || !fileId) {
            error = new Error('Not enough params');
            error.status = 400;
            return next(error);
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
                });
            },

            function (removeFile, cb) {
                MarketingCampaignModel.findByIdAndUpdate(objectiveId, {$pull: {attachments: ObjectId(fileId)}}, function (err) {
                    if (err) {
                        return cb(err);
                    }

                    if (removeFile) {
                        // fileHandler.deleteFile(fileName, 'marketingCampaign', function (err) {
                        //     if (err) {
                        //         return cb(err);
                        //     }
                        // });
                        FileModel.findByIdAndRemove(fileId, function (err, file) {
                            if (err) {
                                return cb(err);
                            }
                        });
                    }

                    cb();
                });
            }

        ], function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send();
        });
    };

};

module.exports = BrandingActivity;
