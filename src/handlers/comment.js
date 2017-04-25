const ActivityLog = require('./../stories/push-notifications/activityLog');
const CommentModel = require('./../types/comment/model');
const ObjectiveModel = require('./../types/objective/model');
const CompetitorBrandingModel = require('./../types/competitorBranding/model');
const PromotionModel = require('./../types/promotion/model');
const PromotionItemModel = require('./../types/promotionItem/model');
const MarketingCampaignModel = require('./../types/marketingCampaign/model');
const BrandingAndMonthlyDisplayModel = require('./../types/brandingAndMonthlyDisplay/model');
const MarketingCampaignItemModel = require('./../types/marketingCampaignItem/model');
const CompetitorPromotionModel = require('./../types/competitorPromotion/model');
const ContactUsModel = require('../types/contactUs/model');
const redis = require('./../helpers/redisClient');

var Comment = function () {
    var mongoose = require('mongoose');
    var async = require('async');
    var _ = require('lodash');
    var moment = require('moment');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var FilesModel = require('./../types/file/model');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler();
    var access = require('../helpers/access')();
    var bodyValidator = require('../helpers/bodyValidator');
    var self = this;
    var ObjectId = mongoose.Types.ObjectId;

    var $defProjection = {
        _id        : 1,
        body       : 1,
        taskId     : 1,
        attachments: 1,
        isArchived : 1,
        createdBy  : 1,
        editedBy   : 1
    };

    this.commentCreator = (saveObj, callback) => {
        async.waterfall([

            (cb) => {
                if (!saveObj.files) {
                    return cb(null, []);
                }

                fileHandler.uploadFile(saveObj.userId, saveObj.files, CONTENT_TYPES.COMMENT, (err, filesIds) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, filesIds);
                });
            },

            (filesIds, cb) => {
                const newComment = new CommentModel();

                newComment.set({
                    body: saveObj.text,
                    taskId: saveObj.objectiveId,
                    attachments: filesIds,
                    createdBy: saveObj.createdBy,
                    editedBy: saveObj.createdBy
                });

                newComment.save((err, comment) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, comment);
                });
            }

        ], callback);
    };

    this.create = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const isMobile = req.isMobile;

        function queryRun(body) {
            const createdBy = {
                date: new Date(),
                user: userId
            };
            const saveObj = {
                text: body.commentText,
                objectiveId: body.objectiveId,
                files: req.files,
                userId,
                createdBy,
                updatedBy: createdBy,
            };

            if (saveObj.commentText) {
                saveObj.commentText = _.escape(saveObj.commentText);
            }

            const context = body.context;

            if (!context) {
                const error = new Error();

                error.status = 400;
                error.message = 'No context';
                return next(error);
            }

            let ContextModel;
            let mid;

            switch (context) {
                case CONTENT_TYPES.MARKETING_CAMPAIGN:
                    ContextModel = MarketingCampaignModel;
                    mid = ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY;
                    break;
                case CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY:
                    ContextModel = BrandingAndMonthlyDisplayModel;
                    mid = ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT;
                    break;
                case CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM:
                    ContextModel = MarketingCampaignItemModel;
                    mid = ACL_MODULES.AL_ALALI_BRANDING_ACTIVITY_ITEMS;
                    break;
                case CONTENT_TYPES.COMPETITORBRANDING:
                    ContextModel = CompetitorBrandingModel;
                    mid = ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT;
                    break;
                case CONTENT_TYPES.COMPETITORPROMOTION:
                    ContextModel = CompetitorPromotionModel;
                    mid = ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY;
                    break;
                case CONTENT_TYPES.PROMOTIONS:
                    ContextModel = PromotionModel;
                    mid = ACL_MODULES.AL_ALALI_PROMO_EVALUATION;
                    break;
                case CONTENT_TYPES.PROMOTIONSITEMS:
                    ContextModel = PromotionItemModel;
                    mid = ACL_MODULES.AL_ALALI_PROMOTIONS_ITEMS;
                    break;
                case CONTENT_TYPES.OBJECTIVES:
                    ContextModel = ObjectiveModel;
                    mid = ACL_MODULES.OBJECTIVE;
                    break;
                case CONTENT_TYPES.INSTORETASKS:
                    ContextModel = ObjectiveModel;
                    mid = ACL_MODULES.IN_STORE_REPORTING;
                    break;
                case CONTENT_TYPES.CONTACT_US :
                    ContextModel = ContactUsModel;
                    mid = ACL_MODULES.CONTACT_US;
                    break;
            }

            if (!ContextModel) {
                const error = new Error();
                error.status = 400;
                error.message = 'Model for comments not found';

                return next(error);
            }

            async.waterfall([

                (cb) => {
                    self.commentCreator(saveObj, cb);
                },

                (comment, cb) => {
                    ContextModel.findByIdAndUpdate(saveObj.objectiveId, {
                        $push: {
                            comments: comment._id,
                        },
                        $set: {
                            editedBy: {
                                user: ObjectId(userId),
                                date: new Date(),
                            },
                        },
                    }, {
                        new: true,
                        runValidators: true,
                    }, (err, updatedContextModel) => {
                        if (err) {
                            return cb(err);
                        }

                        if (!updatedContextModel) {
                            const error = new Error('Context document not found');

                            error.status = 400;
                            return cb(error);
                        }

                        const eventPayload = {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: updatedContextModel.toJSON(),
                        };

                        if (context === CONTENT_TYPES.OBJECTIVES) {
                            ActivityLog.emit('objective:comment-added', eventPayload);
                        }

                        if (context === CONTENT_TYPES.INSTORETASKS) {
                            ActivityLog.emit('in-store-task:comment-added', eventPayload);
                        }

                        if (context === CONTENT_TYPES.COMPETITORPROMOTION) {
                            ActivityLog.emit('reporting:competitor-promotion-activities:comment-added', eventPayload);
                        }

                        if (context === CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY) {
                            ActivityLog.emit('marketing:al-alali-branding-and-monthly-display:commend-added', eventPayload);
                        }

                        cb(null, comment);
                    });
                },

                (comment, waterfallCb) => {
                    var pipeLine = [];
                    var aggregateHelper;
                    var aggregation;

                    aggregateHelper = new AggregationHelper($defProjection);

                    pipeLine.push({
                        $match: {
                            _id: comment._id
                        }
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from         : 'files',
                        key          : 'attachments',
                        addProjection: ['contentType', 'originalName', 'preview']
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from           : 'personnels',
                        key            : 'createdBy.user',
                        isArray        : false,
                        addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? [] : ['accessRole']),
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
                                        imageSrc: 1
                                    }
                                }
                            }
                        }));
                    }

                    pipeLine.push({
                        $project: aggregateHelper.getProjection({
                            createdBy: {
                                user    : 1,
                                date    : 1,
                                diffDate: {
                                    $let: {
                                        vars: {
                                            dateNow   : new Date(),
                                            createDate: '$createdBy.date'
                                        },
                                        in  : {$subtract: ['$$dateNow', '$$createDate']}
                                    }
                                }
                            }
                        })
                    });

                    aggregation = CommentModel.aggregate(pipeLine);

                    aggregation.options = {
                        'allowDiskUse': true
                    };

                    aggregation.exec((err, result) => {
                        if (err) {
                            return waterfallCb(err);
                        }

                        const body = result.length ? result[0] : {};

                        waterfallCb(null, body);
                    });
                },

            ], (err, comment) => {
                if (err) {
                    return next(err);
                }

                if (comment.body) {
                    comment.body = _.unescape(comment.body);
                }

                res.status(201).send(comment);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.COMMENT, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMMENT, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    function getAllPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var forSync = options.forSync;
        var isMobile = options.isMobile;
        var skip = options.skip;
        var limit = options.limit;
        var pipeLine = [];

        pipeLine.push({
            $match: queryObject
        });

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'files',
                key: 'attachments',
                isArray: true,
                addProjection: ['contentType', 'originalName', 'extension', 'preview']
            }));
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: { createdBy: { date: 1 } }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: { editedBy: { date: 1 } }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'createdBy.user.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'createdBy.user.position',
            isArray: false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'editedBy.user.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'editedBy.user.position',
            isArray: false,
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                createdBy: {
                    user: 1,
                    date: 1,
                    diffDate: {
                        $let: {
                            vars: {
                                dateNow: new Date(),
                                createDate: '$createdBy.date'
                            },

                            in: { $subtract: ['$$dateNow', '$$createDate'] }
                        }
                    }
                }
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile: isMobile,
            skip: skip,
            limit: limit
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun() {
            var query = req.query;
            var isMobile = req.isMobile;
            var objectiveId = [query.objectiveId] || [];
            var context = query.context;
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper;

            aggregateHelper = new AggregationHelper($defProjection);

            async.waterfall([
                function (waterfallCb) {
                    var key;
                    if (!context || !_.includes([CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS], context) && !isMobile) {
                        return waterfallCb(null);
                    }
                    key = req.session.id + '.' + context;
                    redis.cacheStore.readFromStorage(key, function (err, value) {
                        var valueJSON;
                        if (err) {
                            return waterfallCb(err);
                        }

                        if (value) {
                            valueJSON = JSON.parse(value);
                        }
                        if (valueJSON && valueJSON.objectiveIds) {
                            objectiveId = _.union(valueJSON.objectiveIds, objectiveId);
                        }

                        return waterfallCb(null);

                    });
                },
                function (waterfallCb) {
                    var aggregation;
                    var queryObject = {
                        taskId: {
                            $in: objectiveId.objectID()
                        }
                    };
                    var pipeLine;

                    if (!objectiveId.length) {
                        return waterfallCb(null, {data: [], total: 0});
                    }

                    aggregateHelper.setSyncQuery(queryObject, lastLogOut);

                    pipeLine = getAllPipeline({
                        aggregateHelper: aggregateHelper,
                        queryObject    : queryObject,
                        forSync        : true,
                        isMobile       : req.isMobile
                    });

                    aggregation = CommentModel.aggregate(pipeLine);

                    aggregation.options = {
                        'allowDiskUse': true
                    };

                    aggregation.exec((err, result) => {
                        if (err) {
                            return waterfallCb(err);
                        }

                        const body = result.length ?
                            result[0] : { data: [], total: 0 };

                        body.data.forEach(comment => {
                            if (comment.body) {
                                comment.body = _.unescape(comment.body);
                            }
                        });

                        waterfallCb(null, body);
                    });
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: result});
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMMENT, function (err, allowed) {
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
            var query = req.query;
            var isMobile = req.isMobile;
            var objectiveId = [query.objectiveId] || [];
            var context = query.context;
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var aggregateHelper;

            aggregateHelper = new AggregationHelper($defProjection);

            async.waterfall([
                function (waterfallCb) {
                    var key;
                    if (!context || !_.includes([CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS], context) && !isMobile) {
                        return waterfallCb(null);
                    }
                    key = req.session.id + '.' + context;
                    redis.cacheStore.readFromStorage(key, function (err, value) {
                        var valueJSON;
                        if (err) {
                            return waterfallCb(err);
                        }

                        if (value) {
                            valueJSON = JSON.parse(value);
                        }
                        if (valueJSON && valueJSON.objectiveIds) {
                            objectiveId = _.union(valueJSON.objectiveIds, objectiveId);
                        }

                        return waterfallCb(null);

                    });
                },
                function (waterfallCb) {
                    var queryObject;
                    var pipeLine;
                    var aggregation;

                    if (!objectiveId.length) {
                        return waterfallCb(null, {data: [], total: 0});
                    }

                    queryObject = {
                        taskId: {
                            $in: objectiveId.objectID()
                        }
                    };

                    pipeLine = getAllPipeline({
                        aggregateHelper: aggregateHelper,
                        queryObject    : queryObject,
                        isMobile       : isMobile,
                        skip           : skip,
                        limit          : limit
                    });

                    aggregation = CommentModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec((err, result) => {
                        if (err) {
                            return waterfallCb(err);
                        }

                        const body = result.length ?
                            result[0] : { data: [], total: 0 };

                        body.data.forEach(comment => {
                            if (comment.body) {
                                comment.body = _.unescape(comment.body);
                            }
                        });

                        waterfallCb(null, body);
                    });
                }
            ], function (err, comments) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: comments});
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMMENT, function (err, allowed) {
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

    this.getAllWithAttachments = function (req, res, next) {
        function queryRun() {
            var objectiveId = req.query.objectiveId;
            var context = req.query.context;
            var aggregateHelper;
            var ContextModel;
            var isMobile = req.isMobile;

            switch (context) {
                case CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM:
                    ContextModel = MarketingCampaignItemModel;
                    break;
                case CONTENT_TYPES.COMPETITORBRANDING:
                    ContextModel = CompetitorBrandingModel;
                    break;
                case CONTENT_TYPES.COMPETITORPROMOTION:
                    ContextModel = CompetitorPromotionModel;
                    break;
                case CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM:
                    ContextModel = MarketingCampaignItemModel;
                    break;
                case CONTENT_TYPES.PROMOTIONSITEMS:
                    ContextModel = PromotionItemModel;
                    break;
                case CONTENT_TYPES.PROMOTIONS:
                    ContextModel = PromotionModel;
                    break;
                default:
                    ContextModel = ObjectiveModel;
                    break;
            }
            async.waterfall([
                function (waterfallCb) {
                    ContextModel.findById(objectiveId, function (err, objective) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        waterfallCb(null, objective || {});
                    });
                },
                function (objective, waterfallCb) {
                    var pipeLine = [];
                    var aggregation;

                    aggregateHelper = new AggregationHelper($defProjection);

                    pipeLine.push({
                        $match: {
                            _id: {
                                $in: objective.comments || []
                            }
                        }
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from         : 'files',
                        key          : 'attachments',
                        isArray      : true,
                        addProjection: ['contentType', 'originalName', 'extension', 'preview']
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

                    pipeLine.push({
                        $project: aggregateHelper.getProjection({
                            createdBy: {
                                user    : 1,
                                date    : 1,
                                diffDate: {
                                    $let: {
                                        vars: {
                                            dateNow   : new Date(),
                                            createDate: '$createdBy.date'
                                        },
                                        in  : {$subtract: ['$$dateNow', '$$createDate']}
                                    }
                                }
                            }
                        })
                    });

                    pipeLine.push({
                        $sort: {'createdBy.date': -1}
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

                    pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

                    aggregation = CommentModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec((err, result) => {
                        if (err) {
                            return waterfallCb(err);
                        }

                        const body = result.length ?
                            result[0] : { data: [], total: 0 };

                        // fixme crash on click details in marketing campaign item
                        body.data.forEach(comment => {
                            if (comment.body) {
                                comment.body = _.unescape(comment.body);
                            }
                        });

                        waterfallCb(null, body);
                    });
                }
            ], function (err, comments) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: comments});
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMMENT, function (err, allowed) {
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
            var commentId = req.params.id;

            async.waterfall([
                function (cb) {
                    CommentModel.findById(commentId, function (err, commentModel) {
                        var error;
                        var attachments;

                        if (err) {
                            return cb(err);
                        }

                        if (!commentModel) {
                            error = new Error('Comment not found');
                            error.status = 400;
                            return cb(error);
                        }
                        if (commentModel.body) {
                            commentModel.body = _.unescape(commentModel.body);
                        }
                        attachments = commentModel.get('attachments');

                        cb(null, attachments);
                    });
                },
                function (attachments, cb) {
                    FilesModel
                        .find({_id: {$in: attachments}}, function (err, filesModelsArray) {
                            if (err) {
                                return cb(err);
                            }

                            filesModelsArray = filesModelsArray.map(function (fileModel) {
                                var jsonFile = fileModel.toJSON();

                                jsonFile.url = fileHandler.computeUrl(jsonFile.name, CONTENT_TYPES.COMMENT);

                                return jsonFile;
                            });

                            return cb(null, filesModelsArray);
                        });
                }
            ], function (err, filesModelsArray) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(filesModelsArray);
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMMENT, function (err, allowed) {
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

    this.saveToRedis = function (req, res, next) {
        var body = req.body;
        var sessionId;
        var objectToSave;
        var key;
        var err;

        if (!body.ids) {
            err = new Error(500);
            return next(err);
        }
        sessionId = req.session.id;
        key = sessionId + '.' + body.type;
        objectToSave = {
            objectiveIds: body.ids
        };
        redis.cacheStore.writeToStorage(key, JSON.stringify(objectToSave), '864000');

        res.status(200).send();
    };
};
module.exports = Comment;
