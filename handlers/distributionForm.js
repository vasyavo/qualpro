'use strict';
var DistributionForm = function (db, redis, event) {
    var mongoose = require('mongoose');
    var async = require('async');
    var CONSTANTS = require('../constants/mainConstants');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var modelAndSchemaName = CONTENT_TYPES.DISTRIBUTIONFORM;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);

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

        model = new Model(body);
        model.save(function (error, model) {
            if (error) {
                return callback(error);
            }

            callback(null, model);
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var userId = req.session.uId;

            self.createForm(userId, body, function (err, model) {
                if (err) {
                    return next(err);
                }

                event.emit('activityChange', {
                    module    : 7,
                    actionType: ACTIVITY_TYPES.CREATED,
                    createdBy : model.get('createdBy'),
                    itemId    : model._id,
                    itemType  : CONTENT_TYPES.DISTRIBUTIONFORM
                });

                res.status(201).send(model);
            });
        }

        access.getWriteAccess(req, 7, function (err, allowed) {
            var body = req.body;

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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.DISTRIBUTIONFORM, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
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

            Model.find(queryObject)
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    // res.status(200).send(result);
                    next({status: 200, body: {data: result, total: result.length}});
                });
        }

        access.getReadAccess(req, 7, function (err, allowed) {
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

                        Model.find(queryObject)
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

                aggregation = Model.aggregate(pipeLine);

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

        access.getReadAccess(req, 7, function (err, allowed) {
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

            Model.findById(id)
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                });
        }

        access.getReadAccess(req, 7, function (err, allowed) {
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

    this.update = function (req, res, next) {
        function queryRun(body) {
            var id = req.params.id;
            var bodyItems = body.items || [];

            Model.findById(id, function (err, model) {
                var isItems = {};
                var objModelItems;

                if (err) {
                    return next(err);
                }

                if (!model) {
                    return next();
                }

                objModelItems = model.items.toObject();

                objModelItems.forEach(function (objModelItem, index) {
                    var itemId = objModelItem.item.toJSON();
                    var isBranches = {};

                    objModelItem.branches.forEach(function (branch, index) {
                        var branchId = branch.branch.toJSON();

                        isBranches[branchId] = {index: index};
                    });

                    isItems[itemId] = {
                        index   : index,
                        branches: isBranches
                    };
                });

                bodyItems.forEach(function (bodyItem) {
                    var categoryId = bodyItem.category;
                    var variantId = bodyItem.variant;
                    var itemId = bodyItem.item;
                    var isBranches;

                    if (isItems[itemId]) {
                        isBranches = isItems[itemId].branches;

                        bodyItem.branches.forEach(function (bodyItemBranch, index) {
                            var branchId = bodyItemBranch.branch;
                            var itemIndex = isItems[itemId].index;
                            var branchIndex;

                            if (isBranches[branchId]) {
                                branchIndex = isBranches[branchId].index;
                                model.items[itemIndex].branches[branchIndex].set(bodyItemBranch);
                            } else {
                                isBranches[bodyItemBranch.branch] = {index: index};

                                model.items[itemIndex].branches.push(bodyItemBranch);
                                model.branches.addToSet(bodyItemBranch.branch);
                            }
                        });
                    } else {
                        isItems[itemId] = {
                            index   : model.items.length,
                            branches: {}
                        };

                        model.items.push(bodyItem);

                        bodyItem.branches.forEach(function (bodyItemBranch, index) {
                            isItems[itemId].branches[bodyItemBranch.branch] = {index: index};

                            model.branches.addToSet(bodyItemBranch.branch);
                        });
                    }
                });

                model.editedBy = {
                    user: req.session.uId,
                    date: Date.now()
                };

                model.save({new: true}, function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    event.emit('activityChange', {
                        module    : 7,
                        actionType: ACTIVITY_TYPES.UPDATED,
                        createdBy : result.get('editedBy'),
                        itemId    : result._id,
                        itemType  : CONTENT_TYPES.DISTRIBUTIONFORM
                    });

                    res.status(200).send(result);
                });
            });
        }

        access.getEditAccess(req, 7, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.DISTRIBUTIONFORM, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
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
