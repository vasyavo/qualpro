const ActivityLog = require('./../stories/push-notifications/activityLog');
const extractBody = require('./../utils/extractBody');
const ReportUtils = require('./../stories/test-utils').ReportUtils;
const aclRolesNames = require('./../constants/aclRolesNames');
const moment = require('moment');

var Promotions = function () {
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler();
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var VALIDATION = require('../public/js/constants/validation.js');
    var CONSTANTS = require('../constants/mainConstants');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    var PromotionModel = require('./../types/promotion/model');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')();
    var bodyValidator = require('../helpers/bodyValidator');

    var self = this;

    var $defProjection = {
        _id          : 1,
        promotionType: 1,
        category     : 1,
        country      : 1,
        currency     : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        branch       : 1,
        displayType  : 1,
        barcode      : 1,
        packing      : 1,
        ppt          : 1,
        quantity     : 1,
        dateStart    : 1,
        dateEnd      : 1,
        attachments  : 1,
        status       : 1,
        createdBy    : 1,
        editedBy     : 1
    };

    function getAllPipeline(options) {
        var personnel = options.personnel;
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var accessRoleLevel = options.accessRoleLevel;
        var pipeLine = [];
        var allowedAccessRoles = [
            aclRolesNames.TRADE_MARKETER,
            aclRolesNames.MASTER_ADMIN,
        ];

        if (isMobile) {
            if (forSync) {
                queryObject.status = {
                    $ne: 'draft',
                };
            } else {
                queryObject.status = {
                    $nin: ['draft', 'expired'],
                };
            }
        } else {
            const $match = {
                $or: [],
            };

            if (allowedAccessRoles.includes(accessRoleLevel)) {
                $match.$or.push({
                    'createdBy.user': personnel._id,
                    status          : {
                        $in: ['draft', 'expired'],
                    },
                }, {
                    status: {
                        $ne: 'draft',
                    },
                });
            } else {
                $match.$or.push({
                    'createdBy.user': personnel._id,
                    status          : {
                        $in: ['draft', 'expired'],
                    },
                }, {
                    status: {
                        $nin: ['draft', 'expired'],
                    },
                });
            }

            pipeLine.push({$match});
        }

        if (Object.keys(queryObject).length) {
            pipeLine.push({
                $match: queryObject,
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy', 'preview']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'domains',
            key              : 'country',
            isArray          : false,
            addMainProjection: ['currency']
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
            isArray: true
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {createdBy: {date: 1}}
        }));

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
                        imageSrc : 1,
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
                        imageSrc  : 1,
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
                            imageSrc : 1,
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
                            imageSrc  : 1,
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

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const isMobile = req.isMobile;

        const queryRun = (body, callback) => {
            const files = req.files;

            Object.keys(body).forEach((key) => {
                if (_.indexOf(['region', 'subRegion', 'retailSegment', 'outlet', 'branch'], key) !== -1) {
                    if (typeof body[key] === 'string') {
                        const setStringId = body[key].split(',');

                        body[key] = setStringId.objectID();
                    } else if (_.indexOf(['category', 'country'], key) !== -1) {
                        body[key] = ObjectId(body[key]);
                    }
                }
            });

            const uploadFiles = (options, cb) => {
                const {
                    files,
                    body,
                    userId,
                } = options;

                if (!files) {
                    return cb(null, {
                        filesIds: [],
                        body,
                        userId,
                    });
                }

                fileHandler.uploadFile(userId, files, 'promotions', (err, filesIds) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, {
                        filesIds,
                        body,
                        userId,
                    });
                });
            };

            const createPromotion = (options, cb) => {
                const {
                    filesIds,
                    body,
                    userId,
                } = options;
                const createdBy = {
                    user: ObjectId(userId),
                    date: new Date(),
                };

                body.attachments = filesIds;
                body.createdBy = createdBy;
                body.editedBy = createdBy;
                body.status = body.savePromotion ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;
                body.promotionType = {
                    en: _.escape(body.promotionType.en),
                    ar: _.escape(body.promotionType.ar),
                };
                body.displayType = body.displayType.split(',');
                body.dateStart = moment(body.dateStart);
                body.dateStart = body.dateStart.utc().add(4, 'h').startOf('day').toDate();
                body.dateEnd = moment(body.dateEnd);
                body.dateEnd = body.dateEnd.utc().endOf('day').toDate();
                const model = new PromotionModel();

                model.set(body);
                model.save((err, report) => {
                    if (err) {
                        return cb(err);
                    }
                    const modelAsJson = report.toJSON();
                    const eventPayload = {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body            : modelAsJson,
                    };

                    if (modelAsJson.status === PROMOTION_STATUSES.DRAFT) {
                        ActivityLog.emit('reporting:al-alali-promo-evaluation:draft-created', eventPayload);
                    }

                    if (modelAsJson.status === PROMOTION_STATUSES.ACTIVE) {
                        ActivityLog.emit('reporting:al-alali-promo-evaluation:published', eventPayload);
                    }

                    cb(null, report);
                });
            };

            const aggregateReport = (report, cb) => {
                const id = report.get('_id');

                self.getByIdAggr({
                    id,
                    isMobile,
                }, cb);
            };

            async.waterfall([

                async.apply(uploadFiles, {
                    files,
                    body,
                    userId,
                }),
                createPromotion,
                aggregateReport,

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.AL_ALALI_PROMO_EVALUATION, cb);
            },

            (allowed, personnel, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.PROMOTIONS, 'create', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(result);
        });
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
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
                contentType: CONTENT_TYPES.PROMOTIONS,
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

            queryObject.status = {
                $nin: ['draft', 'expired'],
            };
            pipeLine = [
                {
                    $match: queryObject,
                },
                {
                    $group: {
                        _id  : null,
                        root : {$push: '$_id'},
                        total: {$sum: 1},
                    },
                },
                {
                    $unwind: '$root',
                },
                {
                    $lookup: {
                        from        : 'promotions',
                        localField  : 'root',
                        foreignField: '_id',
                        as          : '_id',
                    },
                },
                {
                    $addFields: {
                        _id: {
                            $let: {
                                vars: {
                                    root: {
                                        $arrayElemAt: [
                                            '$_id',
                                            0,
                                        ],
                                    },
                                },
                                in  : {
                                    _id          : '$$root._id',
                                    promotionType: '$$root.promotionType',
                                    category     : '$$root.category',
                                    country      : '$$root.country',
                                    region       : '$$root.region',
                                    subRegion    : '$$root.subRegion',
                                    retailSegment: '$$root.retailSegment',
                                    outlet       : '$$root.outlet',
                                    branch       : '$$root.branch',
                                    displayType  : '$$root.displayType',
                                    barcode      : '$$root.barcode',
                                    packing      : '$$root.packing',
                                    ppt          : '$$root.ppt',
                                    quantity     : '$$root.quantity',
                                    dateStart    : '$$root.dateStart',
                                    dateEnd      : '$$root.dateEnd',
                                    attachments  : '$$root.attachments',
                                    rsp          : '$$root.rsp',
                                    currency     : '$$root.currency',
                                    status       : '$$root.status',
                                    total        : '$total',
                                },
                            },
                        },
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: '$_id',
                    },
                },
                {
                    $addFields: {
                        region   : {
                            $filter: {
                                input: '$region',
                                as   : 'item',
                                cond : {
                                    $or: [
                                        {$in: ['$$item', []]},
                                        {$in: ['$$item', queryObject.region && queryObject.region.$in ? queryObject.region.$in : []]},
                                    ]
                                },
                            }
                        },
                        subRegion: {
                            $filter: {
                                input: '$subRegion',
                                as   : 'item',
                                cond : {
                                    $or: [
                                        {$in: ['$$item', []]},
                                        {$in: ['$$item', queryObject.subRegion && queryObject.subRegion.$in ? queryObject.subRegion.$in : []]},
                                    ]
                                },
                            }
                        },
                    },
                },
                {
                    $lookup: {
                        from        : 'files',
                        localField  : 'attachments',
                        foreignField: '_id',
                        as          : 'attachments',
                    },
                },
                {
                    $addFields: {
                        attachments: {
                            $map: {
                                input: '$attachments',
                                as   : 'attachment',
                                in   : {
                                    _id         : '$$attachment._id',
                                    name        : '$$attachment.name',
                                    contentType : '$$attachment.contentType',
                                    originalName: '$$attachment.originalName',
                                    extension   : '$$attachment.extension',
                                    preview     : '$$attachment.preview',
                                },
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id : '$total',
                        data: {
                            $push: '$$ROOT',
                        },
                    },
                }];

            aggregation = PromotionModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ?
                    result[0] : {data: [], total: 0};

                body.data.forEach(element => {
                    if (element.promotionType) {
                        element.promotionType = {
                            ar: _.unescape(element.promotionType.ar),
                            en: _.unescape(element.promotionType.en),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.REPORTING, function (err, allowed, personnel) {
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
            var filter = query.filter || {};
            var isMobile = req.isMobile;
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
            var accessRoleLevel = req.session.level;

            var searchFieldsArray = [
                'promotionType.en',
                'promotionType.ar',
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
                'category.name.en',
                'category.name.ar',
                'displayType.name.en',
                'displayType.name.ar',
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'createdBy.user.accessRole.name.en',
                'createdBy.user.accessRole.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar',
                'currency'
            ];

            delete filter.globalSearch;

            queryObject = filterMapper
                .mapFilter({
                    contentType: CONTENT_TYPES.PROMOTIONS,
                    filter     : filter,
                    personnel  : personnel
                });

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

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

            if (!isMobile) {
                pipeLine = getAllPipeline({
                    personnel        : personnel,
                    aggregateHelper  : aggregateHelper,
                    queryObject      : queryObject,
                    positionFilter   : positionFilter,
                    isMobile         : req.isMobile,
                    searchFieldsArray: searchFieldsArray,
                    filterSearch     : filterSearch,
                    skip             : skip,
                    limit            : limit,
                    accessRoleLevel  : accessRoleLevel,
                });
            } else {
                queryObject.status = {
                    $nin: ['draft', 'expired'],
                };
                pipeLine = [
                    {
                        $match: queryObject,
                    },
                    {
                        $group: {
                            _id  : null,
                            root : {$push: '$_id'},
                            total: {$sum: 1},
                        },
                    },
                    {
                        $unwind: '$root',
                    },
                    {
                        $skip: skip,
                    }, {
                        $limit: limit,
                    },
                    {
                        $lookup: {
                            from        : 'promotions',
                            localField  : 'root',
                            foreignField: '_id',
                            as          : '_id',
                        },
                    },
                    {
                        $addFields: {
                            _id: {
                                $let: {
                                    vars: {
                                        root: {
                                            $arrayElemAt: [
                                                '$_id',
                                                0,
                                            ],
                                        },
                                    },
                                    in  : {
                                        _id          : '$$root._id',
                                        promotionType: '$$root.promotionType',
                                        category     : '$$root.category',
                                        country      : '$$root.country',
                                        region       : '$$root.region',
                                        subRegion    : '$$root.subRegion',
                                        retailSegment: '$$root.retailSegment',
                                        outlet       : '$$root.outlet',
                                        branch       : '$$root.branch',
                                        displayType  : '$$root.displayType',
                                        barcode      : '$$root.barcode',
                                        packing      : '$$root.packing',
                                        ppt          : '$$root.ppt',
                                        quantity     : '$$root.quantity',
                                        dateStart    : '$$root.dateStart',
                                        dateEnd      : '$$root.dateEnd',
                                        attachments  : '$$root.attachments',
                                        rsp          : '$$root.rsp',
                                        currency     : '$$root.currency',
                                        status       : '$$root.status',
                                        total        : '$total',
                                    },
                                },
                            },
                        },
                    },
                    {
                        $replaceRoot: {
                            newRoot: '$_id',
                        },
                    },
                    {
                        $addFields: {
                            region   : {
                                $filter: {
                                    input: '$region',
                                    as   : 'item',
                                    cond : {
                                        $or: [
                                            {$in: ['$$item', []]},
                                            {$in: ['$$item', queryObject.region && queryObject.region.$in ? queryObject.region.$in : []]},
                                        ]
                                    },
                                }
                            },
                            subRegion: {
                                $filter: {
                                    input: '$subRegion',
                                    as   : 'item',
                                    cond : {
                                        $or: [
                                            {$in: ['$$item', []]},
                                            {$in: ['$$item', queryObject.subRegion && queryObject.subRegion.$in ? queryObject.subRegion.$in : []]},
                                        ]
                                    },
                                }
                            },
                        },
                    },
                    {
                        $lookup: {
                            from        : 'files',
                            localField  : 'attachments',
                            foreignField: '_id',
                            as          : 'attachments',
                        },
                    },
                    {
                        $addFields: {
                            attachments: {
                                $map: {
                                    input: '$attachments',
                                    as   : 'attachment',
                                    in   : {
                                        _id         : '$$attachment._id',
                                        name        : '$$attachment.name',
                                        contentType : '$$attachment.contentType',
                                        originalName: '$$attachment.originalName',
                                        extension   : '$$attachment.extension',
                                        preview     : '$$attachment.preview',
                                    },
                                },
                            },
                        },
                    },
                    {
                        $group: {
                            _id : '$total',
                            data: {
                                $push: '$$ROOT',
                            },
                        },
                    },
                ];
            }

            aggregation = PromotionModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, response) => {
                if (err) {
                    return next(err);
                }

                const body = response.length ? response[0] : {data: [], total: 0};

                body.data.forEach(element => {
                    if (element.promotionType) {
                        element.promotionType = {
                            ar: _.unescape(element.promotionType.ar),
                            en: _.unescape(element.promotionType.en),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.REPORTING, function (err, allowed, personnel) {
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

    this.update = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const isMobile = req.isMobile;
        const promotionId = req.params.id;
        const files = req.files;
        const filesPresence = Object.keys(files).length;
        const store = new ReportUtils({
            actionOriginator: userId,
            accessRoleLevel,
            reportType      : 'al-alali-promo-evaluation',
        });

        const update = (options, callback) => {
            const {
                updateObject,
            } = options;
            const setBeforeAttachmentsId = [];
            const fullUpdate = {
                $set: updateObject,
            };

            async.waterfall([

                (cb) => {
                    PromotionModel.findOne({_id: promotionId}).lean().exec(cb);
                },

                (report, cb) => {
                    if (!report) {
                        const error = new Error('Promotion not found');

                        error.status = 400;
                        return cb(error);
                    }

                    store.setPreviousState(report);

                    updateObject.editedBy = {
                        user: ObjectId(userId),
                        date: new Date(),
                    };

                    if (updateObject.displayType) {
                        updateObject.displayType = updateObject.displayType.split(',');
                    }
                    if (updateObject.quantity) {
                        updateObject.quantity = _.escape(updateObject.quantity);
                    }
                    if (updateObject.barcode) {
                        updateObject.barcode = _.escape(updateObject.barcode);
                    }
                    if (updateObject.packing) {
                        updateObject.packing = _.escape(updateObject.packing);
                    }
                    if (updateObject.ppt) {
                        updateObject.ppt = _.escape(updateObject.ppt);
                    }
                    if (updateObject.outlet) {
                        updateObject.outlet = updateObject.outlet.split(',');
                    }
                    if (updateObject.region) {
                        updateObject.region = updateObject.region.split(',');
                    }
                    if (updateObject.subRegion) {
                        updateObject.subRegion = updateObject.subRegion.split(',');
                    }
                    if (updateObject.retailSegment) {
                        updateObject.retailSegment = updateObject.retailSegment.split(',');
                    }
                    if (updateObject.branch) {
                        updateObject.branch = updateObject.branch.split(',');
                    }

                    if (updateObject.dateStart) {
                        updateObject.dateStart = moment(updateObject.dateStart);
                        updateObject.dateStart = updateObject.dateStart.utc().add(4, 'h').startOf('day').toDate();
                    }

                    if (updateObject.dateEnd) {
                        updateObject.dateEnd = moment(updateObject.dateEnd);
                        updateObject.dateEnd = updateObject.dateEnd.utc().endOf('day').toDate();
                    }

                    // map ObjectId[] to String[]
                    const setFileId = options.setFileId
                        .filter(id => id)
                        .map(id => id.toString());

                    // union both String[]
                    updateObject.attachments = _.union(setFileId, updateObject.attachments);

                    cb(null, report);
                },

                (report, cb) => {
                    // attachments before state is String[]
                    setBeforeAttachmentsId.push(...report.attachments.fromObjectID());

                    updateObject.status = updateObject.savePromotion ? PROMOTION_STATUSES.DRAFT : PROMOTION_STATUSES.ACTIVE;

                    if (updateObject.promotionType) {
                        if (updateObject.promotionType.en) {
                            updateObject.promotionType.en = _.escape(updateObject.promotionType.en);
                        }
                        if (updateObject.promotionType.ar) {
                            updateObject.promotionType.ar = _.escape(updateObject.promotionType.ar);
                        }
                    }

                    fullUpdate.$addToSet = {
                        attachments: {
                            $each: updateObject.attachments.objectID(),
                        },
                    };
                    delete updateObject.attachments;

                    cb();
                },

                (cb) => {
                    PromotionModel.findByIdAndUpdate(promotionId, fullUpdate, {new: true}, cb);
                },

                (report, cb) => {
                    store.setNextState(report.toJSON());

                    // attachments after state is String[]
                    const setAfterAttachmentsId = report.attachments.fromObjectID();
                    const deletedAttachments = _.difference(setBeforeAttachmentsId, setAfterAttachmentsId);

                    fileHandler.deleteFew(deletedAttachments, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb();
                    });
                },

            ], callback);
        };

        const queryRun = (updateObject, callback) => {
            async.waterfall([

                (cb) => {
                    if (!filesPresence) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.PROMOTIONS, cb);
                },

                (setFileId, cb) => {
                    update({
                        updateObject,
                        setFileId,
                    }, cb);
                },

                (cb) => {
                    self.getByIdAggr({
                        id: ObjectId(promotionId),
                        isMobile,
                    }, cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getEditAccess(req, ACL_MODULES.REPORTING, cb);
            },

            (allowed, personnel, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.PROMOTIONS, 'update', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            store.difference();
            store.publish();

            res.status(200).send(result);
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

        access.getReadAccess(req, ACL_MODULES.REPORTING, function (err, allowed) {
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
            addProjection: ['contentType', 'originalName', 'createdBy', 'preview']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            isArray: false
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
            isArray: true
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
                            imageSrc : 1,
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
                            imageSrc  : 1,
                        }
                    }
                }
            }));
        }

        aggregation = PromotionModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec((err, result) => {
            if (err) {
                return callback(err);
            }

            const body = result.length ? result[0] : {};

            if (body.promotionType) {
                body.promotionType = {
                    ar: _.unescape(body.promotionType.ar),
                    en: _.unescape(body.promotionType.en),
                };
            }

            callback(null, body);
        });
    };
};

module.exports = Promotions;
