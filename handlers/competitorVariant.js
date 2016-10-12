var Variant = function (db, redis, event) {
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var modelAndSchemaName = CONTENT_TYPES.COMPETITORVARIANT;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);
    var CompetitorItemModel = db.model(CONTENT_TYPES.COMPETITORITEM, mongoose.Schemas[CONTENT_TYPES.COMPETITORITEM]);
    var access = require('../helpers/access')(db);
    var bodyValidator = require('../helpers/bodyValidator');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var xssFilters = require('xss-filters');
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(Model);
    var logWriter = require('../helpers/logWriter.js');
    var async = require('async');

    var objectId = mongoose.Types.ObjectId;
    var _ = require('underscore');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');

    var $defProjection = {
        _id      : 1,
        name     : 1,
        category : 1,
        archived : 1,
        createdBy: 1,
        editedBy : 1
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

            model = new Model(body);
            model.save(function (error, model) {
                if (error) {
                    return next(error);
                }
                event.emit('activityChange', {
                    module    : 12,
                    actionType: ACTIVITY_TYPES.CREATED,
                    createdBy : createdBy,
                    itemId    : model._id,
                    itemType  : CONTENT_TYPES.COMPETITORVARIANT
                });
                res.status(201).send(model);
            });
        }
        access.getWriteAccess(req, 12, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMPETITORVARIANT, 'create', function (err, saveData) {
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
                contentType: CONTENT_TYPES.COMPETITORVARIANT,
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

        access.getReadAccess(req, 12, function (err, allowed) {
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

            Model.find(data)
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

        access.getReadAccess(req, 12, function (err, allowed) {
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

            Model.findById(id)
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                });
        }
        access.getReadAccess(req, 12, function (err, allowed) {
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

            Model.findByIdAndUpdate(id, body, {
                new: true
            }, function (err, result) {
                if (err) {
                    return next(err);
                }

                event.emit('activityChange', {
                    module    : 12,
                    actionType: ACTIVITY_TYPES.UPDATED,
                    createdBy : body.editedBy,
                    itemId    : id,
                    itemType  : CONTENT_TYPES.COMPETITORVARIANT
                });

                res.status(200).send(result);
            });
        }

        access.getEditAccess(req, 12, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.COMPETITORVARIANT, 'update', function (err, saveData) {
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
            var editedBy = {
                user: req.session.uId,
                date: Date.now()
            };
            var type = ACTIVITY_TYPES.ARCHIVED;

            var options = [
                {
                    idsToArchive   : idsToArchive,
                    keyForCondition: '_id',
                    archived       : archived,
                    topArchived    : archived,
                    model          : Model
                },
                {
                    keyForCondition: 'variant',
                    archived       : archived,
                    topArchived    : false,
                    model          : CompetitorItemModel
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
                        module    : 12,
                        actionType: type,
                        createdBy : editedBy,
                        itemId    : item,
                        itemType  : CONTENT_TYPES.COMPETITORVARIANT
                    });
                    callback();

                }, function (err) {
                    if (err) {
                        logWriter.log('variant archived', err);
                    }
                });



                res.status(200).send();
            });
        }
        access.getArchiveAccess(req, 12, function (err, allowed) {
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

module.exports = Variant;
