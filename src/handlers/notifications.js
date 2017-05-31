const _ = require('lodash');
const async = require('async');
const mongoose = require('mongoose');
const FileHandler = require('./../handlers/file');
const getAwsLinks = require('./../reusableComponents/getAwsLinkForAttachmentsFromModel');
const ACL_MODULES = require('./../constants/aclModulesNames');
const CONTENT_TYPES = require('./../public/js/constants/contentType');
const CONSTANTS = require('./../constants/mainConstants');
const AggregationHelper = require('./../helpers/aggregationCreater');
const FilterMapper = require('./../helpers/filterMapper');
const NotificationModel = require('./../types/notification/model');
const AccessManager = require('./../helpers/access')();
const bodyValidator = require('./../helpers/bodyValidator');
const ActivityLog = require('./../stories/push-notifications/activityLog');
const extractBody = require('./../utils/extractBody');
const redis = require('./../helpers/redisClient');
const errorSender = require('./../utils/errorSender');
const {
    TARGET,
    SALARY,
    OUT_OF_STOCK,
    NEW_ARRIVALS,
    ANNUAL_LEAVE,
    NEAR_EXPIRY_PRODUCTS,
    OTHER
} = require('../constants/notificationTypes');
const allowedNotificationTypes = [
    TARGET,
    SALARY,
    OUT_OF_STOCK,
    NEW_ARRIVALS,
    ANNUAL_LEAVE,
    NEAR_EXPIRY_PRODUCTS,
    OTHER
];

const ObjectId = mongoose.Types.ObjectId;

