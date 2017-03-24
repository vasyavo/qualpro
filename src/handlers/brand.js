const BranchHandler = function () {
    const async = require('async');
    const mongoose = require('mongoose');
    const _ = require('underscore');
    const AggregationHelper = require('../helpers/aggregationCreater');
    const ACL_MODULES = require('../constants/aclModulesNames');
    const CONTENT_TYPES = require('../public/js/constants/contentType.js');
    const CONSTANTS = require('../constants/mainConstants');
    const ACTIVITY_TYPES = require('../constants/activityTypes');
    const access = require('../helpers/access')();
    const BrandModel = require('./../types/brand/model');
    const CompetitorItemModel = require('./../types/competitorItem/model');
    const CompetitorVariantModel = require('./../types/competitorVariant/model');
    const xssFilters = require('xss-filters');
    const FilterMapper = require('../helpers/filterMapper');
    const Archiver = require('../helpers/archiver');
    const archiver = new Archiver(BrandModel);
    const bodyValidator = require('../helpers/bodyValidator');
    const logWriter = require('../helpers/logWriter.js');
    const PreviewModel = require('./../stories/preview/model.business');

    const ObjectId = mongoose.Types.ObjectId;

    const $defProjection = {
        _id: 1,
        ID: 1,
        editedBy: 1,
        createdBy: 1,
        archived: 1,
        name: 1,
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            const name = body.name;
            const createdBy = {
                user: req.session.uId,
                date: new Date(),
            };

            const imageSrc = body.imageSrc;

            delete body.imageSrc;

            body.name.en = name.en ? _.escape(name.en) : '';
            body.name.ar = name.ar ? _.escape(name.ar) : '';
            body.createdBy = createdBy;
            body.editedBy = createdBy;

            const model = new BrandModel(body);

            async.waterfall([
                (cb) => {
                    model.save(cb);
                },
                (model, count, cb) => {
                    PreviewModel.setNewPreview({
                        model,
                        base64: imageSrc,
                        contentType: CONTENT_TYPES.BRAND,
                    }, cb);
                },
            ], (err, model) => {
                if (err) {
                    return next(err);
                }

                res.status(201).send(model);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.COMPETITOR_LIST, (err, allowed) => {
            const body = req.body;

            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BRAND, 'create', (err, saveData) => {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            const uId = req.session.uId;
            const idsToArchive = req.body.ids.objectID();
            const archived = req.body.archived === 'false' ? false : !!req.body.archived;
            let type = ACTIVITY_TYPES.ARCHIVED;
            const editedBy = {
                user: req.session.uId,
                date: Date.now(),
            };
            const options = [
                {
                    idsToArchive,
                    keyForCondition: '_id',
                    archived,
                    topArchived: archived,
                    model: BrandModel,
                },
                {
                    keyForCondition: 'brand',
                    archived,
                    topArchived: false,
                    keyForSelection: 'variant',
                    model: CompetitorItemModel,
                },
                {
                    keyForCondition: '_id',
                    archived,
                    topArchived: false,
                    model: CompetitorVariantModel,
                },
            ];

            if (!archived) {
                type = ACTIVITY_TYPES.UNARCHIVED;
            }
            archiver.archive(uId, options, (err) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send();
            });
        }

        access.getArchiveAccess(req, ACL_MODULES.COMPETITOR_LIST, (err, allowed) => {
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
            const id = req.params.id;

            BrandModel.findById(id)
                .exec((err, result) => {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_LIST, (err, allowed) => {
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
            const query = req.query;

            query['name.en'] = {
                $ne: 'Alalali',
            };

            BrandModel.find(query, '_id name').exec((err, result) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_LIST, (err, allowed) => {
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
            const query = req.query;
            const lastLogOut = new Date(query.lastLogOut);
            const filterMapper = new FilterMapper();
            const sort = { 'createdBy.date': -1 };
            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.BRAND,
                filter: query.filter || {},
            });

            const aggregateHelper = new AggregationHelper($defProjection, queryObject);
            let aggregation;
            let ids;
            let pipeLine;

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, (id) => {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids,
                };
            }

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = [
                {
                    $match: queryObject,
                },
                {
                    $sort: sort,
                },
            ];

            pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

            aggregation = BrandModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true,
            };

            aggregation.exec((err, response) => {
                let result;

                if (err) {
                    return next(err);
                }

                result = response && response[0] ? response[0] : {
                    data: [],
                    total: 0,
                };

                next({ status: 200, body: result });
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_LIST, (err, allowed) => {
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
            const query = req.query;
            const page = query.page || 1;
            const limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
            const skip = (page - 1) * limit;
            const filterMapper = new FilterMapper();
            const queryObject = query.filter ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.BRAND,
                filter: query.filter || {},
                personnel,
            }) : {};
            let parallelTasks;

            if (!queryObject.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            if (!req.isMobile) {
                queryObject['name.en'] = {
                    $ne: 'Al alali',
                };
            }

            parallelTasks = {
                total: BrandModel.count.bind(BrandModel, queryObject),
                data (parallelCb) {
                    const query = BrandModel.find(queryObject);

                    if (limit && limit !== -1) {
                        query
                            .skip(skip)
                            .limit(limit);
                    }

                    // .populate('createdBy.user', 'firstName lastName')
                    query.exec(parallelCb);
                },
            };

            async.parallel(parallelTasks, (err, response) => {
                if (err) {
                    return next(err);
                }

                // res.status(200).send(response);

                next({ status: 200, body: response });
            });
        }

        access.getReadAccess(req, ACL_MODULES.COMPETITOR_LIST, (err, allowed, personnel) => {
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
            const id = req.params.id;
            const name = body.name;

            const imageSrc = body.imageSrc;

            delete body.imageSrc;

            if (name) {
                body.name.en = name.en ? xssFilters.inHTMLData(name.en) : '';
                body.name.ar = name.ar ? xssFilters.inHTMLData(name.ar) : '';
            }

            body.editedBy = {
                user: req.session.uId,
                date: Date.now(),
            };

            async.waterfall([
                (cb) => {
                    BrandModel.findByIdAndUpdate(id, body, { new: true }).exec(cb);
                },
                (model, cb) => {
                    PreviewModel.setNewPreview({
                        model,
                        base64: imageSrc,
                        contentType: CONTENT_TYPES.BRAND,
                    }, cb);
                },
            ], (err, model) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(model);
            });
        }

        access.getEditAccess(req, ACL_MODULES.ITEMS_AND_PRICES, (err, allowed) => {
            const body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BRAND, 'update', (err, saveData) => {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };
};

module.exports = BranchHandler;
