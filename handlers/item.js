'use strict';

var Item = function (db, event) {
    var async = require('async');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONSTANTS = require('../constants/mainConstants');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var modelAndSchemaName = CONTENT_TYPES.ITEM;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var access = require('../helpers/access')(db);
    var Model = db.model(modelAndSchemaName, schema);
    var _ = require('underscore');
    var bodyValidator = require('../helpers/bodyValidator');
    var logWriter = require('../helpers/logWriter.js');
    var xssFilters = require('xss-filters');
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(Model);
    var FilterMapper = require('../helpers/filterMapper');
    var objectId = mongoose.Types.ObjectId;
    var self = this;

    // var _ = require('../node_modules/underscore');
    var AggregationHelper = require('../helpers/aggregationCreater');

    var $defProjection = {
        _id          : 1,
        name         : 1,
        barCode      : 1,
        packing      : 1,
        ppt          : 1,
        pptPerCase   : 1,
        rspMin       : 1,
        rspMax       : 1,
        origin       : 1,
        currency     : 1,
        category     : 1,
        variant      : 1,
        location     : 1,
        archived     : 1,
        createdBy    : 1,
        editedBy     : 1,
        topArchived  : 1,
        product      : 1,
        outlet       : 1,
        country      : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1
    };

    var modelFindById = function (id, callback) {
        var query = Model.findOne({_id: id});

        query
            .populate('origin', 'name')
            .exec(callback);
    };

    function getAllPipeLine(options) {
        var isMobile = options.isMobile;
        var queryObject = options.queryObject;
        var aggregateHelper = options.aggregateHelper;
        var sort = options.sort;
        var pipeLine = [];

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                product: '$category'
            })
        });

        pipeLine.push({
            $match: queryObject
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}}
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
            $project: aggregateHelper.getProjection({
                ppt: {
                    $divide: ['$ppt', 100]
                }
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'origins',
            key : 'origin'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'categories',
            key          : 'category',
            addProjection: ['topArchived', 'archived'],
            isArray      : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'variants',
            key          : 'variant',
            addProjection: ['topArchived', 'archived'],
            isArray      : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'domains',
            key              : 'country',
            addMainProjection: ['currency'],
            isArray          : false
        }));

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                country: '$country._id'
            })
        });

        /*pipeLine.push({
         $sort: sort
         });

         pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

         pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile: isMobile,
            sort    : sort
        }));

        return pipeLine;
    }

    this.create = function (req, res, next) {
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

            model = new Model(body);
            model.save(function (error, model) {
                if (error) {
                    return next(error);
                }
                event.emit('activityChange', {
                    module    : ACL_MODULES.ITEMS_AND_PRICES,
                    actionType: ACTIVITY_TYPES.CREATED,
                    createdBy : createdBy,
                    itemId    : model._id,
                    itemType  : CONTENT_TYPES.ITEM
                });
                modelFindById(model._id, function (err, model) {
                    if (err) {
                        return next(err);
                    }

                    res.status(201).send(model);
                });
            });
        }

        access.getWriteAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.ITEM, 'create', function (err, saveData) {
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
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var sort = {'createdBy.date': -1};
            var filter = query.filter || {};
            var queryObject;
            var isMobile = req.isMobile;
            var pipeLine;
            var aggregation;
            var ids;

            delete filter.globalSearch;
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.ITEM,
                filter     : filter,
                personnel  : personnel
            });
            aggregateHelper = new AggregationHelper($defProjection, queryObject);
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

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = getAllPipeLine({
                queryObject    : queryObject,
                aggregateHelper: aggregateHelper,
                sort           : sort,
                isMobile       : isMobile
            });

            aggregation = Model.aggregate(pipeLine);

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
            var query = req.query || {};
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var filter = query.filter || {};
            var filterSearch = filter.globalSearch || '';
            var ifLocation = query.location;
            var isMobile = req.isMobile;
            var queryObject;
            var key;
            var options;
            var sort = query.sort || {'editedBy.date': 1};
            var searchFieldsArray = [
                'name.en',
                'name.ar',
                'barCode',
                'packing',
                'size',
                'ppt',
                'pptPerCase',
                'rspMin',
                'rspMax',
                'origin.name.ar',
                'origin.name.en',
                'variant.name.en',
                'variant.name.ar',
                'variant.archived',
                'variant.topArchived',
                'category.name.en',
                'category.name.ar'
            ];
            var aggregationHelper;

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            delete query.location;
            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.ITEM,
                filter     : filter,
                personnel  : personnel
            });
            aggregationHelper = new AggregationHelper($defProjection, queryObject);

            delete queryObject.region;
            delete queryObject.subRegion;

            if (query.variant) {
                queryObject.variant = objectId(query.variant);
            }

            if (query.category) {
                queryObject.category = objectId(query.category);
            }

            if (!queryObject.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            if (queryObject.retailSegment) {
                queryObject['location.retailSegment'] = queryObject.retailSegment;
                delete queryObject.retailSegment;
            }

            if (queryObject.outlet) {
                queryObject['location.outlet'] = queryObject.outlet;
                delete queryObject.outlet;
            }

            if (ifLocation || req.isMobile) {
                options = {
                    queryObject      : queryObject,
                    aggregationHelper: aggregationHelper,
                    query            : query,
                    res              : res,
                    next             : next,
                    skip             : skip,
                    limit            : limit,
                    isMobile         : isMobile
                };
                self.getAllIfLocation(options);
            } else {
                options = {
                    queryObject      : queryObject,
                    aggregationHelper: aggregationHelper,
                    query            : query,
                    res              : res,
                    next             : next,
                    skip             : skip,
                    limit            : limit,
                    sort             : sort,
                    searchFieldsArray: searchFieldsArray,
                    filterSearch     : filterSearch,
                    isMobile         : isMobile
                };
                self.getAllWithoutLocation(options);
            }
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

    this.getAllIfLocation = function (options) {
        var queryObject = options.queryObject;
        var aggregationHelper = options.aggregationHelper;
        var query = options.query;
        var res = options.res;
        var next = options.next;
        var skip = options.skip;
        var limit = options.limit;
        var pipeLine = [];
        var parallelTasks;

        if (query.forDd && query.countryId && query.retailSegment) {
            return this.getForDd(queryObject, query, res, next);
        }

        delete queryObject.archived;

        parallelTasks = {
            getLocationItems: function (callback) {
                Model
                    .find({
                        archived: false,
                        location: {
                            $elemMatch: {
                                country      : queryObject.country,
                                outlet       : queryObject['location.outlet'],
                                retailSegment: queryObject['location.retailSegment']
                            }
                        }
                    }, {_id: 1})
                    .lean(true)
                    .exec(function (err, result) {
                        if (err) {
                            return callback(err);
                        }

                        callback(null, result);
                    });
            },

            getAllItems: function (parallelCb) {
                var $matchObject = {
                    archived: false
                };

                if (queryObject && queryObject.country) {
                    $matchObject.country = queryObject.country;
                }

                pipeLine.push({
                    $match: $matchObject
                });

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'origins',
                    key : 'origin'
                }));

                pipeLine.push({
                    $project: aggregationHelper.getProjection({
                        ppt: {
                            $divide: ['$ppt', 100]
                        },
                        pptPerCase: {
                            $divide: ['$pptPerCase', 100]
                        },
                        rspMin: {
                            $divide: ['$rspMin', 100]
                        },
                        rspMax: {
                            $divide: ['$rspMax', 100]
                        }
                    })
                });

                if (!query.variant && !query.category) {
                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'categories',
                        key          : 'category',
                        addProjection: ['topArchived', 'archived'],
                        isArray      : false
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'variants',
                        key          : 'variant',
                        addProjection: ['topArchived', 'archived'],
                        isArray      : false
                    }));

                    pipeLine.push({
                        $sort: {
                            'category.name': 1,
                            'variant.name' : 1
                        }
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from             : 'domains',
                    key              : 'country',
                    addMainProjection: ['currency'],
                    isArray          : false
                }));

                pipeLine.push({
                    $project: aggregationHelper.getProjection({
                        country: '$country._id'
                    })
                });

                if (limit && limit !== -1) {
                    pipeLine.push({
                        $skip: skip
                    });

                    pipeLine.push({
                        $limit: limit
                    });
                }

                Model.aggregate(pipeLine, function (err, result) {
                    if (err) {
                        return parallelCb(err);
                    }

                    parallelCb(null, result);
                });
            }
        };

        async.parallel(parallelTasks, function (err, results) {
            var allItems;
            var locationItems;
            var id;
            if (err) {
                return next(err);
            }

            allItems = results.getAllItems;
            locationItems = _.pluck(results.getLocationItems, '_id');
            locationItems = locationItems.fromObjectID();

            allItems = _.map(allItems, function (element) {
                id = element._id.toString();
                element.exists = locationItems.indexOf(id) !== -1;

                return element;
            });

            next({status: 200, body: {data: allItems, total: allItems.length}});
        });
    };

    this.getAllWithoutLocation = function (options) {
        var queryObject = options.queryObject;
        var aggregationHelper = options.aggregationHelper;
        var query = options.query;
        var res = options.res;
        var next = options.next;
        var skip = options.skip;
        var sort = options.sort;
        var limit = options.limit;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var pipeLine = [];
        var parallelTasks;

        if (query.forDd && query.countryId && query.retailSegment) {
            return this.getForDd(queryObject, query, res, next);
        }

        parallelTasks = {
            data: function (parallelCb) {

                pipeLine.push({
                    $project: aggregationHelper.getProjection({
                        product: '$category'
                    })
                });

                pipeLine.push({
                    $match: queryObject
                });

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'origins',
                    key : 'origin'
                }));

                pipeLine.push({
                    $project: aggregationHelper.getProjection({
                        ppt: {
                            $divide: ['$ppt', 100]
                        },
                        pptPerCase: {
                            $divide: ['$pptPerCase', 100]
                        },
                        rspMin: {
                            $divide: ['$rspMin', 100]
                        },
                        rspMax: {
                            $divide: ['$rspMax', 100]
                        }
                    })
                });

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from             : 'domains',
                    key              : 'country',
                    addMainProjection: ['currency'],
                    isArray          : false
                }));

                if (!query.variant && !query.category && !filterSearch) {

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'categories',
                        key          : 'category',
                        addProjection: ['topArchived', 'archived'],
                        isArray      : false
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'variants',
                        key          : 'variant',
                        addProjection: ['topArchived', 'archived'],
                        isArray      : false
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.setTotal());

                    pipeLine.push({
                        $sort: {
                            'category.name': 1,
                            'variant.name' : 1
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

                    pipeLine = self.addGroupForListView(pipeLine);

                    pipeLine = _.union(pipeLine, aggregationHelper.groupForUi());

                } else if (filterSearch) {
                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'categories',
                        key          : 'category',
                        addProjection: ['topArchived', 'archived'],
                        isArray      : false
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'variants',
                        key          : 'variant',
                        addProjection: ['topArchived', 'archived'],
                        isArray      : false
                    }));

                    pipeLine.push({
                        $project: aggregationHelper.getProjection({
                            ppt: {$substr: ['$ppt', 0, -1]} // ppt to string
                        })
                    });

                    pipeLine.push({
                        $match: aggregationHelper.getSearchMatch(searchFieldsArray, filterSearch)
                    });

                    pipeLine = _.union(pipeLine, aggregationHelper.setTotal());

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

                }

                Model.aggregate(pipeLine, function (err, result) {
                    if (err) {
                        return parallelCb(err);
                    }

                    if (!query.variant && !query.category) {
                        parallelCb(null, result ? result[0] : null);
                    } else {
                        parallelCb(null, result || null);
                    }
                });
            }
        };

        async.parallel(parallelTasks, function (err, response) {
            if (err) {
                return next(err);
            }

            response = response && response.data ? response.data : {data: [], total: 0};

            next({status: 200, body: response});
        });
    };

    this.groupForFilter = function (pipeLine) {
        pipeLine.push({
            $unwind: {
                path                      : '$location',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $group: {
                _id          : '$_id',
                variant      : {$first: '$variant'},
                category     : {$first: '$category'},
                origin       : {$first: '$origin'},
                name         : {$addToSet: '$name'},
                barCode      : {$addToSet: '$barCode'},
                packing      : {$addToSet: '$packing'},
                ppt          : {$addToSet: '$ppt'},
                createdBy    : {$addToSet: '$createdBy'},
                editedBy     : {$addToSet: '$editedBy'},
                archived     : {$addToSet: '$archived'},
                topArchived  : {$addToSet: '$topArchived'},
                outlet       : {$push: '$location.outlet'},
                country      : {$push: '$location.country'},
                region       : {$push: '$location.region'},
                subRegion    : {$push: '$location.subRegion'},
                retailSegment: {$push: '$location.retailSegment'}
            }
        });

        pipeLine.push({
            $project: {
                name         : {
                    $arrayElemAt: ['$name', 0]
                },
                barCode      : {
                    $arrayElemAt: ['$barCode', 0]
                },
                packing      : {
                    $arrayElemAt: ['$packing', 0]
                },
                ppt          : {
                    $arrayElemAt: ['$ppt', 0]
                },
                createdBy    : {
                    $arrayElemAt: ['$createdBy', 0]
                },
                editedBy     : {
                    $arrayElemAt: ['$editedBy', 0]
                },
                topArchived  : {
                    $arrayElemAt: ['$topArchived', 0]
                },
                archived     : {
                    $arrayElemAt: ['$archived', 0]
                },
                variant      : 1,
                category     : 1,
                origin       : 1,
                outlet       : 1,
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1
            }
        });

        return pipeLine;
    };

    this.getForDd = function (queryObject, query, res, next) {
        queryObject = {};
        queryObject.country = objectId(query.countryId);
        queryObject.retailSegment = objectId(query.retailSegment);

        Model
            .find({
                'archived': false,
                'location': {$elemMatch: queryObject}
            }, {_id: 1, category: 1, name: 1})
            .populate('category', '_id, name')
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                result = _.uniq(_.pluck(result, 'category'));

                // res.status(200).send({data: result, total: result.length});

                next({status: 200, body: {data: result, total: result.length}});
            });
    };

    this.addGroupForListView = function (pipeLine) {
        pipeLine.push({
            $group: {
                _id        : '$variant._id',
                topArchived: {$first: '$variant.topArchived'},
                variantName: {$first: '$variant.name'},
                archived   : {$first: '$variant.archived'},
                category   : {$first: '$category'},
                total      : {$first: '$total'},
                items      : {
                    $addToSet: {
                        _id        : '$_id',
                        name       : '$name',
                        barCode    : '$barCode',
                        currency   : '$currency',
                        packing    : '$packing',
                        ppt        : '$ppt',
                        pptPerCase : '$pptPerCase',
                        rspMin     : '$rspMin',
                        rspMax     : '$rspMax',
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
                _id         : '$category._id',
                total       : {$first: '$total'},
                categoryName: {$first: '$category.name'},
                topArchived : {$first: '$category.topArchived'},
                archived    : {$first: '$category.archived'},
                variants    : {
                    $addToSet: {
                        _id        : '$_id',
                        topArchived: '$topArchived',
                        variantName: '$variantName',
                        archived   : '$archived',
                        items      : '$items'
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

        access.getReadAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed) {
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

            body.editedBy = {
                user: req.session.uId,
                date: Date.now()
            };

            Model.update({_id: id}, {$set: body}, function (err) {
                if (err) {
                    return next(err);
                }

                event.emit('activityChange', {
                    module    : 10,
                    actionType: ACTIVITY_TYPES.UPDATED,
                    createdBy : body.editedBy,
                    itemId    : id,
                    itemType  : CONTENT_TYPES.ITEM
                });

                modelFindById(id, function (err, model) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(model);
                });
            });
        }

        access.getEditAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.ITEM, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.updateLocation = function (req, res, next) {
        function queryRun() {
            var body = req.body;
            var location = body.location;
            var ids = body.ids;
            var editedBy = {
                user: objectId(req.session.uId),
                date: new Date()
            };

            async.waterfall([
                function (cb) {
                    Model.update({_id: {$in: ids}}, {
                        $addToSet: {location: location},
                        $set     : {editedBy: editedBy}
                    }, {multi: true}, function (err, result) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, result);
                    });
                },
                function (result, cb) {
                    Model.update({_id: {$nin: ids}}, {$pull: {location: location}}, {multi: true}, function (err, result) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, result);
                    });
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send();
            });
        }

        access.getEditAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed) {
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

    this.archive = function (req, res, next) {
        function queryRun() {
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var editedBy = {
                user: req.session.uId,
                date: Date.now()
            };
            var uId = req.session.uId;
            var type = ACTIVITY_TYPES.ARCHIVED;
            var options = [
                {
                    idsToArchive   : idsToArchive,
                    keyForCondition: '_id',
                    archived       : archived,
                    topArchived    : archived,
                    model          : Model
                }
            ];

            if (!archived) {
                type = ACTIVITY_TYPES.UNARCHIVED;
            }

            archiver.archive(uId, options, function (err) {
                if (err) {
                    return next(err);
                }
                async.eachSeries(idsToArchive, function (item, callback) {
                    event.emit('activityChange', {
                        module    : ACL_MODULES.ITEMS_AND_PRICES,
                        actionType: type,
                        createdBy : editedBy,
                        itemId    : item,
                        itemType  : CONTENT_TYPES.ITEM
                    });
                    callback();

                }, function (err) {
                    if (err) {
                        logWriter.log('items archived', err);
                    }
                });

                res.status(200).send();
            });
        }

        access.getArchiveAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed) {
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

};

module.exports = Item;
