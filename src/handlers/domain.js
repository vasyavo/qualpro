'use strict';
const ActivityLog = require('./../stories/push-notifications/activityLog');

const Domain = function () {
    const async = require('async');
    const mongoose = require('mongoose');
    const _ = require('underscore');
    const lodash = require('lodash');
    const ACL_MODULES = require('../constants/aclModulesNames');
    const CONTENT_TYPES = require('../public/js/constants/contentType.js');
    const CONSTANTS = require('../constants/mainConstants');
    const DomainModel = require('./../types/domain/model');
    const BranchModel = require('./../types/branch/model');
    const PersonnelModel = require('./../types/personnel/model');
    const PreviewModel = require('./../stories/preview/model.business');
    const SessionModel = require('./../types/session/model');
    const ACTIVITY_TYPES = require('../constants/activityTypes');
    const ObjectId = mongoose.Types.ObjectId;
    const access = require('../helpers/access')();
    const FilterMapper = require('../helpers/filterMapper');
    const Archiver = require('../helpers/domainArchiver');
    const logWriter = require('../helpers/logWriter.js');
    const archiver = new Archiver(DomainModel, BranchModel);
    const populateByType = require('../helpers/populateByType');
    const contentTypes = require('../public/js/helpers/contentTypesHelper');
    const AggregationHelper = require('../helpers/aggregationCreater');
    const bodyValidator = require('../helpers/bodyValidator');
    const cutOccupiedDomains = require('../helpers/cutOccupiedDomains');
    const objectId = mongoose.Types.ObjectId;

    const $defProjection = {
        _id: 1,
        name: 1,
        currency: 1,
        type: 1,
        editedBy: 1,
        createdBy: 1,
        parent: 1,
        archived: 1,
        topArchived: 1,
        total: 1,
        translated: 1,
        imageSrc: 1,
    };

    this.create = function (req, res, next) {
        const mid = req.mid || ACL_MODULES.COUNTRY;

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

            if (body.parentId) {
                body.parent = objectId(body.parentId);
            }

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            const model = new DomainModel(body);

            async.waterfall([
                (cb) => {
                    model.save(cb);
                },
                (result, count, cb) => {
                    const bodyObject = {
                        actionOriginator: req.session.uId,
                        accessRoleLevel: req.session.level,
                        body: result.toJSON(),
                    };

                    switch (body.type) {
                        case ('country') :
                            ActivityLog.emit('country:created', bodyObject);
                            break;
                        case ('region') :
                            ActivityLog.emit('region:created', bodyObject);
                            break;
                        case ('subRegion') :
                            ActivityLog.emit('sub-region:created', bodyObject);
                            break;
                    }

                    PreviewModel.setNewPreview({
                        model: result,
                        base64: imageSrc,
                        contentType: CONTENT_TYPES.DOMAIN,
                    }, cb);
                },
            ], (err, result) => {
                if (err) {
                    return next(err);
                }

                if (result && result.name) {
                    result.name = {
                        en: result.name.en ? _.unescape(result.name.en) : '',
                        ar: result.name.ar ? _.unescape(result.name.ar) : '',
                    };
                }

                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, mid, (err, allowed) => {
            const body = req.body;

            if (err) {
                return next(err);
            }

            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.DOMAIN, 'create', (err, saveData) => {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.remove = function (req, res, next) {
        const id = req.params.id;

        DomainModel.findByIdAndRemove(id, (error) => {
            if (error) {
                return next(error);
            }

            res.status(200).send();
        });
    };

    this.archive = function (req, res, next) {
        const mid = req.mid || ACL_MODULES.COUNTRY;

        function queryRun() {
            const idsToArchive = req.body.ids.objectID();
            const archived = req.body.archived === 'false' ? false : !!req.body.archived;
            const baseUrl = req.baseUrl;
            const uId = req.session.uId;
            const contentType = baseUrl.slice(1, baseUrl.length);
            const options = {
                ids: idsToArchive,
                archived,
                contentType,
                Personnel: PersonnelModel,
                Session: SessionModel,
                Branch: BranchModel,
            };

            archiver.archiveToEnd(uId, options, (err, response) => {
                let type = ACTIVITY_TYPES.ARCHIVED;
                const createdBy = {
                    user: req.session.uId,
                    date: new Date(),
                };

                if (err) {
                    return next(err);
                }

                if (!req.body.archived) {
                    type = ACTIVITY_TYPES.UNARCHIVED;
                }
                async.each(idsToArchive, (id, eCb) => {
                    DomainModel.findById(id)
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

                            switch (options.contentType) {
                                case ('country') :
                                    ActivityLog.emit('country:archived', bodyObject);
                                    break;
                                case ('region') :
                                    ActivityLog.emit('region:archived', bodyObject);
                                    break;
                                case ('subRegion') :
                                    ActivityLog.emit('sub-region:archived', bodyObject);
                                    break;
                            }
                            eCb();
                        });
                }, (err) => {
                    if (err) {
                        logWriter.log('planogram archived error', err);
                    }
                });

                res.status(200).send();
            });
        }

        access.getArchiveAccess(req, mid, (err, allowed) => {
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

            BranchModel
                .findById(id)
                .populate('currency')
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

        access.getReadAccess(req, ACL_MODULES.COUNTRY, (err, allowed) => {
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

            DomainModel.find(query, '_id name parent').exec((err, result) => {
                if (err) {
                    return next(err);
                }
                if (result.length) {
                    result = _.map(result, (element) => {
                        element.name = {
                            ar: _.unescape(element.name.ar),
                            en: _.unescape(element.name.en),
                        };
                        return element;
                    });
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.COUNTRY, (err, allowed) => {
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

    function getAllPipeline(options) {
        const queryObject = options.queryObject;
        const aggregateHelper = options.aggregateHelper;
        const language = options.language;
        const translateFields = options.translateFields;
        const translated = options.translated;
        const searchFieldsArray = options.searchFieldsArray;
        const filterSearch = options.filterSearch;
        const sort = options.sort;
        const skip = options.skip;
        const limit = options.limit;
        const forSync = options.forSync;
        const isMobile = options.isMobile;
        const excludeItems = options.excludeItems;
        let pipeLine = [];
        const queryObjectTime = _.pick(queryObject, '$or');
        const queryObjectWithoutTime = _.omit(queryObject, '$or');
        if (!isMobile) {
            pipeLine.push({
                $match: queryObject,
            });

            if (excludeItems) {
                pipeLine.push({
                    $match: {
                        _id: {
                            $nin: excludeItems,
                        },
                    },
                });
            }

            pipeLine.push({
                $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch),
            });
        } else {
            if (queryObject.subRegion) {
                pipeLine.push({
                    $match: {
                        $or: [
                            { _id: queryObject.subRegion },
                            { _id: queryObject.region },
                            { _id: queryObject.country },
                        ],
                    },
                });
            } else if (queryObject.region) {
                pipeLine.push({
                    $match: {
                        $or: [
                            { _id: queryObject.region },
                            { _id: queryObject.country },
                            { parent: queryObject.region },
                        ],
                    },
                });
            } else if (queryObject.country) {
                pipeLine.push({
                    $match: {
                        $or: [
                            { _id: queryObject.country },
                            { parent: queryObject.country },
                            { type: 'subRegion' },
                        ],
                    },
                });

                pipeLine.push({
                    $lookup: {
                        from: 'domains',
                        localField: 'parent',
                        foreignField: '_id',
                        as: 'parent',
                    },
                });

                pipeLine.push({
                    $project: aggregateHelper.getProjection({
                        parent: { $arrayElemAt: ['$parent', 0] },
                    }),
                });

                pipeLine.push({
                    $match: {
                        $or: [
                            { type: 'country' },
                            { type: 'region' },
                            { 'parent.parent': queryObject.country },
                        ],
                    },
                });

                pipeLine.push({
                    $project: aggregateHelper.getProjection({
                        parent: '$parent._id',
                    }),
                });
            } else {
                pipeLine.push({
                    $match: queryObjectWithoutTime,
                });
            }

            pipeLine.push({
                $match: queryObjectTime,
            });
        }

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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: { createdBy: { date: 1 } },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: { editedBy: { date: 1 } },
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'currencies',
            key: 'currency',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile,
            searchFieldsArray,
            filterSearch,
            skip,
            limit,
            sort,
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            const query = req.query;
            const filter = query.filter || {};
            const lastLogOut = new Date(query.lastLogOut);
            const filterMapper = new FilterMapper();
            const type = query.parentCT;
            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.DOMAIN,
                filter,
                personnel,
            });
            const aggregateHelper = new AggregationHelper($defProjection, queryObject);
            const sort = query.sort || { 'editedBy.date': 1 };
            let pipeLine;
            let aggregation;
            let ids;

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

            pipeLine = getAllPipeline({
                aggregateHelper,
                queryObject,
                sort,
                forSync: true,
                isMobile: req.isMobile,
            });

            aggregation = DomainModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true,
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    element.name = {
                        ar: _.unescape(element.name.ar),
                        en: _.unescape(element.name.en),
                    };
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.COUNTRY, (err, allowed, personnel) => {
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
            const filter = query.filter || {};
            const type = query.parentCT;
            const isMobile = req.isMobile;
            const contentType = contentTypes.getNextType(type);
            const page = query.page || 1;
            const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            const skip = (page - 1) * limit;

            const language = req.cookies.currentLanguage;
            const sortObject = language === 'en' ? { 'name.en': 1 } : { 'name.ar': 1 };

            const translateFields = ['name'];
            const translated = (query.filter && query.filter.translated) ? query.filter.translated.values : [];

            const filterMapper = new FilterMapper();
            const filterSearch = filter.globalSearch || '';
            let aggregation;
            let key;
            const queryObject = isMobile ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.DOMAIN,
                filter,
                personnel,
            }) :
                filterMapper.mapFilter({
                    contentType: CONTENT_TYPES.DOMAIN,
                    filter,
                    context: contentType,
                    personnel,
                });

            const aggregateHelper = new AggregationHelper($defProjection, queryObject);

            const sort = query.sort || sortObject;

            const searchFieldsArray = [
                'name.en',
                'name.ar',
            ];

            delete filter.globalSearch;

            for (key in sort) {
                sort[key] = parseInt(sort[key]);
            }

            if (!isMobile && !queryObject.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            if (!isMobile) {
                queryObject.type = contentType;
            }

            if (isMobile) {
                delete queryObject.region;
                delete queryObject.subRegion;
            }

            const pipeLine = getAllPipeline({
                queryObject,
                aggregateHelper,
                language,
                translateFields,
                translated,
                searchFieldsArray,
                filterSearch,
                sort,
                skip,
                limit,
                isMobile,
            });

            aggregation = DomainModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true,
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    element.name = {
                        ar: _.unescape(element.name.ar),
                        en: _.unescape(element.name.en),
                    };
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.COUNTRY, (err, allowed, personnel) => {
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
        const mid = req.mid || ACL_MODULES.COUNTRY;

        function queryRun(body) {
            const id = req.params.id;

            const imageSrc = body.imageSrc;

            delete body.imageSrc;

            if (body.name) {
                body.name = {
                    en: body.name.en ? _.escape(body.name.en) : '',
                    ar: body.name.ar ? _.escape(body.name.ar) : '',
                };
            }

            body.editedBy = {
                user: req.session.uId,
                date: new Date(),
            };

            const query = DomainModel.findByIdAndUpdate(id, body, { new: true });

            async.waterfall([
                (cb) => {
                    populateByType(query, body.type).exec((err, result) => {
                        if (err) {
                            return next(err);
                        }

                        const bodyObject = {
                            actionOriginator: req.session.uId,
                            accessRoleLevel: req.session.level,
                            body: result.toJSON(),
                        };

                        switch (body.type) {
                            case ('country') :
                                ActivityLog.emit('country:updated', bodyObject);
                                break;
                            case ('region') :
                                ActivityLog.emit('region:updated', bodyObject);
                                break;
                            case ('subRegion') :
                                ActivityLog.emit('sub-region:updated', bodyObject);
                                break;
                        }

                        PreviewModel.setNewPreview({
                            model: result,
                            base64: imageSrc,
                            contentType: CONTENT_TYPES.DOMAIN,
                        }, cb);
                    });
                },
            ], (err, result) => {
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

        access.getEditAccess(req, mid, (err, allowed) => {
            const body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.DOMAIN, 'update', (err, saveData) => {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };
};

module.exports = Domain;
