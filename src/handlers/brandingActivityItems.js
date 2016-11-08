var Promotions = function (db, redis, event) {
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    const BrandingAndDisplayItemModel = require('./../types/brandingAndDisplayItem/model');
    const BrandingAndDisplayModel = require('./../types/brandingAndDisplay/model');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')(db);
    var bodyValidator = require('../helpers/bodyValidator');
    var CommentHandler = require('./comment');
    var commentHandler = new CommentHandler(db);
    var commentCreator = commentHandler.commentCreator;

    var $defProjection = {
        _id               : 1,
        outlet            : 1,
        branch            : 1,
        brandingAndDisplay: 1,
        comment           : 1,
        createdBy         : 1,
        editedBy          : 1,
        total             : 1
    };

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.BRANDINGANDDISPLAY,
                filter     : query.filter || {},
                personnel  : personnel
            });
            var aggregateHelper;
            var key;
            var pipeLine = [];
            var aggregation;
            var sortOutletName = {name: 1};

            var sort = query.sort || {'branch.name': 1};

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            if (sort['outlet.name.en']) {
                sortOutletName = {'name.en': sort['outlet.name.en']};
            }

            if (sort['outlet.name.ar']) {
                sortOutletName = {'name.ar': sort['outlet.name.ar']};
            }

            if (query.brandingAndDisplay) {
                queryObject.brandingAndDisplay = ObjectId(query.brandingAndDisplay);
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine.push({
                $match: _.pick(queryObject, 'brandingAndDisplay')
            });

            pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from             : 'branches',
                key              : 'branch',
                addMainProjection: ['outlet']
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'outlets',
                key : 'outlet'
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'createdBy.user',
                isArray        : false,
                addProjection  : ['_id', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'position', 'accessRole'],
                includeSiblings: {createdBy: {date: 1}}
            }));

            if (queryObject.country) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.country': queryObject.country
                            },
                            {
                                'createdBy.user.country': {$exists: false}
                            }
                        ]
                    }
                });
            }

            if (queryObject.region) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.region': queryObject.region
                            },
                            {
                                'createdBy.user.region': {$exists: false}
                            }
                        ]
                    }
                });
            }

            if (queryObject.subRegion) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.subRegion': queryObject.subRegion
                            },
                            {
                                'createdBy.user.subRegion': {$exists: false}
                            }
                        ]
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

            pipeLine.push({
                $project: {
                    _id      : 1,
                    outlet   : {$arrayElemAt: ['$outlet', 0]},
                    branch   : {$arrayElemAt: ['$branch', 0]},
                    comment  : 1,
                    createdBy: 1,
                    editedBy : 1
                }
            });

            pipeLine.push({
                $group: {
                    _id     : '$outlet._id',
                    branches: {
                        $push: {
                            branch: {
                                name: '$branch.name',
                                _id : '$branch._id'
                            },

                            createdBy: '$createdBy',
                            editedBy : '$editedBy',
                            _id      : '$_id'
                        }
                    },

                    name : {$first: '$outlet.name'},
                    count: {$sum: 1},
                    total: {$first: '$total'}
                }
            });

            pipeLine.push({
                $sort: sort
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

            aggregation = BrandingAndDisplayItemModel.aggregate(pipeLine);

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

        access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_ITEMS, function (err, allowed, personnel) {
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
            var createdBy = {
                user: req.session.uId,
                date: new Date()
            };
            body.createdBy = createdBy;
            body.editedBy = createdBy;

            async.waterfall([
                function (callback) {
                    BrandingAndDisplayModel.findByIdAndUpdate(body.brandingAndDisplay, {
                        $addToSet: {personnel: ObjectId(body.createdBy.user)}
                    }, function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback();
                        }
                    });
                },
                function (callback) {
                    BrandingAndDisplayItemModel.create(body, callback);
                },
                function (model, callback) {
                    var saveObj = {
                        text       : body.commentText,
                        objectiveId: model._id,
                        userId     : req.session.uId,
                        files      : req.files
                    };

                    commentCreator(saveObj, BrandingAndDisplayItemModel, function (err, comment) {
                        if (err) {
                            return callback(err);
                        }

                        callback(null, model, comment);
                    });
                },
                function (model, comment, callback) {
                    BrandingAndDisplayItemModel.findByIdAndUpdate(model._id, {$addToSet: {comments: comment._id}}, {new: true}, callback);
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                event.emit('activityChange', {
                    module    : ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_ITEMS,
                    actionType: ACTIVITY_TYPES.UPDATED,
                    createdBy : result.get('createdBy'),
                    itemId    : result.brandingAndDisplay,
                    itemType  : CONTENT_TYPES.BRANDINGANDDISPLAY
                });

                res.status(200).send(result);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_ITEMS, function (err, allowed) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BRANDINGANDDISPLAYITEMS, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };
};

module.exports = Promotions;
