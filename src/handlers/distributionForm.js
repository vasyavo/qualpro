const extractBody = require('./../utils/extractBody');
const ObjectiveModel = requie('./../types/objective/model');
const ActivityLog = require('./../stories/push-notifications/activityLog');

var DistributionForm = function (db, redis, event) {
    var mongoose = require('mongoose');
    var async = require('async');
    var CONSTANTS = require('../constants/mainConstants');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var DistributionFormModel = require('./../types/distributionForm/model');

    var _ = require('underscore');
    var xssFilters = require('xss-filters');
    var objectId = mongoose.Types.ObjectId;
    var bodyValidator = require('../helpers/bodyValidator');
    var access = require('../helpers/access')(db);
    var self = this;

    this.createForm = function (userId, body, callback) {
        var createdBy = {
            user: userId,
            date: new Date()
        };
        var model;

        body.createdBy = createdBy;
        body.editedBy = createdBy;

        model = new DistributionFormModel(body);
        model.save(function (error, model) {
            if (error) {
                return callback(error);
            }

            callback(null, model);
        });
    };

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
            self.createForm(userId, body, callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (personnel, allowed, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.DISTRIBUTIONFORM, 'create', cb);
            },

            queryRun,

        ], (err, model) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(model);
        });
    };

    function getAllPipeline(options) {
        var aggregationHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var isMobile = options.isMobile;
        var skip = options.skip;
        var limit = options.limit;

        var pipeLine = [];

        pipeLine.push({
            $match: queryObject
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
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

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
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
            pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'editedBy.user',
                isArray        : false,
                addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
                includeSiblings: {editedBy: {date: 1}}
            }));

            pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
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

            pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
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

        pipeLine.push({
            $project: {
                objective: 1,
                branches : 1,
                items    : 1,
                createdBy: 1,
                editedBy : 1,
                itemTotal: {$size: '$items'}
            }
        });

        pipeLine.push({
            $unwind: '$items'
        });

        pipeLine.push({
            $lookup: {
                from        : 'items',
                localField  : 'items.item',
                foreignField: '_id',
                as          : 'items.item'
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'variants',
                localField  : 'items.variant',
                foreignField: '_id',
                as          : 'items.variant'
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'categories',
                localField  : 'items.category',
                foreignField: '_id',
                as          : 'items.category'
            }
        });

        pipeLine.push({
            $project: {
                objective   : 1,
                branches    : 1,
                category    : {$arrayElemAt: ['$items.category', 0]},
                variant     : {$arrayElemAt: ['$items.variant', 0]},
                item        : {$arrayElemAt: ['$items.item', 0]},
                itemBranches: '$items.branches',
                createdBy   : 1,
                editedBy    : 1,
                itemTotal   : 1
            }
        });

        pipeLine.push({
            $project: {
                objective   : 1,
                branches    : 1,
                category    : {_id: 1, name: 1},
                variant     : {_id: 1, name: 1},
                item        : {_id: 1, name: 1, packing: 1},
                itemBranches: 1,
                createdBy   : 1,
                editedBy    : 1,
                itemTotal   : 1
            }
        });

        pipeLine.push({
            $sort: {
                'category.name': 1,
                'variant.name' : 1,
                'item.name'    : 1
            }
        });

        if (limit && limit !== -1) {
            pipeLine.push({
                $skip: skip
            });

            pipeLine.push({
                $limit: limit
            });
        }

        pipeLine.push({
            $unwind: '$branches'
        });

        pipeLine.push({
            $lookup: {
                from        : 'branches',
                localField  : 'branches',
                foreignField: '_id',
                as          : 'branches'
            }
        });

        pipeLine.push({
            $project: {
                objective   : 1,
                branches    : {$arrayElemAt: ['$branches', 0]},
                category    : 1,
                variant     : 1,
                item        : 1,
                itemBranches: 1,
                createdBy   : 1,
                editedBy    : 1,
                itemTotal   : 1
            }
        });

        pipeLine.push({
            $project: {
                objective   : 1,
                branches    : {_id: 1, name: 1, outlet: 1},
                category    : 1,
                variant     : 1,
                item        : 1,
                itemBranches: 1,
                createdBy   : 1,
                editedBy    : 1,
                itemTotal   : 1
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'outlets',
                localField  : 'branches.outlet',
                foreignField: '_id',
                as          : 'branches.outlet'
            }
        });

        pipeLine.push({
            $project: {
                objective   : 1,
                branches    : {
                    _id   : 1,
                    name  : 1,
                    outlet: {
                        $arrayElemAt: ['$branches.outlet', 0]
                    }
                },
                category    : 1,
                variant     : 1,
                item        : 1,
                itemBranches: 1,
                createdBy   : 1,
                editedBy    : 1,
                itemTotal   : 1
            }
        });

        pipeLine.push({
            $project: {
                objective   : 1,
                branches    : {
                    _id   : 1,
                    name  : 1,
                    outlet: {
                        _id : 1,
                        name: 1,
                    }
                },
                category    : 1,
                variant     : 1,
                item        : 1,
                itemBranches: 1,
                createdBy   : 1,
                editedBy    : 1,
                itemTotal   : 1
            }
        });

        pipeLine.push({
            $group: {
                _id      : '$variant._id',
                root_id  : {$first: '$_id'},
                objective: {$first: '$objective'},
                branches : {$addToSet: '$branches'},
                category : {$first: '$category'},
                variant  : {$first: '$variant'},
                item     : {
                    $addToSet: {
                        _id     : '$item._id',
                        name    : '$item.name',
                        packing : '$item.packing',
                        branches: '$itemBranches'
                    }
                },
                createdBy: {$first: '$createdBy'},
                editedBy : {$first: '$editedBy'},
                itemTotal: {$first: '$itemTotal'}
            }
        });

        pipeLine.push({
            $project: {
                _id      : 1,
                root_id  : 1,
                objective: 1,
                branches : 1,
                category : 1,
                variant  : 1,
                item     : 1,
                itemCount: {$size: '$item'},
                createdBy: 1,
                editedBy : 1,
                itemTotal: 1
            }
        });

        pipeLine.push({
            $group: {
                _id      : '$category._id',
                root_id  : {$first: '$root_id'},
                objective: {$first: '$objective'},
                branches : {$first: '$branches'},
                category : {$first: '$category'},
                variant  : {
                    $addToSet: {
                        _id : '$variant._id',
                        name: '$variant.name',
                        item: '$item'
                    }
                },
                itemCount: {$sum: '$itemCount'},
                createdBy: {$first: '$createdBy'},
                editedBy : {$first: '$editedBy'},
                itemTotal: {$first: '$itemTotal'}
            }
        });

        pipeLine.push({
            $group: {
                _id      : '$root_id',
                objective: {$first: '$objective'},
                branches : {$first: '$branches'},
                category : {
                    $addToSet: {
                        _id      : '$category._id',
                        name     : '$category.name',
                        variant  : '$variant',
                        itemCount: '$itemCount'
                    }
                },
                itemCount: {$sum: '$itemCount'},
                createdBy: {$first: '$createdBy'},
                editedBy : {$first: '$editedBy'},
                itemTotal: {$first: '$itemTotal'}
            }
        });

        return pipeLine;
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun() {
            var query = req.query || {};
            var lastLogOut = new Date(query.lastLogOut);

            var queryObject = {};
            var ids;

            if (query._id) {
                ids = query._id.split(',');
                ids = ids.objectID();
                queryObject._id = {
                    $in: ids
                };

            }

            if (query.objective) {
                ids = query.objective.split(',');
                ids = ids.objectID();
                queryObject.objective = {
                    $in: ids
                };
            }

            queryObject.$or = [{
                'editedBy.date': {$gt: lastLogOut}
            }, {
                $and: [{
                    'createdBy.date': {$gt: lastLogOut}
                }, {
                    'editedBy.date': {$exists: false}
                }]
            }];

            DistributionFormModel.find(queryObject)
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    // res.status(200).send(result);
                    next({status: 200, body: {data: result, total: result.length}});
                });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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
        function queryRun() {
            var query = req.query || {};
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var isMobile = req.isMobile;
            var $defProjection = {
                branch      : 1,
                category    : 1,
                variant     : 1,
                item        : 1,
                branches    : 1,
                objective   : 1,
                items       : 1,
                createdBy   : 1,
                editedBy    : 1,
                user        : 1,
                data        : 1,
                itemBranches: 1,
                itemCount   : 1,
                itemTotal   : 1,
                packing     : 1,
                size        : 1,
                root_id     : 1
            };
            var key;
            var queryObject = {};
            var pipeLine;
            var aggregation;
            var ids;
            var aggregateHelper;

            if (query._id) {
                ids = query._id.split(',');
                ids = ids.objectID();
                queryObject._id = {
                    $in: ids
                };

            }

            if (query.objective) {
                ids = query.objective.split(',');
                ids = ids.objectID();
                queryObject.objective = {
                    $in: ids
                };
            }

            if (isMobile) {
                async.waterfall([
                    function (waterfallCb) {
                        key = req.session.id + '.' + 'distribution';
                        redis.cacheStore.readFromStorage(key, function (err, value) {
                            var valueJSON;

                            if (err) {
                                return waterfallCb(err);
                            }

                            if (value) {
                                valueJSON = JSON.parse(value);
                            }

                            return waterfallCb(null, valueJSON.objectiveIds);

                        });
                    },
                    function (ids, waterfallCb) {
                        if (queryObject.count) {
                            delete queryObject.count;
                        }
                        if (queryObject.page) {
                            delete queryObject.page;
                        }
                        if (ids && ids.length) {
                            if (queryObject._id) {
                                queryObject._id.$in = _.union(queryObject._id.$in, ids);
                            } else {
                                queryObject._id = {
                                    $in: ids
                                };
                            }
                        }

                        DistributionFormModel.find(queryObject)
                            .skip(skip)
                            .limit(limit)
                            .exec(function (err, result) {
                                if (err) {
                                    return waterfallCb(err);
                                }

                                return waterfallCb(null, {data: result, total: result.length}
                                );
                            });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    return next({
                        status: 200,
                        body  : result
                    });
                });
            } else {
                aggregateHelper = new AggregationHelper($defProjection, queryObject);

                pipeLine = getAllPipeline({
                    aggregateHelper: aggregateHelper,
                    queryObject    : queryObject,
                    isMobile       : isMobile,
                    skip           : skip,
                    limit          : limit
                });

                aggregation = DistributionFormModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true
                };

                aggregation.exec(function (err, result) {
                    var itemTotal;
                    var itemCount;

                    if (err) {
                        return next(err);
                    }

                    if (!result.length) {

                        return next({
                            status: 200,
                            body  : {
                                data     : [],
                                total    : 0,
                                itemCount: 0
                            }
                        });
                    }

                    itemTotal = result[0].itemTotal;
                    delete result[0].itemTotal;

                    itemCount = result[0].itemCount;
                    delete result[0].itemCount;

                    return next({
                        status: 200,
                        body  : {
                            data     : result,
                            total    : itemTotal,
                            itemCount: itemCount
                        }
                    });
                });
            }
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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

            DistributionFormModel.findById(id)
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                });
        }

        access.getReadAccess(req, ACL_MODULES.OBJECTIVE, function (err, allowed) {
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

    this.update = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const id = req.params.id;

        const queryRun = (body, callback) => {
            const setItemBody = body.items || [];

            DistributionFormModel.findById(id, (err, model) => {
                if (err) {
                    return next(err);
                }

                if (!model) {
                    const error = new Error('Form not found');

                    error.status = 400;
                    return next(error);
                }

                const formAsJson = model.toJSON();
                const setItem = formAsJson.items;
                const isItems = {};

                setItem.forEach((container, index) => {
                    const itemId = container.item;
                    const branches = {};

                    container.branches.forEach((container, index) => {
                        const branchId = container.branch;

                        branches[branchId] = {
                            index,
                        };
                    });

                    isItems[itemId] = {
                        index,
                        branches,
                    };
                });

                setItemBody.forEach((container) => {
                    const itemId = container.item;

                    if (isItems[itemId]) {
                        const isBranches = isItems[itemId].branches;

                        return container.branches.forEach((bodyItemBranch, index) => {
                            const branchId = bodyItemBranch.branch;
                            const itemIndex = isItems[itemId].index;

                            if (isBranches[branchId]) {
                                const branchIndex = isBranches[branchId].index;

                                model.items[itemIndex].branches[branchIndex].set(bodyItemBranch);
                            } else {
                                isBranches[bodyItemBranch.branch] = {
                                    index,
                                };

                                model.items[itemIndex].branches.push(bodyItemBranch);
                                model.branches = {
                                    $addToSet: bodyItemBranch.branch,
                                };
                            }
                        });
                    }

                    isItems[itemId] = {
                        index: model.items.length,
                        branches: {},
                    };

                    model.items.push(container);

                    container.branches.forEach((bodyItemBranch, index) => {
                        isItems[itemId].branches[bodyItemBranch.branch] = {
                            index,
                        };
                        model.branches.addToSet(bodyItemBranch.branch);
                    });
                });

                model.editedBy = {
                    user: userId,
                    date: Date.now(),
                };

                model.save((err, model) => {
                    callback(err, model);
                });
            });
        };

        async.waterfall([

            (cb) => {
                access.getEditAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (personnel, allowed, cb) => {
                bodyValidator.validateBody(req.body, accessRoleLevel, CONTENT_TYPES.DISTRIBUTIONFORM, 'update', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            ObjectiveModel.findById(result.objective)
                .lean()
                .exec()
                .then((objective) => {
                    if (objective) {
                        const eventPayload = {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: objective,
                        };

                        if (objective.context === CONTENT_TYPES.OBJECTIVES) {
                            ActivityLog.emit('objective:distribution-form:updated', eventPayload);
                        }

                        if (objective.context === CONTENT_TYPES.INSTORETASKS) {
                            ActivityLog.emit('in-store-task:distribution-form:updated', eventPayload);
                        }
                    }
                });

            res.status(200).send(result);
        });
    };

    this.saveToRedis = function (req, res, next) {
        var body = req.body;
        var err;
        if (!body.ids) {
            err = new Error(500);
            return next(err);
        }
        var userId = req.session.id;
        var key = userId + '.' + body.type;
        var objectToSave = {
            objectiveIds: body.ids
        };
        redis.cacheStore.writeToStorage(key, JSON.stringify(objectToSave), '864000');

        res.status(200).send();
    };
};

module.exports = DistributionForm;
