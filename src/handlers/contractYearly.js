const ActivityLog = require('./../stories/push-notifications/activityLog');

var Contract = function () {
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACL_CONSTANTS = require('../constants/aclRolesNames');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var ContractYearlyModel = require('./../types/contractYearly/model');
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
        documents    : 1
    };

    function getAllPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var currentUser = options.personnel;
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
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
            from         : 'documents',
            key          : 'documents',
            as           : 'documents',
            isArray      : true,
            addProjection: ['createdBy', 'title', 'attachment']
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
            addProjection  : ['_id', 'firstName', 'lastName'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    attachment : 1,
                    contentType: 1,
                    createdBy  : {
                        date: 1
                    }
                }
            }
        }));
    
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'files',
            key            : 'documents.attachment',
            isArray        : false,
            addProjection  : ['_id', 'contentType'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    contentType: 1,
                    createdBy  : {
                        date: 1,
                        user: 1
                    }
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

            if ([4, 5, 6, 7].indexOf(req.session.level) !== -1) {
                queryObject.type = queryObject.type || {};
                queryObject.type.$nin = ['yearly'];
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
                forSync        : true,
                personnel
            });

            aggregation = ContractYearlyModel.aggregate(pipeLine);

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

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed, personnel) {
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
            var model;
            var saveContractsYearly = body.saveContractsYearly;

            var keys = Object.keys(body);
            keys.forEach(function (key) {
                if (_.indexOf(['region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'country'], key) !== -1) {
                    if (typeof body[key] === 'string') {
                        body[key] = body[key].split(',');
                        body[key] = body[key].objectID();
                    } else {
                        body[key] = ObjectId(body[key]);
                    }
                }
            });

            async.waterfall([
                function (cb) {
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
                    body.documents = body.attachments ? body.attachments.objectID(): [];
                    body.status = saveContractsYearly ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;
                    body.createdBy = createdBy;
                    body.editedBy = createdBy;
                    delete body.attachments;

                    model = new ContractYearlyModel(body);
                    model.save(function (err, model) {
                        if (err) {
                            return cb(err);
                        }

                        return cb(null, model);
                    });
                },

                function (contractsYearlyModel, cb) {
                    const eventPayload = {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body: contractsYearlyModel.toJSON(),
                    };

                    if (contractsYearlyModel.get('status') === PROMOTION_STATUSES.DRAFT) {
                        ActivityLog.emit('contracts:yearly:draft-created', eventPayload);
                    } else {
                        ActivityLog.emit('contracts:yearly:published', eventPayload);
                    }

                    var id = contractsYearlyModel.get('_id');

                    self.getByIdAggr({id: id, isMobile: req.isMobile}, function (err, result) {
                        if (err) {
                            return cb(err);
                        }
                        return cb(null, result);

                    });
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.CONTRACT_YEARLY_AND_VISIBILITY, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.CONTRACTSYEARLY, 'create', function (err, saveData) {
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
            var saveContractsYearly = updateObject.saveContractsYearly;
            var contractYearlyId = req.params.id;
            var fullUpdate = {
                $set: updateObject
            };

            var keys = Object.keys(updateObject);
            keys.forEach(function (key) {
                if (_.indexOf(['region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'country'], key) !== -1) {
                    if (typeof updateObject[key] === 'string') {
                        updateObject[key] = updateObject[key].split(',');
                        updateObject[key] = updateObject[key].objectID();
                    } else {
                        updateObject[key] = ObjectId(updateObject[key]);
                    }
                }
            });

            async.waterfall([
                    function (cb) {
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
                      
                        if (updateObject.attachments && updateObject.attachments.length) {
                            fullUpdate.$addToSet = {};
                            fullUpdate.$addToSet.documents = {$each: updateObject.attachments.objectID()};
                            delete updateObject.documents;
                        }
                        updateObject.status = saveContractsYearly ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;

                        delete updateObject.attachments;
                        ContractYearlyModel.findByIdAndUpdate(contractYearlyId, fullUpdate, function (err, contractModel) {
                            if (err) {
                                return cb(err);
                            }

                            ActivityLog.emit('contracts:yearly:updated', {
                                actionOriginator: userId,
                                accessRoleLevel,
                                body: contractModel.toJSON(),
                            });

                            return cb(null, contractModel.get('_id'));
                        });
                    },

                    function (id, cb) {
                        self.getByIdAggr({id: id, isMobile: req.isMobile}, function (err, result) {
                            if (err) {
                                return cb(err);
                            }
                            return cb(null, result);
                        });
                    }
                ],
                function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                }
            );
        }

        access.getEditAccess(req, ACL_MODULES.CONTRACT_YEARLY_AND_VISIBILITY, function (err, allowed) {
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

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.CONTRACTSYEARLY, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            res.status(200).send();
        }

        access.getEditAccess(req, ACL_MODULES.CONTRACT_YEARLY_AND_VISIBILITY, function (err, allowed) {
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
                if (result) {
                    result.description = {
                        ar: _.unescape(result.description.ar),
                        en: _.unescape(result.description.en)
                    };
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.CONTRACT_YEARLY_AND_VISIBILITY, function (err, allowed) {
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
        function queryRun(personnel, callback) {
            const query = req.query;
            const filter = query.filter || {};
            const page = query.page || 1;
            const limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            const skip = (page - 1) * limit;
            const filterSearch = filter.globalSearch || '';
            const isMobile = req.isMobile;
            const searchFieldsArray = [
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
            var orCondition = [
                {'createdBy.user': personnel._id},
                {
                    status: {
                        $nin: ['draft']
                    }
                }
            ];

            delete filter.globalSearch;

            const filterMapper = new FilterMapper();
            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.CONTRACTSYEARLY,
                filter,
            });

            if (queryObject.personnel) {
                queryObject['createdBy.user'] = queryObject.personnel;
                delete queryObject.personnel;
            }

            if (queryObject.contractType) {
                queryObject.type = queryObject.contractType;
                delete queryObject.contractType;
            }

            const positionFilter = {};

            if (queryObject.position && queryObject.position.$in) {
                positionFilter.$or = [{
                    'createdBy.user.position': queryObject.position
                }];

                delete queryObject.position;
            }

            if (_.includes(_(ACL_CONSTANTS).pick([
                    'AREA_IN_CHARGE',
                    'SALES_MAN',
                    'MERCHANDISER',
                    'CASH_VAN',
                    'TRADE_MARKETER'
                ]).values().value(), req.session.level)) {
                queryObject.type = queryObject.type || {};
                queryObject.type.$nin = ['yearly'];
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
            const aggregateHelper = new AggregationHelper($defProjection, queryObject);
            const pipeLine = getAllPipeline({
                aggregateHelper,
                queryObject,
                positionFilter,
                isMobile,
                personnel,
                searchFieldsArray,
                filterSearch,
                skip,
                limit
            });

            async.waterfall([

                (cb) => {
                    const aggregation = ContractYearlyModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(cb);
                },

                (result, cb) => {
                    const body = result.length ?
                        result[0] : { data: [], total: 0 };

                    body.data.forEach(model => {
                        if (model.description) {
                            model.description = {
                                en: _.unescape(model.description.en),
                                ar: _.unescape(model.description.ar),
                            };
                        }
                    });

                    cb(null, body);
                },

            ], callback);
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.CONTRACT_YEARLY_AND_VISIBILITY),

            (allowed, personnel, cb) => {
                queryRun(personnel, cb)
            }

        ], (err, response) => {
            if (err) {
                return next(err);
            }

            next({
                status: 200,
                body: response
            });
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
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'documents',
            key          : 'documents',
            as           : 'documents',
            addProjection: ['createdBy', 'title', 'attachment', 'contentType']
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
            addProjection  : ['_id', 'firstName', 'lastName'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    contentType: 1,
                    attachment : 1,
                    createdBy  : {
                        date: 1
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'files',
            key            : 'documents.attachment',
            isArray        : false,
            addProjection  : ['_id', 'contentType'],
            includeSiblings: {
                documents: {
                    _id        : 1,
                    title      : 1,
                    contentType: 1,
                    createdBy  : {
                        date: 1,
                        user: 1
                    }
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

        aggregation = ContractYearlyModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec((err, result) => {
            if (err) {
                return callback(err);
            }

            const body = result[0];

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

