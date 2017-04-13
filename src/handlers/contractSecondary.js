const ActivityLog = require('./../stories/push-notifications/activityLog');

var Contract = function () {
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var ContractSecondaryModel = require('./../types/contractSecondary/model');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')();
    var bodyValidator = require('../helpers/bodyValidator');

    var self = this;

    var $defProjection = {
        _id          : 1,
        createdBy    : 1,
        editedBy     : 1,
        type         : 1,
        dateStart    : 1,
        dateEnd      : 1,
        description  : 1,
        status       : 1,
        country      : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        branch       : 1,
        category     : 1,
        activity     : 1,
        promotion    : 1,
        displayType  : 1,
        budget       : 1,
        actual       : 1,
        salesTarget  : 1,
        documents    : 1,
        name         : 1
    };

    function getAllPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var currentUser = options.personnel;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var pipeLine = [];
        const $locationMatch = {
            $and: [],
        };
        const locations = ['country', 'region', 'subRegion', 'branch'];

        locations.forEach((location) => {
            if (currentUser[location] && currentUser[location].length) {
                $locationMatch.$and.push({
                    $or: [
                        {
                            [location]: { $in: currentUser[location] },
                        },
                        {
                            [location]: { $eq: [] },
                        },
                        {
                            [location]: { $eq: null },
                        },
                    ],
                });
            }
        });

        if ($locationMatch.$and.length) {
            pipeLine.push({
                $match: $locationMatch,
            });
        }

        if (queryObject) {
            pipeLine.push({
                $match: queryObject
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key : 'category'
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
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'documents',
            key          : 'documents',
            addProjection: ['createdBy', 'title', 'attachment', 'preview']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$documents',
                preserveNullAndEmptyArrays: true
            }
        });

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'documents.createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    attachment : 1,
                    contentType: 1,
                    createdBy  : {
                        date: 1
                    },
                    preview: 1,
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'files',
            key            : 'documents.attachment',
            isArray        : false,
            addProjection  : ['_id', 'contentType', 'preview'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    contentType: 1,
                    createdBy  : {
                        date: 1,
                        user: 1
                    },
                    preview: 1,
                }
            }
        }));

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                documents: {$addToSet: '$documents'}
            })
        });

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

        if (isMobile) {

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'editedBy.user',
                isArray        : false,
                addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
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

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var personnelId = ObjectId(personnel._id);
            var isMobile = req.isMobile;
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var sort = {'createdBy.date': -1};
            var filter = query.filter || {};
            var queryObject;
            var pipeLine;
            var aggregation;
            var ids;

            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.CONTRACTSYEARLY,
                filter     : filter
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

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            queryObject.$and = [
                {
                    $or: queryObject.$or
                },
                {
                    $or: [
                        {
                            'createdBy.user': personnelId
                        },
                        {
                            status: {
                                $nin: ['draft']
                            }
                        }
                    ]
                }
            ];

            delete queryObject.$or;

            pipeLine = getAllPipeline({
                queryObject    : queryObject,
                aggregateHelper: aggregateHelper,
                sort           : sort,
                query          : query,
                isMobile       : isMobile,
                personnel,
                forSync        : true
            });

            aggregation = ContractSecondaryModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(model => {
                    if (model.description) {
                        model.description = {
                            en: _.unescape(model.description.en),
                            ar: _.unescape(model.description.ar),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun(req.session.uId);
        });
    };

    this.create = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var model;
            var saveContractsSecondary = body.saveContractsSecondary;
            var functions = [];

            var keys = Object.keys(body);
            keys.forEach(function (key) {
                if (_.indexOf(['region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'country', 'category'], key) !== -1) {
                    if (typeof body[key] === 'string') {
                        body[key] = body[key].split(',');
                        body[key] = body[key].objectID();
                    }
                }
            });
            
            function save(cb) {
                var activity = body.activity;
                var description = body.description;
                var promotion = body.promotion;
                var budget = body.budget;
                var actual = body.actual;
                var salesTarget = body.salesTarget;
                var createdBy = {
                    user: userId,
                    date: new Date()
                };
    
                const documents = body.attachments.objectID();
                if (description) {
                    if (description.en) {
                        description.en = _.escape(description.en);
                    }

                    if (description.ar) {
                        description.ar = _.escape(description.ar);
                    }
                    body.description = description;
                }
                if (activity) {
                    body.activity = _.escape(activity);
                }
                if (promotion) {
                    body.promotion = _.escape(promotion);
                }
                if (budget) {
                    body.budget = _.escape(budget);
                }
                if (actual) {
                    body.actual = _.escape(actual);
                }
                if (salesTarget) {
                    body.salesTarget = _.escape(salesTarget);
                }

                body.documents = documents;
                body.createdBy = createdBy;
                body.editedBy = createdBy;
                body.status = saveContractsSecondary ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;
                delete body.attachments;

                model = new ContractSecondaryModel(body);
                model.save((err, model) => {
                    cb(err, model);
                });
            }

            functions.push(save);

            function get(contractsSecondaryModel, cback) {
                const eventPayload = {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body: contractsSecondaryModel.toJSON(),
                };

                if (contractsSecondaryModel.get('status') === PROMOTION_STATUSES.DRAFT) {
                    ActivityLog.emit('contracts:secondary:draft-created', eventPayload);
                } else {
                    ActivityLog.emit('contracts:secondary:published', eventPayload);
                }

                var id = contractsSecondaryModel.get('_id');

                self.getByIdAggr({id: id, isMobile: req.isMobile}, function (err, result) {
                    if (err) {
                        return cback(err);
                    }
                    return cback(null, result);
                });
            }

            functions.push(get);

            async.waterfall(functions, function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.CONTRACT_SECONDARY, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.CONTRACTSSECONDARY, 'create', function (err, saveData) {
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
            var saveContractsSecondary = updateObject.saveContractsSecondary;
            var contractSecondaryId = req.params.id;
            var fullUpdate = {
                $set: updateObject
            };

            var keys = Object.keys(updateObject);
            keys.forEach(function (key) {
                if (_.indexOf(['region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'country', 'category'], key) !== -1) {
                    if (typeof updateObject[key] === 'string') {
                        updateObject[key] = updateObject[key].split(',');
                        updateObject[key] = updateObject[key].objectID();
                    }
                }
            });

            async.waterfall([
                    function (cb) {
                        var activity = updateObject.activity;
                        var description = updateObject.description;
                        var promotion = updateObject.promotion;
                        var budget = updateObject.budget;
                        var actual = updateObject.actual;
                        var salesTarget = updateObject.salesTarget;
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
                        if (activity) {
                            updateObject.activity = _.escape(activity);
                        }
                        if (promotion) {
                            updateObject.promotion = _.escape(promotion);
                        }
                        if (budget) {
                            updateObject.budget = _.escape(budget);
                        }
                        if (actual) {
                            updateObject.actual = _.escape(actual);
                        }
                        if (salesTarget) {
                            updateObject.salesTarget = _.escape(salesTarget);
                        }

                        if (updateObject.attachments && updateObject.attachments.length) {
                            fullUpdate.documents = updateObject.attachments.objectID();
                        }

                        updateObject.status = saveContractsSecondary ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;

                        delete updateObject.attachments;
                        ContractSecondaryModel.findByIdAndUpdate(contractSecondaryId, fullUpdate, {new: true}, function (err, contractModel) {
                            if (err) {
                                return cb(err);
                            }

                            ActivityLog.emit('contracts:secondary:updated', {
                                actionOriginator: userId,
                                accessRoleLevel,
                                body: contractModel.toJSON(),
                            });

                            cb(null, contractModel.get('_id'));
                        });
                    },

                    function (id, cb) {
                        self.getByIdAggr({id: id}, function (err, result) {
                            if (err) {
                                return cb(err);
                            }
                            cb(null, result);
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                }
            );
        }

        access.getEditAccess(req, ACL_MODULES.CONTRACT_SECONDARY, function (err, allowed) {
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

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.CONTRACTSSECONDARY, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            //var idsToArchive = req.body.ids.objectID();
            //var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            res.status(200).send();
        }

        access.getEditAccess(req, ACL_MODULES.CONTRACT_SECONDARY, function (err, allowed) {
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
            var id = ObjectId(req.params.id);

            self.getByIdAggr({id: id}, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.CONTRACT_SECONDARY, function (err, allowed) {
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
            var orCondition = [
                {'createdBy.user': personnel._id},
                {
                    status: {
                        $nin: ['draft']
                    }
                }
            ];
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
                'createdBy.user.lastName.ar'
            ];

            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.CONTRACTSSECONDARY,
                filter,
            });

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

            if (queryObject.contractType) {
                queryObject.type = queryObject.contractType;
                delete queryObject.contractType;
            }

            if (queryObject.$or) {
                queryObject.$and = [
                    {
                        $or: queryObject.$or
                    },
                    {
                        $or: orCondition
                    }
                ];
                delete queryObject.$or;
            } else {
                queryObject.$or = orCondition;
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine = getAllPipeline({
                aggregateHelper  : aggregateHelper,
                queryObject      : queryObject,
                positionFilter   : positionFilter,
                isMobile         : req.isMobile,
                searchFieldsArray: searchFieldsArray,
                filterSearch     : filterSearch,
                skip             : skip,
                limit            : limit,
                personnel,
            });

            aggregation = ContractSecondaryModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(model => {
                    if (model.description) {
                        model.description = {
                            en: _.unescape(model.description.en),
                            ar: _.unescape(model.description.ar),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.CONTRACT_SECONDARY, function (err, allowed, personnel) {
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

    this.getByIdAggr = function (options, callback) {
        var aggregateHelper;
        var pipeLine = [];
        var aggregation;
        var id = options.id || '';
        var isMobile = options.isMobile;

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {
                _id: id
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key : 'category'
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
            addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'documents',
            key          : 'documents',
            as           : 'documents',
            addProjection: ['createdBy', 'title', 'attachment', 'contentType', 'preview']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$documents',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'documents.createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    contentType: 1,
                    attachment : 1,
                    createdBy: {
                        date: 1
                    },
                    preview: 1,
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'files',
            key            : 'documents.attachment',
            isArray        : false,
            addProjection  : ['_id', 'contentType', 'preview'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    contentType: 1,
                    createdBy  : {
                        date: 1,
                        user: 1
                    },
                    preview: 1,
                }
            }
        }));

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                documents: {$addToSet: '$documents'}
            })
        });

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

        aggregation = ContractSecondaryModel.aggregate(pipeLine);

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
                    en: _.unescape(body.description.en),
                    ar: _.unescape(body.description.ar),
                };
            }

            callback(null, body);
        });
    };
};

module.exports = Contract;
