const ActivityLog = require('./../stories/push-notifications/activityLog');
const BranchCollection = require('./../types/branch/collection');
const OutletCollection = require('./../types/outlet/collection');

const OutletHandler = function () {
    const async = require('async');
    const mongoose = require('mongoose');
    const _ = require('lodash');
    const ACL_MODULES = require('../constants/aclModulesNames');
    const CONTENT_TYPES = require('../public/js/constants/contentType.js');
    const CONSTANTS = require('../constants/mainConstants');
    const AggregationHelper = require('../helpers/aggregationCreater');
    const ACTIVITY_TYPES = require('../constants/activityTypes');
    const OutletModel = require('./../types/outlet/model');
    const DomainModel = require('./../types/domain/model');
    const PreviewModel = require('./../stories/preview/model.business');
    const FilterMapper = require('../helpers/filterMapper');
    const Archiver = require('../helpers/archiver');
    const access = require('../helpers/access')();
    const archiver = new Archiver(OutletModel);
    const BranchModel = require('./../types/branch/model');
    const PersonnelModel = require('./../types/personnel/model');
    const SessionModel = require('./../types/session/model');
    const bodyValidator = require('../helpers/bodyValidator');
    const SomeEvents = require('../helpers/someEvents');
    const someEvents = new SomeEvents();
    const logWriter = require('../helpers/logWriter.js');
    const ObjectId = mongoose.Types.ObjectId;
    const $defProjection = {
        _id: 1,
        name: 1,
        archived: 1,
        subRegions: 1,
        retailSegments: 1,
        createdBy: 1,
        editedBy: 1,
        topArchived: 1,
        translated: 1,
        imageSrc: 1,
    };
    const self = this;

    this.getSubRegionsByCountryOrRegion = function (filter, type, cb) {
        if (filter[type] || filter.subRegions) {
            return cb(null, null);
        }
        const ids = [];
        const pipeLineInWaterfall = [];
        let aggregation;

        if (filter.country) {
            filter.parent = filter.country;
            delete filter.country;
        }
        if (filter.region) {
            filter.parent = filter.region;
            delete filter.region;
        }

        pipeLineInWaterfall.push({
            $match: filter,
        });

        if (!filter[type] && !filter.subRegions && !filter.country && !filter.region) {
            return cb(null, []);
        }

        aggregation = DomainModel.aggregate(pipeLineInWaterfall);
        aggregation.options = {
            allowDiskUse: true,
        };
        aggregation.exec((err, result) => {
            if (err) {
                return cb(err);
            }

            _.map(result, (model) => {
                ids.push(model._id);
            });
            cb(null, ids);
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            const createdBy = {
                user: req.session.uId,
                date: new Date(),
            };

            const imageSrc = body.imageSrc;

            delete body.imageSrc;

            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : '',
                };
            }

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            const model = new OutletModel(body);

            async.waterfall([
                (cb) => {
                    model.save(cb);
                },
                (model, count, cb) => {
                    ActivityLog.emit('customer:created', {
                        actionOriginator: req.session.uId,
                        accessRoleLevel: req.session.level,
                        body: model.toJSON(),
                    });

                    PreviewModel.setNewPreview({
                        model,
                        base64: imageSrc,
                        contentType: CONTENT_TYPES.OUTLET,
                    }, cb);
                },
            ], (err, model) => {
                if (err) {
                    return next(err);
                }

                if (model && model.name) {
                    model.name = {
                        en: model.name.en ? _.unescape(model.name.en) : '',
                        ar: model.name.ar ? _.unescape(model.name.ar) : '',
                    };
                }

                res.status(201).send(model);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.CUSTOMER, (err, allowed) => {
            const body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.OUTLET, 'create', (err, saveData) => {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            const filter = req.body.filter || {};
            const idsToArchive = req.body.ids.objectID();
            const archived = req.body.archived === 'false' ? false : !!req.body.archived;
            let branches = true;
            const uId = req.session.uId;
            const options = [
                {
                    idsToArchive,
                    keyForCondition: '_id',
                    topArchived: archived,
                    archived,
                    model: OutletModel,
                },
            ];
            let branchesOption;
            let type = ACTIVITY_TYPES.ARCHIVED;
            const editedBy = {
                user: req.session.uId,
                date: new Date(),
            };
            if (!archived) {
                type = ACTIVITY_TYPES.UNARCHIVED;
            }
            if (filter.subRegions) {
                delete options[0].topArchived;
                delete options[0].archived;
            }

            if (req.body.branches) {
                branches = req.body.branches === 'false' ? false : !!req.body.branches;
            }

            if (branches) {
                branchesOption = {
                    keyForCondition: 'outlet',
                    archived,
                    model: OutletModel,
                };

                if (filter.subRegions) {
                    branchesOption.topArchived = archived;
                }

                options.push(branchesOption);
            }

            archiver.archive(uId, options, (err) => {
                if (err) {
                    return next(err);
                }

                async.each(idsToArchive, (id, eCb) => {
                    OutletModel.findById(id)
                        .lean()
                        .exec((err, resp) => {
                            if (err) {
                                return eCb(err);
                            }

                            const bodyObject = {
                                actionOriginator: req.session.uId,
                                accessRoleLevel: req.session.level,
                                body: resp,
                            };

                            ActivityLog.emit('customer:archived', bodyObject);

                            eCb();
                        });
                }, (err) => {
                    if (err) {
                        logWriter.log('customer archived error', err);
                    }
                });

                if (archived) {
                    someEvents.locationArchived({
                        id: idsToArchive,
                        type: CONTENT_TYPES.OUTLET,
                        Personnel: PersonnelModel,
                        Session: SessionModel,
                        Branch: BranchModel,
                    }, (err) => {
                        if (err) {
                            return next(err);
                        }

                        res.status(200).send();
                    });
                } else {
                    res.status(200).send();
                }
            });
        }

        access.getArchiveAccess(req, ACL_MODULES.CUSTOMER, (err, allowed) => {
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

            OutletModel.findById(id)
                .exec((err, result) => {
                    if (err) {
                        return next(err);
                    }
                    if (result && result.name) {
                        result.name = {
                            en: result.name.en ? _.unescape(result.name.en) : '',
                            ar: result.name.ar ? _.unescape(result.name.ar) : '',
                        };
                    }

                    res.status(200).send(result);
                });
        }

        access.getReadAccess(req, ACL_MODULES.CUSTOMER, (err, allowed) => {
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

            OutletModel.find(query, '_id name').exec((err, response) => {
                if (err) {
                    return next(err);
                }
                if (response.length) {
                    response = _.map(response, (element) => {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en),
                        };
                        return element;
                    });
                }

                res.status(200).send(response);
            });
        }

        access.getReadAccess(req, ACL_MODULES.CUSTOMER, (err, allowed) => {
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
        let pipeLine = [];
        const skip = options.skip;
        const limit = options.limit;
        const sort = options.sort;
        const isMobile = options.isMobile;
        const queryObject = options.queryObject;
        const translated = options.translated;
        const translateFields = options.translateFields;
        const language = options.language;
        const aggregateHelper = options.aggregateHelper;
        const searchObject = options.searchObject;
        let pipeObject;

        pipeLine.push({
            $match: isMobile ? _.pick(queryObject, 'subRegion', 'retailSegment') : _.pick(queryObject, 'subRegions', 'retailSegments', 'archived'),
        });

        if (translated && translated.length === 1) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    translated: aggregateHelper.translatedCond(language, translateFields, translated[0]),
                }),
            });

            pipeLine.push({
                $match: {
                    translated: true,
                },
            });
        }

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'outlets',
                key: 'outlet',
                isArray: false,
                addProjection: ['createdBy', 'editedBy', 'imageSrc', 'archived', 'topArchived', 'retailSegments', 'subRegions', 'imageSrc'],
            }));

            pipeLine.push({
                $project: {
                    _id: '$outlet._id',
                    name: '$outlet.name',
                    createdBy: '$outlet.createdBy',
                    editedBy: '$outlet.editedBy',
                    archived: '$outlet.archived',
                    topArchived: '$outlet.topArchived',
                    retailSegments: '$outlet.retailSegments',
                    subRegions: '$outlet.subRegions',
                    imageSrc: '$outlet.imageSrc',
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: { createdBy: { date: 1 } },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'createdBy.user.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    },
                },
            },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'createdBy.user.position',
            isArray: false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    },
                },
            },
        }));

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'personnels',
                key: 'editedBy.user',
                isArray: false,
                addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
                includeSiblings: { editedBy: { date: 1 } },
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'accessRoles',
                key: 'editedBy.user.accessRole',
                isArray: false,
                addProjection: ['_id', 'name', 'level'],
                includeSiblings: {
                    editedBy: {
                        date: 1,
                        user: {
                            _id: 1,
                            position: 1,
                            firstName: 1,
                            lastName: 1,
                            imageSrc: 1,
                        },
                    },
                },
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'positions',
                key: 'editedBy.user.position',
                isArray: false,
                includeSiblings: {
                    editedBy: {
                        date: 1,
                        user: {
                            _id: 1,
                            accessRole: 1,
                            firstName: 1,
                            lastName: 1,
                            imageSrc: 1,
                        },
                    },
                },
            }));

            pipeLine.push({
                $group: {
                    _id: null,
                    data: {
                        $addToSet: '$$ROOT',
                    },
                },
            });

            pipeLine.push({
                $unwind: {
                    path: '$data',
                    preserveNullAndEmptyArrays: true,
                },
            });

            pipeObject = {
                $project: {
                    _id: '$data._id',
                    editedBy: '$data.editedBy',
                    retailSegments: '$data.retailSegments',
                    archived: '$data.archived',
                    topArchived: '$data.topArchived',
                    total: '$data.total',
                    name: '$data.name',
                    createdBy: '$data.createdBy',
                    subRegions: '$data.subRegions',
                    imageSrc: '$data.imageSrc',
                },
            };

            pipeLine.push(pipeObject);

            pipeLine.push({
                $match: _.pick(queryObject, '$or'),
            });
        } else {
            pipeLine.push({
                $match: searchObject,
            });
        }

        /*        pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

         if (limit && limit !== -1) {
         pipeLine.push({$sort: sort});
         pipeLine.push({$skip: skip});
         pipeLine.push({$limit: limit});
         }

         pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile,
            skip,
            limit,
            sort,
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            const query = req.query;
            const isMobile = req.isMobile;
            const filter = query.filter || {};
            const lastLogOut = new Date(query.lastLogOut);
            const filterMapper = new FilterMapper();
            let pipeLine;
            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.OUTLET,
                filter,
                personnel,
            });
            let aggregateHelper;
            let ids;
            let aggregation;

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, (id) => {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids,
                };
            }

            async.waterfall([
                function (waterfallCb) {
                    self.getSubRegionsByCountryOrRegion(queryObject, 'region', waterfallCb);
                },
                function (regionIds, waterfallCb) {
                    queryObject.region = regionIds ? { $in: regionIds } : queryObject.region;
                    self.getSubRegionsByCountryOrRegion(queryObject, 'subRegion', waterfallCb);
                },
                function (ids, waterfallCb) {
                    if (ids && ids.length) {
                        if (isMobile) {
                            queryObject.subRegion = { $in: ids };
                        } else {
                            queryObject.subRegions = { $in: ids };
                        }
                    }

                    aggregateHelper = new AggregationHelper($defProjection, queryObject);

                    aggregateHelper.setSyncQuery(queryObject, lastLogOut);

                    pipeLine = getAllPipeLine({
                        aggregateHelper,
                        queryObject,
                        isMobile,
                    });

                    aggregation = BranchModel.aggregate(pipeLine);
                    aggregation.options = {
                        allowDiskUse: true,
                    };
                    aggregation.exec((err, result) => {
                        if (err) {
                            return waterfallCb(err);
                        }

                        waterfallCb(null, result);
                    });
                },

            ], (err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    if (element.name) {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, 4, (err, allowed, personnel) => {
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
            const query = req.query;
            const isMobile = req.isMobile;
            const filter = query.filter || {};
            const page = query.page || 1;
            const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            const skip = (page - 1) * limit;

            const language = req.cookies.currentLanguage;
            const sortObject = language === 'en' ? { 'name.en': 1 } : { 'name.ar': 1 };
            const translateFields = ['name'];
            const translated = (query.filter && query.filter.translated) ? query.filter.translated.values : [];

            const filterMapper = new FilterMapper();
            const filterSearch = filter.globalSearch || '';
            const queryObject = !isMobile ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.OUTLET,
                filter,
                personnel,
            }) :
                filterMapper.mapFilter({
                    contentType: CONTENT_TYPES.OUTLET,
                    filter,
                    context: CONTENT_TYPES.OUTLET,
                    personnel,
                });

            let key;
            const sort = query.sort || sortObject;
            const searchFieldsArray = [
                'name.en',
                'name.ar',
            ];
            const archived = queryObject.archived;
            delete queryObject.archived;

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            if (!archived && !isMobile) {
                queryObject.archived = false;
            }

            async.waterfall([
                function (waterfallCb) {
                    self.getSubRegionsByCountryOrRegion(queryObject, 'region', waterfallCb);
                },
                function (regionIds, waterfallCb) {
                    queryObject.region = regionIds ? { $in: regionIds } : queryObject.region;
                    self.getSubRegionsByCountryOrRegion(queryObject, 'subRegion', waterfallCb);
                },
                function (ids, waterfallCb) {
                    if (ids && ids.length) {
                        if (isMobile) {
                            queryObject.subRegion = { $in: ids };
                        } else {
                            queryObject.subRegions = { $in: ids };
                        }
                    }

                    if (archived) {
                        queryObject.archived = archived;
                    }

                    if (isMobile) {
                        delete filter.globalSearch;

                        const aggregateHelper = new AggregationHelper($defProjection, queryObject);
                        const searchObject = aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch);

                        const pipeLine = getAllPipeLine({
                            skip,
                            limit,
                            sort,
                            isMobile,
                            queryObject,
                            translated,
                            translateFields,
                            language,
                            aggregateHelper,
                            searchObject,
                        });

                        return BranchModel.aggregate(pipeLine)
                            .allowDiskUse(true)
                            .exec(waterfallCb);
                    }

                    const isArchivedView = queryObject.archived && queryObject.archived.$in[0];
                    const outletPipeline = [
                        {
                            $lookup: {
                                from: 'personnels',
                                localField: 'createdBy.user',
                                foreignField: '_id',
                                as: 'createdBy.user',
                            },
                        },
                        {
                            $project: {
                                createdBy: {
                                    user: {
                                        $cond: {
                                            if: {
                                                $eq: ['$createdBy.user', []],
                                            },
                                            then: null,
                                            else: {
                                                $arrayElemAt: ['$createdBy.user', 0],
                                            },
                                        },
                                    },
                                    date: 1,
                                },
                                _id: 1,
                                name: 1,
                                archived: 1,
                                subRegions: 1,
                                retailSegments: 1,
                                editedBy: 1,
                                topArchived: 1,
                                translated: 1,
                                imageSrc: 1,
                            },
                        },
                        {
                            $project: {
                                createdBy: {
                                    user: {
                                        $cond: {
                                            if: {
                                                $eq: ['$createdBy.user', null],
                                            },
                                            then: null,
                                            else: {
                                                _id: '$createdBy.user._id',
                                                name: '$createdBy.user.name',
                                                firstName: '$createdBy.user.firstName',
                                                lastName: '$createdBy.user.lastName',
                                                position: '$createdBy.user.position',
                                                accessRole: '$createdBy.user.accessRole',
                                            },
                                        },
                                    },
                                    date: 1,
                                },
                                _id: 1,
                                name: 1,
                                archived: 1,
                                subRegions: 1,
                                retailSegments: 1,
                                editedBy: 1,
                                topArchived: 1,
                                translated: 1,
                                imageSrc: 1,
                            },
                        },
                        {
                            $lookup: {
                                from: 'accessRoles',
                                localField: 'createdBy.user.accessRole',
                                foreignField: '_id',
                                as: 'createdBy.user.accessRole',
                            },
                        },
                        {
                            $project: {
                                createdBy: {
                                    user: {
                                        accessRole: {
                                            $cond: {
                                                if: {
                                                    $eq: ['$createdBy.user.accessRole', []],
                                                },
                                                then: null,
                                                else: {
                                                    $arrayElemAt: ['$createdBy.user.accessRole', 0],
                                                },
                                            },
                                        },
                                        _id: 1,
                                        position: 1,
                                        firstName: 1,
                                        lastName: 1,
                                    },
                                    date: 1,
                                },
                                _id: 1,
                                name: 1,
                                archived: 1,
                                subRegions: 1,
                                retailSegments: 1,
                                editedBy: 1,
                                topArchived: 1,
                                translated: 1,
                                imageSrc: 1,
                            },
                        },
                        {
                            $project: {
                                createdBy: {
                                    user: {
                                        accessRole: {
                                            $cond: {
                                                if: {
                                                    $eq: ['$createdBy.user.accessRole', null],
                                                },
                                                then: null,
                                                else: {
                                                    _id: '$createdBy.user.accessRole._id',
                                                    name: '$createdBy.user.accessRole.name',
                                                    level: '$createdBy.user.accessRole.level',
                                                },
                                            },
                                        },
                                        _id: 1,
                                        position: 1,
                                        firstName: 1,
                                        lastName: 1,
                                    },
                                    date: 1,
                                },
                                _id: 1,
                                name: 1,
                                archived: 1,
                                subRegions: 1,
                                retailSegments: 1,
                                editedBy: 1,
                                topArchived: 1,
                                translated: 1,
                                imageSrc: 1,
                            },
                        },
                        {
                            $lookup: {
                                from: 'positions',
                                localField: 'createdBy.user.position',
                                foreignField: '_id',
                                as: 'createdBy.user.position',
                            },
                        },
                        {
                            $project: {
                                createdBy: {
                                    user: {
                                        position: {
                                            $cond: {
                                                if: {
                                                    $eq: ['$createdBy.user.position', []],
                                                },
                                                then: null,
                                                else: {
                                                    $arrayElemAt: ['$createdBy.user.position', 0],
                                                },
                                            },
                                        },
                                        _id: 1,
                                        accessRole: 1,
                                        firstName: 1,
                                        lastName: 1,
                                    },
                                    date: 1,
                                },
                                _id: 1,
                                name: 1,
                                archived: 1,
                                subRegions: 1,
                                retailSegments: 1,
                                editedBy: 1,
                                topArchived: 1,
                                translated: 1,
                                imageSrc: 1,
                            },
                        },
                        {
                            $project: {
                                createdBy: {
                                    user: {
                                        position: {
                                            $cond: {
                                                if: {
                                                    $eq: ['$createdBy.user.position', null],
                                                },
                                                then: null,
                                                else: {
                                                    _id: '$createdBy.user.position._id',
                                                    name: '$createdBy.user.position.name',
                                                },
                                            },
                                        },
                                        _id: 1,
                                        accessRole: 1,
                                        firstName: 1,
                                        lastName: 1,
                                    },
                                    date: 1,
                                },
                                _id: 1,
                                name: 1,
                                archived: 1,
                                subRegions: 1,
                                retailSegments: 1,
                                editedBy: 1,
                                topArchived: 1,
                                translated: 1,
                                imageSrc: 1,
                            },
                        },
                        {
                            $sort: sortObject,
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
                                archived: '$data.archived',
                                subRegions: '$data.subRegions',
                                retailSegments: '$data.retailSegments',
                                createdBy: '$data.createdBy',
                                editedBy: '$data.editedBy',
                                topArchived: '$data.topArchived',
                                translated: '$data.translated',
                                imageSrc: '$data.imageSrc',
                                total: 1,
                            },
                        },
                        {
                            $skip: skip,
                        },
                        {
                            $limit: limit,
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
                    ];
                    const searchQuery = {
                        $or: [
                            {
                                'name.en': {
                                    $regex: filter.globalSearch,
                                    $options: 'i',
                                },
                            },
                            {
                                'name.ar': {
                                    $regex: filter.globalSearch,
                                    $options: 'i',
                                },
                            },
                        ],
                    };

                    // menu "Customers" in CMS
                    if (!queryObject.subRegions && !queryObject.retailSegments) {
                        const outletSearchQuery = {
                            $match: {
                                $and: [],
                            },
                        };

                        if (filter.globalSearch && filter.globalSearch.length) {
                            outletSearchQuery.$match.$and.push(searchQuery);
                        }

                        if (isArchivedView) {
                            outletSearchQuery.$match.$and.push({
                                $or: [
                                    { archived: true },
                                    { topArchived: true },
                                ],
                            });
                        } else {
                            outletSearchQuery.$match.$and.push({
                                archived: false,
                                topArchived: false,
                            });
                        }

                        const pipeline = [
                            outletSearchQuery,
                            ...outletPipeline,
                        ];

                        return OutletCollection.aggregate(pipeline, waterfallCb);
                    }

                    // section "Customers" in menu "Countries" in CMS
                    const genericQuery = {
                        archived: isArchivedView,
                    };
                    const $match = {
                        $and: [
                            genericQuery,
                        ],
                    };

                    if (queryObject.subRegions) {
                        genericQuery.subRegion = queryObject.subRegions;
                    }

                    if (queryObject.retailSegments) {
                        genericQuery.retailSegment = queryObject.retailSegments;
                    }

                    const pipeline = [
                        {
                            $project: {
                                subRegion: 1,
                                retailSegment: 1,
                                outlet: 1,
                                archived: 1,
                            },
                        },
                        {
                            $match,
                        },
                        {
                            $group: {
                                _id: null,
                                outlet: {
                                    $addToSet: '$outlet',
                                },
                            },
                        },
                        {
                            $unwind: {
                                path: '$outlet',
                            },
                        },
                        {
                            $lookup: {
                                from: 'outlets',
                                localField: 'outlet',
                                foreignField: '_id',
                                as: 'outlet',
                            },
                        },
                        {
                            $project: {
                                outlet: {
                                    $arrayElemAt: ['$outlet', 0],
                                },
                            },
                        },
                        {
                            $replaceRoot: {
                                newRoot: '$outlet',
                            },
                        },
                    ];

                    const branchSearchQuery = {
                        $match: {
                            $and: [],
                        },
                    };

                    if (!isArchivedView) {
                        branchSearchQuery.$match.$and.push({
                            archived: false,
                            topArchived: false,
                        });
                    }

                    if (filter.globalSearch && filter.globalSearch.length) {
                        branchSearchQuery.$match.$and.push(searchQuery);
                    }

                    if (branchSearchQuery.$match.$and.length) {
                        pipeline.push(branchSearchQuery);
                    }

                    pipeline.push(...outletPipeline);

                    BranchCollection.aggregate(pipeline.filter(stage => stage), waterfallCb);
                },

            ], (err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ?
                    result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    if (element.name) {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en),
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.CUSTOMER, (err, allowed, personnel) => {
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
            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : '',
                };
            }

            const imageSrc = body.imageSrc;

            delete body.imageSrc;

            body.editedBy = {
                user: req.session.uId,
                date: new Date(),
            };

            async.waterfall([
                (cb) => {
                    OutletModel.findByIdAndUpdate(id, body, { new: true }).exec(cb);
                },
                (model, cb) => {
                    ActivityLog.emit('customer:updated', {
                        actionOriginator: req.session.uId,
                        accessRoleLevel: req.session.level,
                        body: model.toJSON(),
                    });

                    PreviewModel.setNewPreview({
                        model,
                        base64: imageSrc,
                        contentType: CONTENT_TYPES.OUTLET,
                    }, cb);
                },
            ], (err, model) => {
                if (err) {
                    return next(err);
                }

                if (model && model.name) {
                    model.name = {
                        en: model.name.en ? _.unescape(model.name.en) : '',
                        ar: model.name.ar ? _.unescape(model.name.ar) : '',
                    };
                }

                res.status(200).send(model);
            });
        }

        access.getEditAccess(req, ACL_MODULES.CUSTOMER, (err, allowed) => {
            const body = req.body;

            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.OUTLET, 'update', (err, saveData) => {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };
};

module.exports = OutletHandler;
