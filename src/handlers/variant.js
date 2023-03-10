var Variant = function () {
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var VariantModel = require('./../types/variant/model');
    var ItemModel = require('./../types/item/model');
    var access = require('../helpers/access')();
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var xssFilters = require('xss-filters');
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(VariantModel);
    var bodyValidator = require('../helpers/bodyValidator');
    var objectId = mongoose.Types.ObjectId;
    var logWriter = require('../helpers/logWriter.js');
    var async = require('async');

    var _ = require('underscore');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');

    var $defProjection = {
        _id        : 1,
        name       : 1,
        category   : 1,
        archived   : 1,
        topArchived: 1,
        createdBy  : 1,
        editedBy   : 1
    };

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

            model = new VariantModel(body);
            model.save(function (error, model) {
                if (error) {
                    return next(error);
                }
                res.status(201).send(model);
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.VARIANT, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun() {
            var query = req.query;
            var lastLogOut = new Date(query.lastLogOut);
            var filterMapper = new FilterMapper();
            var sort = {'createdBy.date': -1};
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.VARIANT,
                filter     : query.filter || {}
            });

            var aggregateHelper = new AggregationHelper($defProjection, queryObject);
            var aggregation;
            var ids;
            var pipeLine;

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

            pipeLine = [{
                $match: queryObject
            }, {
                $sort: sort
            }];

            pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

            aggregation = VariantModel.aggregate(pipeLine);

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

    this.getAll = function (req, res, next) {
        function queryRun() {
            var isMobile = req.isMobile;
            var data = req.query || {};

            delete data.page;
            delete data.count;

            VariantModel.find(data)
                .exec(function (err, result) {
                    var response = result;

                    if (err) {
                        return next(err);
                    }

                    if (isMobile) {
                        response = {data: result};
                    }

                    // res.status(200).send(response);

                    next({status: 200, body: response});
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

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;

            VariantModel.findById(id)
                .exec(function (err, result) {
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

            VariantModel.findByIdAndUpdate(id, body, {
                new: true
            }, function (err, result) {
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.VARIANT, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var uId = req.session.uId;
            var options = [
                {
                    idsToArchive   : idsToArchive,
                    keyForCondition: '_id',
                    archived       : archived,
                    topArchived    : archived,
                    model          : VariantModel
                },
                {
                    keyForCondition: 'variant',
                    archived       : archived,
                    topArchived    : false,
                    model          : ItemModel
                }

            ];
            var editedBy = {
                user: req.session.uId,
                date: Date.now()
            };
            var type = ACTIVITY_TYPES.ARCHIVED;
            if (!archived) {
                type = ACTIVITY_TYPES.UNARCHIVED;
            }

            archiver.archive(uId, options, function (err) {
                if (err) {
                    return next(err);
                }


                async.eachSeries(idsToArchive, function (item, callback) {

                    callback();

                }, function (err) {
                    if (err) {
                        logWriter.log('brand archived', err);
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

    /*this.remove = function (req, res, next) {
     var id = req.params.id;

     Model.findByIdAndRemove(id, function (error) {
     if (error) {
     return next(error);
     }
     res.status(200).send();
     });
     };*/
};

module.exports = Variant;