const Notifications = function () {

    const self = this;

    const fileHandler = new FileHandler();

    let $defProjection = {
        _id            : 1,
        type           : 1,
        typeDescription: 1,
        createdBy      : 1,
        recipients     : 1,
        description    : 1,
        creationDate   : 1,
        country        : 1,
        region         : 1,
        subRegion      : 1,
        branch         : 1,
        position       : 1,
        retailSegment  : 1,
        outlet         : 1,
        length         : 1,
        attachments    : 1
    };

    function redisNotifications(options, callback) {
        var currentUserId = options.currentUserId;
        var notificationObject = options.notificationObject;
        var personnelIds = [];

        if (notificationObject && notificationObject.recipients && notificationObject.recipients.length) {
            _.map(notificationObject.recipients, function (personnel) {
                if (personnel && personnel._id) {
                    personnelIds.push(personnel._id);
                }
            });
        }
        personnelIds = personnelIds.fromObjectID();

        async.each(personnelIds,
            function (id, cb) {
                var key = 'notificationCount' + '#' + id;
                var newValue = 1;

                redis.cacheStore.readFromStorage(key, function (err, value) {
                    var valueJSON;

                    if (err) {
                        return cb(err);
                    }

                    if (value && notificationObject) {
                        valueJSON = JSON.parse(value);
                        newValue = +valueJSON + 1;
                    }

                    redis.cacheStore.writeToStorage(key, JSON.stringify(newValue), '864000');

                    cb(null);
                });

            },
            function (err, result) {
                if (err) {
                    return callback(err);
                }
                var indexToDelete = personnelIds.indexOf(currentUserId);
                if (indexToDelete !== -1) {
                    personnelIds.splice(indexToDelete, 1);
                }
                return callback(null, notificationObject);
            });
    }

    function getAllPipeLine(options) {
        const withAttachments = options.withAttachments;
        const afterCreate = options.afterCreate;
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject || {};
        var isMobile = options.isMobile;
        var skip = options.skip;
        var limit = options.limit;
        var personnelId = options.personnelId;
        var pipeLine = [];
        var initialQuery = _.pick(queryObject, '$or', '_id');

        pipeLine.push({
            $match: initialQuery
        });

        if (queryObject.personnel) {
            pipeLine.push({
                $match: {
                    $or: [
                        {recipients: queryObject.personnel},
                        {'createdBy.user': queryObject.personnel}
                    ]
                }
            });
        }

        if (personnelId) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    length: {
                        $cond: {
                            if  : {$gt: [{$size: '$recipients'}, 0]},
                            then: 1,
                            else: 0
                        }
                    }
                })
            });
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            length: {$eq: 1},
                            $or   : [
                                {
                                    recipients: {$in: [personnelId]}
                                },
                                {
                                    'createdBy.user': {$in: [personnelId]}
                                }
                            ]
                        },
                        {
                            length: {$eq: 0}
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['lastName', 'firstName', 'country', 'region', 'subRegion', 'imageSrc'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: {createdBy: {date: 1}}
        }));

        if (queryObject.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        {country: queryObject.country},
                        {'createdBy.user.country': queryObject.country}
                    ]
                }
            });
        }

        if (queryObject.region) {
            pipeLine.push({
                $match: {
                    $or: [
                        {region: queryObject.region},
                        {'createdBy.user.region': queryObject.region}
                    ]
                }
            });
        }

        if (queryObject.subRegion) {
            pipeLine.push({
                $match: {
                    $or: [
                        {subRegion: queryObject.subRegion},
                        {'createdBy.user.subRegion': queryObject.subRegion}
                    ]
                }
            });
        }

        if (queryObject.branch) {
            pipeLine.push({
                $match: {
                    branch: queryObject.branch
                }
            });
        }

        if (queryObject.position) {
            pipeLine.push({
                $match: {
                    $or: [
                        {position: queryObject.position},
                        {'createdBy.user.position': queryObject.position}
                    ]
                }
            });
        }

        if (queryObject.retailSegment) {
            pipeLine.push({
                $match: {
                    retailSegment: queryObject.retailSegment
                }
            });
        }

        if (queryObject.outlet) {
            pipeLine.push({
                $match: {
                    outlet: queryObject.outlet
                }
            });
        }

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                createdBy: {
                    $first: {
                        user: {
                            _id       : '$createdBy.user._id',
                            position  : '$createdBy.user.position',
                            accessRole: '$createdBy.user.accessRole',
                            lastName  : '$createdBy.user.lastName',
                            firstName : '$createdBy.user.firstName',
                            imageSrc : '$createdBy.user.imageSrc',
                        },
                        date: '$createdBy.date'
                    }
                }
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'createdBy.user.accessRole',
            isArray        : false,
            addProjection  : ['name', 'level'],
            includeSiblings: {
                createdBy: {
                    user: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1,
                        imageSrc: 1,
                    },
                    date: 1
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'createdBy.user.position',
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    user: {
                        _id       : 1,
                        accessRole: 1,
                        firstName : 1,
                        lastName  : 1,
                        imageSrc: 1,
                    },
                    date: 1
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'recipients',
            addProjection: ['lastName', 'firstName', 'imageSrc']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key : 'position'
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

        if (afterCreate || withAttachments) {
            pipeLine.push(...aggregateHelper.aggregationPartMaker({
                from : CONTENT_TYPES.FILES,
                key : 'attachments',
                isArray: true,
                addProjection : ['_id', 'name', 'preview']
            }));
        }

        if(isMobile){
            pipeLine.push({
                $project: {
                    _id            : 1,
                    country        : 1,
                    createdBy      : 1,
                    editedBy       : 1,
                    description    : 1,
                    position       : 1,
                    recipients     : 1,
                    attachments    : 1,
                    type           : {$ifNull: ['$type', OTHER]},
                    typeDescription: {$ifNull: ['$typeDescription', '']},
                }
            });
        } else {
            //because only 6 elements shows on UI
            pipeLine.push({
                $project: {
                    _id            : 1,
                    country        : 1,
                    createdBy      : 1,
                    editedBy       : 1,
                    description    : 1,
                    position       : 1,
                    recipients     : {$slice: ['$recipients', 6]},
                    attachments    : 1,
                    type           : {$ifNull: ['$type', OTHER]},
                    typeDescription: {$ifNull: ['$typeDescription', '']},
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile    : isMobile,
            skip        : skip,
            limit       : limit,
            creationDate: true
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var filter = query.filter || {};
            var page = query.page || 1;
            var contentType = query.contentType;
            var lastLogOut = new Date(query.lastLogOut);
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var pipeLine;
            var aggregation;
            var aggregateHelper;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.NOTIFICATIONS,
                filter     : filter,
                personnel  : personnel
            });

            queryObject.context = CONTENT_TYPES.NOTIFICATIONS;

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = getAllPipeLine({
                aggregateHelper: aggregateHelper,
                queryObject    : queryObject,
                filterSearch   : filterSearch,
                isMobile       : isMobile,
                withAttachments: true,
                personnelId    : personnel._id,
                forSync        : true
            });

            aggregation = NotificationModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                if (isMobile) {
                    body.data.forEach(element => {
                        if (element.description) {
                            element.description = {
                                en: _.unescape(element.description.en),
                                ar: _.unescape(element.description.ar),
                            };
                        }
                    });

                    return next({
                        status: 200,
                        body,
                    });
                }

                body.data.forEach(element => {
                    if (element.description) {
                        element.description = {
                            en: _.unescape(element.description.en),
                            ar: _.unescape(element.description.ar),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        AccessManager.getReadAccess(req, ACL_MODULES.NOTIFICATION, function (err, allowed, personnel) {
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

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var filter = query.filter || {};
            var page = query.page || 1;
            var contentType = query.contentType;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var pipeLine;
            var aggregation;
            var aggregateHelper;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.NOTIFICATIONS,
                filter     : filter,
                personnel  : personnel
            });

            queryObject.context = CONTENT_TYPES.NOTIFICATIONS;

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine = getAllPipeLine({
                aggregateHelper: aggregateHelper,
                queryObject    : queryObject,
                filterSearch   : filterSearch,
                skip           : skip,
                limit          : limit,
                isMobile       : isMobile,
                personnelId    : personnel._id,
                withAttachments : true
            });

            aggregation = NotificationModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    if (element.description) {
                        element.description = {
                            en: _.unescape(element.description.en),
                            ar: _.unescape(element.description.ar),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        AccessManager.getReadAccess(req, ACL_MODULES.NOTIFICATION, function (err, allowed, personnel) {
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

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
            const createdBy = {
                user: ObjectId(userId),
                date: new Date(),
            };

            if (body.description) {
                body.description = {
                    en: _.unescape(body.description.en),
                    ar: _.unescape(body.description.ar),
                };
            }
            if (!body.type || !allowedNotificationTypes.includes(body.type)) {
                return errorSender.badRequest(next, 'Not valid incoming parameters: type');
            }

            if (body.type === OTHER && !body.typeDescription) {
                return errorSender.badRequest(next, 'Not valid incoming parameters: typeDescription is required');
            }

            Object.keys(body).forEach(key => {
                if (!['description', 'type', 'typeDescription'].includes(key)) {
                    const itValue = body[key];

                    if (_.isString(itValue)) {
                        const parts = itValue.split(',');
                        const compactParts = _.compact(parts);

                        body[key] = compactParts.objectID();
                    } else if (itValue === '') {
                        // glitch for props such as description which is an object
                        body[key] = [];
                    }
                }
            });

            body.createdBy = createdBy;

            async.waterfall([

                (cb) => {
                    const files = req.files;

                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.NOTIFICATIONS, cb);
                },

                (setFileId, cb) => {
                    body.attachments = setFileId;

                    const notification = new NotificationModel();

                    notification.set(body);
                    notification.save(body, (err, model) => {
                        cb(err, model);
                    });
                },

                (notification, cb) => {
                    ActivityLog.emit('notifications:sent', {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body: notification.toJSON(),
                    });

                    const aggregateHelper = new AggregationHelper($defProjection);
                    const queryObject = {
                        _id: notification._id,
                    };
                    const pipeLine = getAllPipeLine({
                        aggregateHelper,
                        queryObject,
                        afterCreate: true,
                    });

                    NotificationModel.aggregate(pipeLine)
                        .allowDiskUse(true)
                        .exec(cb);
                },

                (result, cb) => {
                    const body = _.get(result, '[0].data[0]') || {};
                    if (body.description) {
                        body.desciption = {
                            ar: _.unescape(body.description.ar),
                            en: _.unescape(body.description.en),
                        };
                    }

                    redisNotifications({
                        currentUserId: userId,
                        notificationObject: body,
                        contentType: CONTENT_TYPES.NOTIFICATIONS,
                    }, cb);
                },

                (body, cb) => {
                    if (!Object.keys(body).length) {
                        return cb(null, body);
                    }

                    if (body.description) {
                        body.description = {
                            en: _.unescape(body.description.en),
                            ar: _.unescape(body.description.ar),
                        };
                    }

                    cb(null, body);
                },

            ], (err, body) => {
                if (err) {
                    return next(err);
                }

                callback(null, {
                    status: 200,
                    body,
                });
            });
        };

        async.waterfall([

            (cb) => {
                AccessManager.getWriteAccess(req, ACL_MODULES.NOTIFICATION, cb);
            },

            (allowed, personnel, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.NOTIFICATIONS, 'create', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            next(result);
        });
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);

            async.waterfall([
                (cb) => {
                    self.getByIdAggr({
                        id
                    }, cb);
                },

                (notificationModel, cb) => {
                    getAwsLinks(notificationModel, cb);
                }
            ], (err, result) => {
                if (err) {
                    next(err);
                }

                res.status(200).send(result);
            });
        }

        AccessManager.getReadAccess(req, ACL_MODULES.NOTIFICATION, function (err, allowed) {
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

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {_id: id}
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'branch'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user.branch',
            isArray        : false,
            addProjection  : ['retailSegment', 'outlet'],
            includeSiblings: {
                createdBy: {
                    user: {
                        _id       : 1,
                        lastName  : 1,
                        firstName : 1,
                        position  : 1,
                        accessRole: 1
                    },
                    date: 1
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'createdBy.user.accessRole',
            isArray        : false,
            addProjection  : ['name', 'level'],
            includeSiblings: {
                createdBy: {
                    user: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1
                    },
                    date: 1
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'createdBy.user.position',
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    user: {
                        _id       : 1,
                        accessRole: 1,
                        firstName : 1,
                        lastName  : 1
                    },
                    date: 1
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'recipients',
            addProjection: ['lastName', 'firstName']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
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
            from: 'branches',
            key : 'branch'
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
            from: 'positions',
            key : 'position'
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

        pipeLine.push(...aggregateHelper.aggregationPartMaker({
            from : CONTENT_TYPES.FILES,
            key : 'attachments',
            isArray: true,
            addProjection : ['_id', 'name', 'originalName', 'preview']
        }));

        if (isMobile) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    creationDate: '$createdBy.date'
                })
            });
        }

        aggregation = NotificationModel.aggregate(pipeLine);

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

    this.editPersonnelNotificationCount = function (req, res, next) {
        var newValue = req.body.notificationCount;
        var id = req.session.uId;
        var key = 'notificationCount' + '#' + id;
        var result;

        redis.cacheStore.writeToStorage(key, JSON.stringify(newValue), '864000');

        result = {
            notificationCount: newValue
        };

        res.status(200).send(result);
    };
};

module.exports = Notifications;
