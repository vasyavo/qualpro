'use strict';
const ActivityLog = require('./../stories/push-notifications/activityLog');

var BranchHandler = function () {
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var VALIDATION = require('../public/js/constants/validation.js');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var BranchModel = require('./../types/branch/model');
    var DomainModel = require('./../types/domain/model');
    var FilterMapper = require('../helpers/filterMapper');
    var Archiver = require('../helpers/archiver');
    var access = require('../helpers/access')();
    var archiver = new Archiver(BranchModel);
    var populateByType = require('../helpers/populateByType');
    var PersonnelModel = require('./../types/personnel/model');
    var SessionModel = require('./../types/session/model');
    var bodyValidator = require('../helpers/bodyValidator');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var SomeEvents = require('../helpers/someEvents');
    var someEvents = new SomeEvents();

    var ObjectId = mongoose.Types.ObjectId;

    var $defProjection = {
        _id          : 1,
        ID           : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        editedBy     : 1,
        createdBy    : 1,
        linkToMap    : 1,
        address      : 1,
        manager      : 1,
        archived     : 1,
        name         : 1,
        topArchived  : 1,
        creationDate : 1,
        updateDate   : 1,
        imageSrc     : 1,
    };

    this.getLocation = function (req, res, next) {
        var countryId = req.query.countryId;
        var retailSegmentId = req.query.retailSegmentId;
        var error;

        if (!countryId) {
            error = new Error('Country is required param');
            error.status = 400;

            return next(error);
        }

        if (!VALIDATION.OBJECT_ID.test(countryId)) {
            error = new Error('Invalid parameter countryId');
            error.status = 400;
            return next(error);
        }

        if (retailSegmentId) {
            if (!VALIDATION.OBJECT_ID.test(retailSegmentId)) {
                error = new Error('Invalid parameter retailSegmentId');
                error.status = 400;
                return next(error);
            }
        }

        async.waterfall([
            function (waterfallCb) {
                var pipeLine = [];

                pipeLine.push({
                    $match: {
                        parent  : ObjectId(countryId),
                        archived: false
                    }
                });

                pipeLine.push({
                    $group: {
                        _id    : null,
                        regions: {$addToSet: '$_id'}
                    }
                });

                DomainModel.aggregate(pipeLine).exec(function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    result = result[0] && result[0].regions || [];

                    waterfallCb(null, result);
                });
            },
            function (regionsIds, waterfallCb) {
                var pipeLine = [];

                pipeLine.push({
                    $match: {
                        parent  : {$in: regionsIds},
                        archived: false
                    }
                });

                pipeLine.push({
                    $lookup: {
                        from        : 'branches',
                        localField  : '_id',
                        foreignField: 'subRegion',
                        as          : 'branch'
                    }
                });

                pipeLine.push({
                    $unwind: {
                        path                      : '$branch',
                        preserveNullAndEmptyArrays: true
                    }
                });

                pipeLine.push({
                    $match: {
                        'branch.archived': false
                    }
                });

                if (retailSegmentId) {
                    pipeLine.push({
                        $match: {
                            'branch.retailSegment': {
                                $in: [ObjectId(retailSegmentId)]
                            }
                        }
                    });
                }

                pipeLine.push({
                    $lookup: {
                        from        : 'retailSegments',
                        localField  : 'branch.retailSegment',
                        foreignField: '_id',
                        as          : 'retailSegment'
                    }
                });

                pipeLine.push({
                    $lookup: {
                        from        : 'outlets',
                        localField  : 'branch.outlet',
                        foreignField: '_id',
                        as          : 'outlet'
                    }
                });

                pipeLine.push({
                    $project: {
                        retailSegment: {$arrayElemAt: ['$retailSegment', 0]},
                        outlet       : {$arrayElemAt: ['$outlet', 0]}
                    }
                });

                pipeLine.push({
                    $group: {
                        _id           : null,
                        retailSegments: {$addToSet: '$retailSegment'},
                        outlets       : {$addToSet: '$outlet'}
                    }
                });

                pipeLine.push({
                    $project: {
                        retailSegment: {
                            $filter: {
                                input: '$retailSegments',
                                as   : 'retailSegment',
                                cond : {$eq: ['$$retailSegment.archived', false]}
                            }
                        },
                        outlet       : {
                            $filter: {
                                input: '$outlets',
                                as   : 'outlet',
                                cond : {$eq: ['$$outlet.archived', false]}
                            }
                        }
                    }
                });

                DomainModel.aggregate(pipeLine).exec(function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    waterfallCb(null, result[0]);
                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var model;
            var createdBy = {
                user: req.session.uId,
                date: new Date()
            };

            if (!body.subRegion || !body.retailSegment || !body.outlet) {
                return res.status(400).send('Validation error');
            }

            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : ''
                };
            }
            if (body.address) {
                body.address = {
                    en: body.address.en ? _.escape(body.address.en) : '',
                    ar: body.address.ar ? _.escape(body.address.ar) : ''
                };
            }
            if (body.linkToMap) {
                body.linkToMap = body.linkToMap ? _.escape(body.linkToMap) : '';
            }

            body.subRegion = ObjectId(body.subRegion);
            body.retailSegment = ObjectId(body.retailSegment);
            body.outlet = ObjectId(body.outlet);

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            model = new BranchModel(body);
            model.save(function (err, result) {
                if (err) {
                    return next(err);
                }

                ActivityLog.emit('branch:created', {
                    actionOriginator: req.session.uId,
                    accessRoleLevel : req.session.level,
                    body            : result.toJSON()
                });

                BranchModel.findById(result._id)
                    .populate('createdBy.user', 'firstName lastName')
                    .populate('manager', 'phoneNumber email firstName lastName fullName')
                    .populate('subRegion', 'name')
                    .populate('retailSegment', 'name')
                    .populate('outlet', 'name').exec(
                    function (err, result) {
                        if (err) {
                            return next(err);
                        }
                        if (result) {
                            if (result.name) {
                                result.name = {
                                    en: result.name.en ? _.unescape(result.name.en) : '',
                                    ar: result.name.ar ? _.unescape(result.name.ar) : ''
                                };
                            }
                            if (result.address) {
                                result.address = {
                                    en: result.address.en ? _.unescape(result.address.en) : '',
                                    ar: result.address.ar ? _.unescape(result.address.ar) : ''
                                };
                            }
                            if (result.linkToMap) {
                                result.linkToMap = result.linkToMap ? _.unescape(result.linkToMap) : '';
                            }
                        }

                        res.status(201).send(result);
                    }
                );
            });
        }

        access.getWriteAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BRANCH, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            var uId = req.session.uId;
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var options = [
                {
                    idsToArchive   : idsToArchive,
                    keyForCondition: '_id',
                    topArchived    : archived,
                    archived       : archived,
                    model          : BranchModel
                }
            ];
            req.body.editedBy = {
                user: req.session.uId,
                date: Date.now()
            };
            archiver.archive(uId, options, function (err) {
                var type = ACTIVITY_TYPES.UNARCHIVED;
                if (err) {
                    return next(err);
                }

                if (archived) {
                    type = ACTIVITY_TYPES.ARCHIVED;

                    someEvents.locationArchived({
                        id       : idsToArchive,
                        type     : CONTENT_TYPES.BRANCH,
                        Personnel: PersonnelModel,
                        Session  : SessionModel,
                        Branch   : BranchModel
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }

                        async.each(idsToArchive, (id, eCb)=> {
                            BranchModel.findById(id)
                                .lean()
                                .exec((err, resp)=> {
                                    if (err) {
                                        return eCb(err)
                                    }

                                    const bodyObject = {
                                        actionOriginator: req.session.uId,
                                        accessRoleLevel : req.session.level,
                                        body            : resp
                                    };

                                    ActivityLog.emit('branch:archived', bodyObject);

                                    eCb();

                                })
                        }, (err)=> {
                            if (err) {
                                return next(err);
                            }
                            res.status(200).send();
                        });
                    });
                } else {
                    idsToArchive.forEach(function (id) {

                    });

                    res.status(200).send();
                }

            });
        }

        access.getArchiveAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
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

            BranchModel.findById(id)
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    if (result && result.name) {
                        result.name = {
                            en: result.name.en ? _.unescape(result.name.en) : '',
                            ar: result.name.ar ? _.unescape(result.name.ar) : ''
                        };
                        result.address = {
                            en: result.address.en ? _.unescape(result.address.en) : '',
                            ar: result.address.ar ? _.unescape(result.address.ar) : ''
                        };
                        result.linkToMap = result.linkToMap ? _.unescape(result.linkToMap) : '';
                    }

                    res.status(200).send(result);
                });
        }

        access.getReadAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
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

    function getAllPipeLine(options) {
        var isMobile = options.isMobile;
        var queryObject = options.queryObject;
        var aggregateHelper = options.aggregateHelper;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var sort = options.sort;
        var skip = options.skip;
        var limit = options.limit;
        var pipeLine = [];
        var pipeObject;

        if (!isMobile) {
            pipeLine.push({
                $match: queryObject
            });
        } else {
            pipeLine.push({
                $match: _.omit(queryObject, 'country', 'region', 'subRegion')
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'subRegion',
            isArray      : false,
            addProjection: ['_id', 'name', 'parent']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'domains',
            key            : 'subRegion.parent',
            isArray        : false,
            addProjection  : ['parent'],
            includeSiblings: {
                subRegion: {
                    _id : 1,
                    name: 1
                }
            }
        }));

        if (!isMobile) {
            pipeLine.push({
                $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
            });
        } else {
            if (queryObject.country) {
                pipeLine.push({
                    $match: {
                        'subRegion.parent.parent': queryObject.country
                    }
                });
            }
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? ['position', 'accessRole'] : []),
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'editedBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? ['position', 'accessRole'] : []),
            includeSiblings: {editedBy: {date: 1}}
        }));

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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'manager',
            isArray      : false,
            addProjection: ['_id', 'firstName', 'lastName', 'phoneNumber', 'email', 'imageSrc']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'retailSegment',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'outlet',
            isArray: false
        }));

        pipeObject = {
            $project: aggregateHelper.getProjection({
                createdBy    : 1,
                editedBy     : 1,
                manager      : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                imageSrc     : 1,
            })
        };

        pipeLine.push(pipeObject);

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit,
            creationDate     : true,
            sort             : sort
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var filter = query.filter;
            var filterMapper = new FilterMapper();
            var sort = {'createdBy.date': -1};
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.BRANCH,
                filter     : filter,
                personnel  : personnel
            });
            var aggregateHelper = new AggregationHelper($defProjection, queryObject);
            var lastLogOut = new Date(query.lastLogOut);
            var aggregation;
            var pipeLine;
            var ids;

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

            if (isMobile) {
                pipeLine = [
                    {
                        $match: queryObject
                    },
                    {
                        $sort: {
                            'editedBy.date': 1,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            root: { $push: '$_id' },
                            total: { $sum: 1 },
                        },
                    },
                    {
                        $unwind: '$root',
                    },
                    {
                        $lookup: {
                            from: 'branches',
                            localField: 'root',
                            foreignField: '_id',
                            as: '_id',
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
                                    in: {
                                        _id: '$$root._id',
                                        subRegion: '$$root.subRegion',
                                        retailSegment: '$$root.retailSegment',
                                        outlet: '$$root.outlet',
                                        address: '$$root.address',
                                        archived: '$$root.archived',
                                        name: '$$root.name',
                                        manager: '$$root.manager',
                                        total: '$total',
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
                        $lookup: {
                            from: 'personnels',
                            localField: 'manager',
                            foreignField: '_id',
                            as: 'manager',
                        },
                    },
                    {
                        $addFields: {
                            manager: {
                                $let: {
                                    vars: {
                                        manager: {
                                            $arrayElemAt: [
                                                '$manager',
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        _id: '$$manager._id',
                                        name: '$$manager.name',
                                        firstName: '$$manager.firstName',
                                        lastName: '$$manager.lastName',
                                        phoneNumber: '$$manager.phoneNumber',
                                        email: '$$manager.email',
                                        imageSrc: '$$manager.imageSrc',
                                    },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            manager: {
                                $cond: [
                                    { $eq: ['$manager', {}] },
                                    null,
                                    '$manager',
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: '$total',
                            data: {
                                $push: '$$ROOT',
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            total: '$_id',
                            data: {
                                _id: 1,
                                subRegion: 1,
                                retailSegment: 1,
                                outlet: 1,
                                address: 1,
                                archived: 1,
                                name: 1,
                                manger: 1,
                            },
                        },
                    },
                ];
            } else {
                pipeLine = getAllPipeLine({
                    isMobile       : isMobile,
                    queryObject    : queryObject,
                    sort           : sort,
                    aggregateHelper: aggregateHelper
                });
            }

            aggregation = BranchModel.aggregate(pipeLine);

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
                    if (element.name) {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en),
                        };
                    }

                    if (element.address) {
                        element.address = {
                            en: element.address.en ? _.unescape(element.address.en) : '',
                            ar: element.address.ar ? _.unescape(element.address.ar) : '',
                        };
                    }

                    if (element.linkToMap) {
                        element.linkToMap = element.linkToMap ? _.unescape(element.linkToMap) : '';
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed, personnel) {
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
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';

            delete filter.globalSearch;

            var queryObject = !isMobile ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.BRANCH,
                filter     : filter,
                context    : CONTENT_TYPES.BRANCH,
                personnel  : personnel
            }) :
                filterMapper.mapFilter({
                    contentType: CONTENT_TYPES.BRANCH,
                    filter     : filter,
                    personnel  : personnel
                });

            if (isMobile) {
                delete queryObject.region;
                delete queryObject.subRegion;
                delete queryObject.branch;
            }

            var pipeLine;
            var key;
            var aggregation;
            var sort = query.sort || {
                    'editedBy.date': 1
                };

            var searchFieldsArray = [
                'name.en',
                'name.ar'
            ];
            var aggregateHelper = new AggregationHelper($defProjection, queryObject);

            var searchObject = aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch);

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            if (!queryObject.hasOwnProperty('archived') && !isMobile) {
                queryObject.archived = false;
            }

            queryObject = _.extend({}, searchObject, queryObject);

            if (isMobile) {
                pipeLine = [
                    {
                        $lookup: {
                            from: 'domains',
                            localField: 'subRegion',
                            foreignField: '_id',
                            as: 'subRegion',
                        },
                    },
                    {
                        $addFields: {
                            subRegion: {
                                $let: {
                                    vars: {
                                        subRegion: {
                                            $arrayElemAt: [
                                                '$subRegion',
                                                0,
                                            ],
                                        },
                                    },
                                    in  : {
                                        _id: '$$subRegion._id',
                                        parent: '$$subRegion.parent',
                                    },
                                },
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'domains',
                            localField: 'subRegion.parent',
                            foreignField: '_id',
                            as: 'subRegion.parent',
                        },
                    },
                    {
                        $addFields: {
                            country: {
                                $let: {
                                    vars: {
                                        country: {
                                            $arrayElemAt: [
                                                '$subRegion.parent',
                                                0,
                                            ],
                                        },
                                    },
                                    in  : '$$country.parent',
                                },
                            }
                        }
                    },
                    {
                        $match: queryObject,
                    },
                    {
                        $sort: {
                            'editedBy.date': 1,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            root: { $push: '$_id' },
                            total: { $sum: 1 },
                        },
                    },
                    {
                        $unwind: '$root',
                    },
                    {
                        $skip: skip,
                    },
                    {
                        $limit: limit,
                    },
                    {
                        $lookup: {
                            from: 'branches',
                            localField: 'root',
                            foreignField: '_id',
                            as: '_id',
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
                                    in: {
                                        _id: '$$root._id',
                                        subRegion: '$$root.subRegion',
                                        retailSegment: '$$root.retailSegment',
                                        outlet: '$$root.outlet',
                                        address: '$$root.address',
                                        archived: '$$root.archived',
                                        name: '$$root.name',
                                        manager: '$$root.manager',
                                        total: '$total',
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
                        $lookup: {
                            from: 'personnels',
                            localField: 'manager',
                            foreignField: '_id',
                            as: 'manager',
                        },
                    },
                    {
                        $addFields: {
                            manager: {
                                $let: {
                                    vars: {
                                        manager: {
                                            $arrayElemAt: [
                                                '$manager',
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        _id: '$$manager._id',
                                        name: '$$manager.name',
                                        firstName: '$$manager.firstName',
                                        lastName: '$$manager.lastName',
                                        phoneNumber: '$$manager.phoneNumber',
                                        email: '$$manager.email',
                                        imageSrc: '$$manager.imageSrc',
                                    },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            manager: {
                                $cond: [
                                    { $eq: ['$manager', {}] },
                                    null,
                                    '$manager',
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: '$total',
                            data: {
                                $push: '$$ROOT',
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            total: '$_id',
                            data: {
                                _id: 1,
                                subRegion: 1,
                                retailSegment: 1,
                                outlet: 1,
                                address: 1,
                                archived: 1,
                                name: 1,
                                manger: 1,
                            },
                        },
                    },
                ];
            } else {
                pipeLine = getAllPipeLine({
                    isMobile         : isMobile,
                    queryObject      : queryObject,
                    aggregateHelper  : aggregateHelper,
                    searchFieldsArray: searchFieldsArray,
                    filterSearch     : filterSearch,
                    sort             : sort,
                    skip             : skip,
                    limit            : limit
                });
            }

            aggregation = BranchModel.aggregate(pipeLine);

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
                    if (element.name) {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en),
                        };
                    }

                    if (element.address) {
                        element.address = {
                            en: element.address.en ? _.unescape(element.address.en) : '',
                            ar: element.address.ar ? _.unescape(element.address.ar) : '',
                        };
                    }

                    if (element.linkToMap) {
                        element.linkToMap = element.linkToMap ? _.unescape(element.linkToMap) : '';
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed, personnel) {
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

    this.update = function (req, res, next) {
        function queryRun(body) {
            var id = req.params.id;

            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : ''
                }
            }
            if (body.address) {
                body.address = {
                    en: body.address.en ? _.escape(body.address.en) : '',
                    ar: body.address.ar ? _.escape(body.address.ar) : ''
                }
            }
            if (body.linkToMap) {
                body.linkToMap = body.linkToMap ? _.escape(body.linkToMap) : ''
            }

            body.editedBy = {
                user: req.session.uId,
                date: new Date()
            };

            BranchModel.findByIdAndUpdate(id, body, {new: true})
                .populate('createdBy.user', 'firstName lastName')
                .populate('manager', 'phoneNumber email firstName lastName fullName')
                .populate('subRegion', 'name')
                .populate('retailSegment', 'name')
                .populate('outlet', 'name')
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    ActivityLog.emit('branch:updated', {
                        actionOriginator: req.session.uId,
                        accessRoleLevel : req.session.level,
                        body            : {
                            _id: result._id,
                            subRegion: result.subRegion._id,
                            name: result.name
                        },
                    });

                    if (result) {
                        if (result.name) {
                            result.name = {
                                en: result.name.en ? _.unescape(result.name.en) : '',
                                ar: result.name.ar ? _.unescape(result.name.ar) : ''
                            };
                        }
                        if (result.address) {
                            result.address = {
                                en: result.address.en ? _.unescape(result.address.en) : '',
                                ar: result.address.ar ? _.unescape(result.address.ar) : ''
                            };
                        }
                        if (result.linkToMap) {
                            result.linkToMap = result.linkToMap ? _.unescape(result.linkToMap) : '';
                        }
                    }

                    res.status(200).send(result);
                });
        }

        access.getEditAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            access.getWriteAccess(req, ACL_MODULES.CUSTOMER, function (err, allowed) {
                var body = req.body;

                if (err) {
                    return next(err);
                }
                if (!allowed) {
                    err = new Error();
                    err.status = 403;

                    return next(err);
                }

                bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BRANCH, 'update', function (err, saveData) {
                    if (err) {
                        return next(err);
                    }

                    queryRun(saveData);
                });
            });
        });
    };
};

module.exports = BranchHandler;