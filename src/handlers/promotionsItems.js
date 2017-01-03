var Promotions = function (db, redis, event) {
    var async = require('async');
    var _ = require('lodash');
    var logger = require('../utils/logger');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var PromotionItemModel = require('./../types/promotionItem/model');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')(db);
    var bodyValidator = require('../helpers/bodyValidator');
    var CommentHandler = require('./comment');
    var commentHandler = new CommentHandler(db);
    var commentCreator = commentHandler.commentCreator;

    var $defProjection = {
        _id         : 1,
        outlet      : 1,
        branch      : 1,
        dateStart   : 1,
        dateEnd     : 1,
        rsp         : 1,
        status      : 1,
        opening     : 1,
        sellIn      : 1,
        promotion   : 1,
        closingStock: 1,
        sellOut     : 1,
        displayType : 1,
        comment     : 1,
        createdBy   : 1,
        editedBy    : 1,
        total       : 1
    };

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var isMobile = req.isMobile;
            var query = req.query;
            var page = query.page || 1;
            var limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.PROMOTIONSITEMS,
                filter     : query.filter || {},
                personnel  : personnel
            });
            var key;
            var pipeLine = [];
            var aggregation;
            var countryFilter;
            var regionFilter;
            var subRegionFilter;
            var aggregateHelper;

            var sort = query.sort || {
                    'outlet.name': 1,
                    'branch.name': 1
                };

            var sortOutletName = {name: 1};

            for (key in sort) {
                sort[key] = parseInt(sort[key]);
            }

            if (sort['outlet.name.en']) {
                sortOutletName = {'name.en': sort['outlet.name.en']};
            }

            if (sort['outlet.name.ar']) {
                sortOutletName = {'name.ar': sort['outlet.name.ar']};
            }

            if (query.promotion) {
                queryObject.promotion = ObjectId(query.promotion);
            }

            if (queryObject.country) {
                countryFilter = queryObject.country;
                delete queryObject.country;
            }

            if (queryObject.region) {
                regionFilter = queryObject.region;
                delete queryObject.region;
            }

            if (queryObject.subRegion) {
                subRegionFilter = queryObject.subRegion;
                delete queryObject.subRegion;
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine.push({
                $match: queryObject
            });

            pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from   : 'branches',
                key    : 'branch',
                isArray: false
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from   : 'outlets',
                key    : 'outlet',
                isArray: false
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'createdBy.user',
                isArray        : false,
                addProjection  : ['firstName', 'lastName', 'country', 'region', 'subRegion', 'position', 'accessRole'],
                includeSiblings: {
                    createdBy: {
                        date: 1
                    }
                }
            }));

            if (countryFilter) {
                pipeLine.push({
                    $match: {
                        'createdBy.user.country': countryFilter
                    }
                });
            }

            if (regionFilter) {
                pipeLine.push({
                    $match: {
                        'createdBy.user.region': regionFilter
                    }
                });
            }

            if (subRegionFilter) {
                pipeLine.push({
                    $match: {
                        'createdBy.user.subRegion': subRegionFilter
                    }
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

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'comments',
                key          : 'comment',
                addProjection: ['createdBy', 'body', 'editedBy', 'isArchived', 'attachments', 'taskId'],
                isArray      : false
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from   : 'displayTypes',
                key    : 'displayType',
                isArray: true
            }));

            pipeLine.push({
                $lookup: {
                    from        : 'personnels',
                    localField  : 'comment.createdBy.user',
                    foreignField: '_id',
                    as          : 'comment.createdBy.user'
                }
            });

            pipeLine.push({
                $lookup: {
                    from        : 'personnels',
                    localField  : 'comment.editedBy.user',
                    foreignField: '_id',
                    as          : 'comment.editedBy.user'
                }
            });

            pipeLine.push({
                $unwind: {
                    path                      : '$comment.attachments',
                    preserveNullAndEmptyArrays: true
                }
            });

            pipeLine.push({
                $lookup: {
                    from        : 'files',
                    localField  : 'comment.attachments',
                    foreignField: '_id',
                    as          : 'comment.attachments'
                }
            });

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    'comment': {
                        'createdBy'  : {
                            user: {$arrayElemAt: ['$comment.createdBy.user', 0]},
                            date: 1
                        },
                        'editedBy'   : {
                            user: {$arrayElemAt: ['$comment.editedBy.user', 0]},
                            date: 1
                        },
                        'attachments': {
                            $arrayElemAt: ['$comment.attachments', 0]
                        },
                        _id          : 1,
                        body         : 1,
                        isArchived   : 1,
                        taskId       : 1

                    }
                })
            });

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    'comment': {
                        'createdBy': {
                            user: {
                                'firstName': '$comment.createdBy.user.firstName',
                                'lastName' : '$comment.createdBy.user.lastName',
                                '_id'      : '$comment.createdBy.user._id'
                            },
                            date: 1
                        },
                        'editedBy' : {
                            user: {
                                'firstName': '$comment.editedBy.user.firstName',
                                'lastName' : '$comment.editedBy.user.lastName',
                                '_id'      : '$comment.editedBy.user._id'
                            },
                            date: 1
                        },
                        attachments: 1,
                        _id        : 1,
                        body       : 1,
                        isArchived : 1,
                        taskId     : 1
                    }
                })
            });

            pipeLine.push({
                $group: aggregateHelper.getGroupObject({
                    _id             : '$comment._id',
                    comment         : {$first: '$comment'},
                    attachmentsGroup: {$addToSet: '$comment.attachments'},
                    parentId        : {$first: '$_id'}
                })
            });

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    _id    : '$parentId',
                    comment: {
                        createdBy  : 1,
                        editedBy   : 1,
                        attachments: '$attachmentsGroup',
                        _id        : 1,
                        body       : 1,
                        isArchived : 1,
                        taskId     : 1
                    }
                })
            });

            pipeLine.push({
                $project: {
                    _id         : 1,
                    outlet      : 1,
                    branch      : 1,
                    dateStart   : 1,
                    dateEnd     : 1,
                    rsp         : 1,
                    status      : 1,
                    opening     : 1,
                    sellIn      : 1,
                    closingStock: 1,
                    sellOut     : 1,
                    displayType : 1,
                    comment     : 1,
                    createdBy   : 1,
                    editedBy    : 1,
                    total       : 1
                }
            });

            pipeLine.push({
                $sort: sort
            });

            pipeLine.push({
                $skip: skip
            });

            pipeLine.push({
                $limit: limit
            });

            pipeLine.push({
                $group: {
                    _id     : '$outlet._id',
                    branches: {
                        $push: {
                            dateStart   : '$dateStart',
                            dateEnd     : '$dateEnd',
                            rsp         : '$rsp',
                            status      : '$status',
                            opening     : '$opening',
                            sellIn      : '$sellIn',
                            closingStock: '$closingStock',
                            sellOut     : '$sellOut',
                            displayType : '$displayType',
                            comment     : '$comment',
                            createdBy   : '$createdBy',
                            editedBy    : '$editedBy',
                            name        : '$branch.name',
                            _id         : '$branch._id'
                        }
                    },
                    name    : {$first: '$outlet.name'},
                    count   : {$sum: 1},
                    total   : {$first: '$total'}
                }
            });

            pipeLine.push({
                $sort: sortOutletName
            });

            pipeLine.push({
                $group: {
                    _id  : '$total',
                    data : {$push: '$$ROOT'},
                    count: {$sum: '$count'}
                }
            });

            pipeLine.push({
                $project: {
                    _id  : 0,
                    total: '$_id',
                    data : 1,
                    count: 1
                }
            });

            aggregation = PromotionItemModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                if (err) {
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                next({status: 200, body: response});
            });
        }

        access.getReadAccess(req, ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS, function (err, allowed, personnel) {
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
        function queryRun(body) {
            var sellInSum = 0;
            var closingStockSum = 0;
            var sellOutSum = 0;
            var createdBy = {
                user: req.session.uId,
                date: new Date()
            };

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            if (body.sellIn) {
                body.sellIn.forEach(function (sellIn) {
                    sellInSum += sellIn * 1;
                });

                body.sellIn.push(sellInSum);
            }

            if (body.closingStock) {
                body.closingStock.forEach(function (closingStock) {
                    closingStockSum += closingStock * 1;
                });

                body.closingStock.push(closingStockSum);
            }

            if (body.sellOut) {
                body.sellOut.forEach(function (sellOut) {
                    sellOutSum += sellOut * 1;
                });

                body.sellOut.push(sellOutSum);
            }

            if (new Date(body.dateEnd) < new Date()) {
                body.status = PROMOTION_STATUSES.EXPIRED;
            }

            async.waterfall([
                function (callback) {
                    PromotionItemModel.create(body, (error, model) => {
                        if (error) {
                            return callback(error);
                        }

                        res.status(200).send(model);

                        callback(null, model);
                    });
                },

                function (model, callback) {
                    var saveObj = {
                        text       : body.commentText,
                        objectiveId: model._id,
                        userId     : req.session.uId,
                        files      : req.files
                    };

                    commentCreator(saveObj, PromotionItemModel, function (err, comment) {
                        if (err) {
                            return callback(err);
                        }

                        callback(null, model, comment);
                    });
                },

                function (model, comment, callback) {
                    PromotionItemModel.findByIdAndUpdate(model._id, {$set: {comment: comment._id}}, {new: true}, callback);
                }

            ], function (err, result) {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }

                    return logger.error(err);
                }

                event.emit('activityChange', {
                    module    : ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS,
                    actionType: ACTIVITY_TYPES.UPDATED,
                    createdBy : result.get('createdBy'),
                    itemId    : result.promotion,
                    itemType  : CONTENT_TYPES.PROMOTIONS
                });
            });
        }

        access.getWriteAccess(req, ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.PROMOTIONSITEMS, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };
};

module.exports = Promotions;
