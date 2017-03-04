var BranchHandler = function () {
    var async = require('async');
    var mongoose = require('mongoose');
    var _ = require('underscore');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var access = require('../helpers/access')();
    var BrandModel = require('./../types/brand/model');
    var CompetitorItemModel = require('./../types/competitorItem/model');
    var CompetitorVariantModel = require('./../types/competitorVariant/model');
    var xssFilters = require('xss-filters');
    var FilterMapper = require('../helpers/filterMapper');
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(BrandModel);
    var bodyValidator = require('../helpers/bodyValidator');
    var logWriter = require('../helpers/logWriter.js');
    var ObjectId = mongoose.Types.ObjectId;

    var $defProjection = {
        _id      : 1,
        ID       : 1,
        editedBy : 1,
        createdBy: 1,
        archived : 1,
        name     : 1
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var model;
            var name = body.name;
            var createdBy = {
                user: req.session.uId,
                date: new Date()
            };

            body.name.en = name.en ? _.escape(name.en) : '';
            body.name.ar = name.ar ? _.escape(name.ar) : '';
            body.createdBy = createdBy;
            body.editedBy = createdBy;

            model = new BrandModel(body);
            model.save(function (error, model) {
                if (error) {
                    return next(error);
                }

                res.status(201).send(model);

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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BRAND, 'create', function (err, saveData) {
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
            var type = ACTIVITY_TYPES.ARCHIVED;
            var editedBy = {
                user: req.session.uId,
                date: Date.now()
            };
            var options = [
                {
                    idsToArchive   : idsToArchive,
                    keyForCondition: '_id',
                    archived       : archived,
                    topArchived    : archived,
                    model          : BrandModel
                },
                {
                    keyForCondition: 'brand',
                    archived       : archived,
                    topArchived    : false,
                    keyForSelection: 'variant',
                    model          : CompetitorItemModel
                },
                {
                    keyForCondition: '_id',
                    archived       : archived,
                    topArchived    : false,
                    model          : CompetitorVariantModel
                }
            ];

            if (!archived) {
                type = ACTIVITY_TYPES.UNARCHIVED;
            }
            archiver.archive(uId, options, function (err) {
                if (err) {
                    return next(err);
                }

                res.status(200).send();
            });
        }

        access.getArchiveAccess(req, ACL_MODULES.COMPETITOR_LIST, function (err, allowed) {
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

            BrandModel.findById(id)
                .exec(function (err, result) {
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

    this.getForDD = function (req, res, next) {
        function queryRun() {
            var query = req.query;

            query['name.en'] = {
                $ne: 'Alalali'
            };

            BrandModel.find(query, '_id name').exec(function (err, result) {
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

    this.getAllForSync = function (req, res, next) {
        function queryRun() {
            var query = req.query;
            var lastLogOut = new Date(query.lastLogOut);
            var filterMapper = new FilterMapper();
            var sort = {'createdBy.date': -1};
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.BRAND,
                filter     : query.filter || {}
            });

            var aggregateHelper = new AggregationHelper($defProjection, queryObject);
            var aggregation;
            var ids;
            var pipeLine;

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

            pipeLine = [
                {
                    $match: queryObject
                },
                {
                    $sort: sort
                }
            ];

            pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

            aggregation = BrandModel.aggregate(pipeLine);

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

                next({status: 200, body: result});
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

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var page = query.page || 1;
            var limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var queryObject = query.filter ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.BRAND,
                filter     : query.filter || {},
                personnel  : personnel
            }) : {};
            var parallelTasks;

            if (!queryObject.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            if (!req.isMobile) {
                queryObject['name.en'] = {
                    $ne: 'Al alali'
                };
            }

            parallelTasks = {
                total: BrandModel.count.bind(BrandModel, queryObject),
                data : function (parallelCb) {
                    var query = BrandModel.find(queryObject);

                    if (limit && limit !== -1) {
                        query
                            .skip(skip)
                            .limit(limit)
                    }

                    //.populate('createdBy.user', 'firstName lastName')
                    query.exec(parallelCb);
                }
            };

            async.parallel(parallelTasks, function (err, response) {
                if (err) {
                    return next(err);
                }

                // res.status(200).send(response);

                next({status: 200, body: response});
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

    this.update = function (req, res, next) {
        function queryRun(body) {
            var id = req.params.id;
            var name = body.name;

            if (name) {
                body.name.en = name.en ? xssFilters.inHTMLData(name.en) : '';
                body.name.ar = name.ar ? xssFilters.inHTMLData(name.ar) : '';
            }

            body.editedBy = {
                user: req.session.uId,
                date: Date.now()
            };

            BrandModel.findByIdAndUpdate(id, body, {new: true})
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BRAND, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    }

};

module.exports = BranchHandler;