const ActivityLog = require('./../stories/push-notifications/activityLog');
const extractBody = require('./../utils/extractBody');

var Promotions = function () {
    var async = require('async');
    var _ = require('lodash');
    var moment = require('moment');
    var logger = require('../utils/logger');
    var EventModel = require('./../types/event/model');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var PromotionItemModel = require('./../types/promotionItem/model');
    var CommentModel = require('./../types/comment/model');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')();
    var bodyValidator = require('../helpers/bodyValidator');
    var CommentHandler = require('./comment');
    var commentHandler = new CommentHandler();
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
        total       : 1,
    };

    this.getById = function (req, res, next) {
        const id = req.params.id;

        PromotionItemModel.findById(id, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
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
                            dateStart      : '$dateStart',
                            dateEnd        : '$dateEnd',
                            rsp            : '$rsp',
                            status         : '$status',
                            opening        : '$opening',
                            sellIn         : '$sellIn',
                            closingStock   : '$closingStock',
                            sellOut        : '$sellOut',
                            displayType    : '$displayType',
                            comment        : '$comment',
                            createdBy      : '$createdBy',
                            editedBy       : '$editedBy',
                            name           : '$branch.name',
                            promotionItemId: '$_id',
                            _id            : '$branch._id'
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

    this.removeItem = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const id = req.params.id;

        const queryRun = (callback) => {
            async.waterfall([

                (cb) => {
                    PromotionItemModel.findOne({ _id : id }).lean().exec(cb);
                },
                (removeItem, cb) => {
                    const eventModel = new EventModel();
                    const options = {
                        headers: {
                            contentType: "PromotionItems",
                            actionType : "remove",
                            user       : userId,
                        },
                        payload: removeItem
                    };
                    eventModel.set(options);
                    eventModel.save((err, model) => {
                        cb(null, err);
                    });
                },
                (err) => {
                    if (err) {
                        if (!res.headersSent) {
                            next(err);
                        }

                        return logger.error(err);
                    }

                    PromotionItemModel.findOneAndRemove({_id: id}, callback)
                },
            ], (err, body) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(body);
            });
        };

        async.waterfall([

            (cb) => {
                access.getArchiveAccess(req, ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            }
        ], (err, body) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(body);
        });
    };

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
            const createdBy = {
                user: userId,
                date: new Date()
            };

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            if (body.sellIn) {
                let sellInSum = 0;

                body.sellIn.forEach((sellIn) => {
                    sellInSum += sellIn * 1;
                });

                body.sellIn.push(sellInSum);
            }

            if (body.closingStock) {
                let closingStockSum = 0;

                body.closingStock.forEach((closingStock) => {
                    closingStockSum += closingStock * 1;
                });

                body.closingStock.push(closingStockSum);
            }

            if (body.sellOut) {
                let sellOutSum = 0;

                body.sellOut.forEach((sellOut) => {
                    sellOutSum += sellOut * 1;
                });

                body.sellOut.push(sellOutSum);
            }

            body.dateEnd = moment(body.dateEnd).add(4, 'h');

            if (body.dateEnd < moment().add(4, 'h')) {
                body.status = PROMOTION_STATUSES.EXPIRED;
            }

            async.waterfall([

                (cb) => {
                    PromotionItemModel.create(body, (error, model) => {
                        if (error) {
                            return cb(error);
                        }

                        res.status(200).send(model);

                        cb(null, model);
                    });
                },

                (model, cb) => {
                    const saveObj = {
                        text       : body.commentText,
                        objectiveId: model._id,
                        userId,
                        files      : req.files,
                        createdBy,
                    };

                    commentCreator(saveObj, (err, comment) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, {
                            model,
                            comment,
                        });
                    });
                },

                (options, cb) => {
                    const {
                        model,
                        comment,
                    } = options;

                    PromotionItemModel.findByIdAndUpdate(model._id, {
                        $set: {
                            comment: comment._id,
                        },
                    }, {
                        new: true,
                    }, cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS, cb);
            },

            (allowed, personnel, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.PROMOTIONSITEMS, 'create', cb);
            },

            queryRun,

        ], (err, model) => {
            if (err) {
                if (!res.headersSent) {
                    next(err);
                }

                return logger.error(err);
            }

            ActivityLog.emit('reporting:al-alali-promo-evaluation:item-published', {
                actionOriginator: userId,
                accessRoleLevel,
                body            : model.toJSON(),
            });
        });
    };

    this.update = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const requestBody = req.body;
        const id = req.params.id;

        const queryRun = (body, callback) => {
            async.waterfall([
                (cb) => {
                    const editedBy = {
                        user: req.session.uId,
                        date: Date.now()
                    };
                    if (body.comment) {
                        CommentModel.findByIdAndUpdate(body.comment.id, { body: body.comment.text, editedBy }, { new: true }, cb)
                    } else {
                        cb();
                    }
                },
                (comment) => {
                    body.editedBy = {
                        user: req.session.uId,
                        date: Date.now()
                    };
                    if (comment) {
                        body.comment = comment._id;
                    }
                    PromotionItemModel.findByIdAndUpdate(id, body, { new: true }, callback)
                }
            ]);
        };

        async.waterfall([
            (cb) => {
                access.getEditAccess(req, ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS, cb);
            },

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(requestBody, accessRoleLevel, CONTENT_TYPES.PROMOTIONSITEMS, 'update', cb);
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
};

module.exports = Promotions;
