const ActivityLog = require('./../stories/push-notifications/activityLog');
const logger = require('./../utils/logger');

var CompetitorItem = function () {
    var mongoose = require('mongoose');
    var async = require('async');
    var _ = require('underscore');

    var CONSTANTS = require('../constants/mainConstants');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var access = require('../helpers/access')();
    var bodyValidator = require('../helpers/bodyValidator');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var CompetitorItem = require('./../types/competitorItem/model');
    var logWriter = require('../helpers/logWriter.js');
    var xssFilters = require('xss-filters');

    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(CompetitorItem);

    var AggregationHelper = require('../helpers/aggregationCreater');
    var FilterMapper = require('../helpers/filterMapper');

    var objectId = mongoose.Types.ObjectId;

    var self = this;

    var $defProjection = {
        _id        : 1,
        name       : 1,
        packing    : 1,
        origin     : 1,
        brand      : 1,
        variant    : 1,
        archived   : 1,
        topArchived: 1,
        createdBy  : 1,
        editedBy   : 1,
        product    : 1,
        category   : 1,
        country    : 1
    };

    var modelFindById = function (id, callback) {
        var query = CompetitorItem.findById(id);

        query
            .populate('origin', 'name')
            .populate('brand', 'name')
            .populate('variant', 'name')
            .populate('country', 'name')
            .exec(callback);
    };

    function getAllPipeLine(options) {
        var queryObject = options.queryObject;
        var aggregationHelper = options.aggregationHelper;
        var sort = options.sort;
        var queryObjectAfterLookup = options.queryObjectAfterLookup;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var query = options.query;
        var limit = options.limit;
        var skip = options.skip;
        var isMobile = options.isMobile;

        var pipeLine = [];

        pipeLine.push({
            $match: queryObject
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'origins',
            key : 'origin'
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'brands',
            key          : 'brand',
            isArray      : false,
            addProjection: ['imageSrc']
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

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
            $lookup: {
                from        : 'competitorVariants',
                localField  : 'variant',
                foreignField: '_id',
                as          : 'variant'
            }
        });

        pipeLine.push({
            $project: aggregationHelper.getProjection({variant: {$arrayElemAt: ['$variant', 0]}})
        });

        pipeLine.push({
            $project: aggregationHelper.getProjection({
                variant: {
                    _id : 1,
                    name: 1
                },
                product: '$variant.category'
            })
        });

        if (queryObjectAfterLookup) {
            pipeLine.push({
                $match: queryObjectAfterLookup
            });
        }

        pipeLine.push({
            $lookup: {
                from        : 'categories',
                localField  : 'product',
                foreignField: '_id',
                as          : 'product'
            }
        });

        pipeLine.push({
            $project: aggregationHelper.getProjection({product: {$arrayElemAt: ['$product', 0]}})
        });

        pipeLine.push({
            $project: aggregationHelper.getProjection({
                product: {
                    _id : 1,
                    name: 1
                }
            })
        });

        if (!isMobile) {
            pipeLine.push({
                $match: aggregationHelper.getSearchMatch(searchFieldsArray, filterSearch)
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit,
            sort             : sort
        }));

        return pipeLine;
    }

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var name = body.name;
            var createdBy = {
                user: req.session.uId,
                date: new Date()
            };
            var model;

            body.name.en = name.en ? xssFilters.inHTMLData(name.en) : '';
            body.name.ar = name.ar ? xssFilters.inHTMLData(name.ar) : '';

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            body.variant = body.competitorVariant;
            delete body.competitorVariant;

            model = new CompetitorItem(body);
            model.save(function (error, model) {
                if (error) {
                    return next(error);
                }

                ActivityLog.emit('competitor-list:item-created', {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body: model.toJSON(),
                });

                modelFindById(model._id, function (err, model) {
                    if (err) {
                        return next(err);
                    }

                    res.status(201).send(model);
                });
            });
        }

        access.getWriteAccess(req, ACL_MODULES.COMPETITOR_LIST, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMPETITORITEM, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var lastLogOut = new Date(query.lastLogOut);
            var filterMapper = new FilterMapper();
            var sort = {'createdBy.date': -1};
            var filter = query.filter || {};
            var queryObject;
            var pipeLine;
            var aggregation;
            var ids;
            var aggregationHelper;

            delete filter.globalSearch;
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.COMPETITORITEM,
                filter     : filter,
                personnel  : personnel
            });

            aggregationHelper = new AggregationHelper($defProjection, queryObject);
            delete queryObject.region;
            delete queryObject.subRegion;

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return objectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }

            aggregationHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = [
                {
                    $match: queryObject,
                },
                {
                    $match: {
                        archived: false,
                    },
                },
                {
                    $addFields: {
                        origin: {
                            $filter: {
                                input: '$origin',
                                as: 'origin',
                                cond: {
                                    $ne: ['$$origin', null],
                                },
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: 1,
                        },
                        data: {
                            $push: '$$ROOT',
                        },
                    },
                },
                {
                    $unwind: {
                        path: '$data',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: '$data._id',
                        name: '$data.name',
                        packing: '$data.packing',
                        archived: '$data.archived',
                        brand: '$data.brand',
                        variant: '$data.variant',
                        product: '$data.product',
                        origin: '$data.origin',
                        country: '$data.country',
                        total: 1,
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
                        data: 1,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: '$_id',
                        data: {
                            _id: 1,
                            name: 1,
                            packing: 1,
                            archived: 1,
                            brand: 1,
                            variant: 1,
                            product: 1,
                            origin: 1,
                            country: 1,
                        },
                    },
                },
            ];

            aggregation = CompetitorItem.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                var result;

                if (err) {
                    return next(err);
                }

                result = response && response[0] ? response[0] : {
                    data : [],
                    total: 0
                };

                // res.status(200).send(result);

                next({status: 200, body: result});
            });

        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_LIST, function (err, allowed, personnel) {
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
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var filter = query.filter || {};
            var filterSearch = filter.globalSearch && filter.globalSearch.trim() || '';
            var queryObjectAfterLookup = {};
            var queryObject;
            var key;

            var parallelTasks;


            var aggregationHelper = new AggregationHelper($defProjection);

            var sort = query.sort;
            var language = req.language;

            if (sort) {
                for (key in sort) {
                    sort[key] = parseInt(sort[key], 10);
                }
            } else if (language) {
                sort = {};
                sort['brand.name.' + language] = 1;
                sort['product.name.' + language] = 1;
                sort['variant.name.' + language] = 1;
            } else {
                sort = {
                    'brand.name'  : 1,
                    'product.name': 1,
                    'variant.name': 1
                };
            }

            delete filter.globalSearch;
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.COMPETITORITEM,
                filter     : filter,
                personnel  : personnel
            });
            delete queryObject.region;
            delete queryObject.subRegion;

            if (query.competitorVariant) {
                queryObject.variant = objectId(query.competitorVariant);
            }

            if (query.brand) {
                queryObject.brand = objectId(query.brand);
            }

            if (!queryObject.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            if (queryObject.product) {
                queryObjectAfterLookup.product = queryObject.product;
                delete queryObject.product;
            }

            var pipeLine;
            var aggregation;

            var searchFieldsArray = [
                'variant.name.en',
                'variant.name.ar',
            ];
            if (isMobile) {
                pipeLine = [
                    {
                        $match: queryObject,
                    },
                    {
                        $match: {
                            archived: false,
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
                            from: 'competitorItems',
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
                                        name: '$$root.name',
                                        packing: '$$root.packing',
                                        archived: '$$root.archived',
                                        brand: '$$root.brand',
                                        variant: '$$root.variant',
                                        product: '$$root.product',
                                        origin: '$$root.origin',
                                        country: '$$root.country',
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
                        $addFields: {
                            origin: {
                                $filter: {
                                    input: '$origin',
                                    as: 'origin',
                                    cond: {
                                        $ne: ['$$origin', null],
                                    },
                                },
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
                            data: 1,
                        },
                    },

                    {
                        $project: {
                            _id: 0,
                            total: '$_id',
                            data: {
                                _id: 1,
                                name: 1,
                                packing: 1,
                                archived: 1,
                                brand: 1,
                                variant: 1,
                                origin: 1,
                                product: 1,
                                country: 1,
                            },
                        },
                    },

                ];
            } else {
                pipeLine = self.getAllForUI({
                    queryObject      : queryObject,
                    aggregationHelper: aggregationHelper,
                    query            : query,
                    skip             : skip,
                    limit            : limit,
                    sort             : sort,
                    searchFieldsArray: searchFieldsArray,
                    filterSearch     : filterSearch
                });
            }
            aggregation = CompetitorItem.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true,
            };

            aggregation.exec((err, response) => {
                if (err) {
                    return next(err);
                }

                response = response.length ? response[0] : { data: [], total: 0 };

                next({ status: 200, body: response });
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_LIST, function (err, allowed, personnel) {
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

    this.getAllForUI = function (options) {
        var queryObject = options.queryObject;
        var aggregationHelper = options.aggregationHelper;
        const queryObjectAfterLookup = options.queryObjectAfterLookup;
        var query = options.query;
        var skip = options.skip;
        var sort = options.sort;
        var limit = options.limit;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var pipeLine = [];

        pipeLine.push({
            $project: aggregationHelper.getProjection({
                product: '$brand'
            })
        });

        pipeLine.push({
            $match: queryObject
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'origins',
            key : 'origin'
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'brands',
            key          : 'brand',
            addProjection: ['topArchived', 'archived'],
            isArray      : false
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from             : 'competitorVariants',
            key              : 'variant',
            addProjection    : ['topArchived', 'archived'],
            addMainProjection: ['category'],
            isArray          : false
        }));

        if (queryObjectAfterLookup && queryObjectAfterLookup.product && queryObjectAfterLookup.product.$in && queryObjectAfterLookup.product.$in.length) {
            pipeLine.push({
                $match: {
                    category: queryObjectAfterLookup.product,
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'categories',
            key          : 'category',
            addProjection: ['topArchived', 'archived'],
            isArray      : false
        }));

        if (filterSearch) {
            const searchMatch = {
                $or: [],
            };

            searchFieldsArray.forEach((searchField) => {
                searchMatch.$or.push({
                    [searchField]: {
                        $regex: filterSearch,
                        $options: 'i',
                    },
                });
            });

            pipeLine.push({
                $match: searchMatch,
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.setTotal());

        if (!query.variant && !query.category && !query.brand) {
            pipeLine.push({
                $sort: {
                    'brand.name'   : 1,
                    'category.name': 1,
                    'variant.name' : 1
                }
            });
        }

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

        pipeLine = self.addGroupForListView(pipeLine);

        pipeLine = _.union(pipeLine, aggregationHelper.groupForUi());


        return pipeLine;
    };

    this.addGroupForListView = function (pipeLine) {
        pipeLine.push({
            $group: {
                _id        : {
                    brand   : '$brand._id',
                    category: '$category._id',
                    variant : '$variant._id'
                },
                topArchived: {$first: '$variant.topArchived'},
                variantName: {$first: '$variant.name'},
                archived   : {$first: '$variant.archived'},
                category   : {$first: '$category'},
                brand      : {$first: '$brand'},
                total      : {$first: '$total'},
                items      : {
                    $addToSet: {
                        _id        : '$_id',
                        name       : '$name',
                        packing    : '$packing',
                        origin     : '$origin',
                        category   : '$category',
                        variant    : '$variant',
                        archived   : '$archived',
                        createdBy  : '$createdBy',
                        editedBy   : '$editedBy',
                        topArchived: '$topArchived'
                    }
                }
            }
        });

        pipeLine.push({
            $group: {
                _id         : {
                    brand   : '$brand._id',
                    category: '$category._id'
                },
                total       : {$first: '$total'},
                categoryName: {$first: '$category.name'},
                topArchived : {$first: '$category.topArchived'},
                brand       : {$first: '$brand'},
                archived    : {$first: '$category.archived'},
                variants    : {
                    $addToSet: {
                        _id        : '$_id.variant',
                        topArchived: '$topArchived',
                        variantName: '$variantName',
                        archived   : '$archived',
                        items      : '$items'
                    }
                }
            }
        });

        pipeLine.push({
            $group: {
                _id        : '$brand._id',
                total      : {$first: '$total'},
                brandName  : {$first: '$brand.name'},
                topArchived: {$first: '$brand.topArchived'},
                archived   : {$first: '$brand.archived'},
                categories : {
                    $addToSet: {
                        _id         : '$_id.category',
                        topArchived : '$topArchived',
                        categoryName: '$categoryName',
                        archived    : '$archived',
                        variants    : '$variants'
                    }
                }
            }
        });

        return pipeLine;
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;

            modelFindById(id, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_LIST, function (err, allowed) {
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
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var id = req.params.id;

            body.editedBy = {
                user: req.session.uId,
                date: Date.now()
            };

            CompetitorItem.findByIdAndUpdate(id, body, {
                new: true
            }, function (err, model) {
                if (err) {
                    return next(err);
                }

                ActivityLog.emit('competitor-list:item-updated', {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body: model.toJSON(),
                });

                modelFindById(model._id, function (err, model) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(model);
                });
            });
        }

        access.getEditAccess(req, ACL_MODULES.COMPETITOR_LIST, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMPETITORITEM, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (callback) => {
            const setIdToArchive = req.body.ids.objectID();
            const archived = req.body.archived === 'false' ? false : !!req.body.archived;
            const options = [{
                idsToArchive: setIdToArchive,
                keyForCondition: '_id',
                archived,
                topArchived: archived,
                model: CompetitorItem,
            }];
            const activityType = archived ? 'archived' : 'unarchived';

            async.waterfall([

                (cb) => {
                    archiver.archive(userId, options, cb);
                },

                (done, cb) => {
                    callback();

                    CompetitorItem.find({
                        _id: {
                            $in: setIdToArchive,
                        },
                    }).lean().exec(cb);
                },

                (setItem, cb) => {
                    async.each(setItem, (item, eachCb) => {
                        ActivityLog.emit(`competitor-list:item-${activityType}`, {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: item,
                        });
                        eachCb();
                    }, cb);
                },

            ]);
        };

        async.waterfall([

            (cb) => {
                access.getArchiveAccess(req, ACL_MODULES.COMPETITOR_LIST, cb);
            },

            (personnel, allowed, cb) => {
                queryRun(cb);
            },

        ], (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send({});
        });
    };
};

module.exports = CompetitorItem;
