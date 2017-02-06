var Documents = function (db, redis, event) {
    'use strict';
    
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var DocumentModel = require('./../types/document/model');
    var ContractYearlyModel = require('./../types/contractYearly/model');
    var ContractSecondaryModel = require('./../types/contractSecondary/model');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(DocumentModel);
    var logWriter = require('../helpers/logWriter.js');
    var errorSender = require('../utils/errorSender');
    var ERROR_MESSAGES = require('../constants/errorMessages');
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')(db);
    var bodyValidator = require('../helpers/bodyValidator');
    var joiValidate = require('../helpers/joiValidate');
    
    var self = this;
    
    var $defProjection = {
        _id         : 1,
        createdBy   : 1,
        editedBy    : 1,
        title       : 1,
        attachments : 1,
        contentType : 1,
        originalName: 1,
        archived    : 1,
        creationDate: 1,
        updateDate  : 1
    };
    
    
    // projectTotal option needs for getAll method
    const getMainPipeline = () => {
        let pipeLine = [{
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'breadcrumbs',
                as          : 'breadcrumbs'
            }
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $project: {
                _id       : 1,
                title     : 1,
                total     : 1,
                createdBy : 1,
                editedBy  : 1,
                attachment: 1,
                type      : 1,
                parent    : 1,
                deleted   : 1,
                archived  : 1,
                
                breadcrumbs: {
                    _id  : 1,
                    title: 1
                }
            }
        }, {
            $group: {
                _id       : '$_id',
                total     : {$first: '$total'},
                title     : {$first: '$title'},
                createdBy : {$first: '$createdBy'},
                editedBy  : {$first: '$editedBy'},
                attachment: {$first: '$attachment'},
                type      : {$first: '$type'},
                parent    : {$first: '$parent'},
                deleted   : {$first: '$deleted'},
                archived  : {$first: '$archived'},
                
                breadcrumbs: {
                    $push: '$breadcrumbs'
                }
            }
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'parent',
                as          : 'parent'
            }
        }, {
            $unwind: {
                path                      : '$parent',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'createdBy.user',
                as          : 'createdBy.user'
            }
        }, {
            $unwind: {
                path                      : '$createdBy.user',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'editedBy.user',
                as          : 'editedBy.user'
            }
        }, {
            $unwind: {
                path                      : '$editedBy.user',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'files',
                foreignField: '_id',
                localField  : 'attachment',
                as          : 'attachment'
            }
        }, {
            $unwind: {
                path                      : '$attachment',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $project: {
                _id        : 1,
                total      : 1,
                title      : 1,
                type       : 1,
                deleted    : 1,
                archived   : 1,
                attachment : {
                    _id         : 1,
                    name        : 1,
                    contentType : 1,
                    originalName: 1,
                    extension   : 1
                },
                breadcrumbs: 1,
                createdBy  : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1
                    }
                },
                editedBy   : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1
                    }
                },
                parent     : {
                    _id  : 1,
                    title: 1
                }
            }
        }, {
            $project: {
                _id        : 1,
                total      : 1,
                title      : 1,
                createdBy  : 1,
                editedBy   : 1,
                type       : 1,
                deleted    : 1,
                archived   : 1,
                breadcrumbs: 1,
                attachment : {
                    $ifNull: ['$attachment', null]
                },
                parent     : {
                    $ifNull: ['$parent', null]
                }
            }
        }];
        
        return pipeLine;
    };
    
    const getById = (_id, cb) => {
        let pipeLine = [{
            $match: {
                _id: ObjectId(_id)
                
            }
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'breadcrumbs',
                as          : 'breadcrumbs'
            }
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $project: {
                _id       : 1,
                title     : 1,
                createdBy : 1,
                editedBy  : 1,
                attachment: 1,
                type      : 1,
                parent    : 1,
                deleted   : 1,
                archived  : 1,
                
                breadcrumbs: {
                    _id  : 1,
                    title: 1
                }
            }
        }, {
            $group: {
                _id       : '$_id',
                title     : {$first: '$title'},
                createdBy : {$first: '$createdBy'},
                editedBy  : {$first: '$editedBy'},
                attachment: {$first: '$attachment'},
                type      : {$first: '$type'},
                parent    : {$first: '$parent'},
                deleted   : {$first: '$deleted'},
                archived  : {$first: '$archived'},
                
                breadcrumbs: {
                    $push: '$breadcrumbs'
                }
            }
        }, {
            $lookup: {
                from        : 'files',
                foreignField: '_id',
                localField  : 'attachment',
                as          : 'attachment'
            }
        }, {
            $unwind: {
                path                      : '$attachment',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'parent',
                as          : 'parent'
            }
        }, {
            $unwind: {
                path                      : '$parent',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'createdBy.user',
                as          : 'createdBy.user'
            }
        }, {
            $unwind: {
                path                      : '$createdBy.user',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'editedBy.user',
                as          : 'editedBy.user'
            }
        }, {
            $unwind: {
                path                      : '$editedBy.user',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $project: {
                _id        : 1,
                title      : 1,
                type       : 1,
                deleted    : 1,
                archived   : 1,
                breadcrumbs: 1,
                createdBy  : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1
                    }
                },
                editedBy   : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1
                    }
                },
                attachment : {
                    _id         : 1,
                    preview     : 1,
                    contentType : 1,
                    extension   : 1,
                    originalName: 1,
                    name        : 1,
                },
                parent     : {
                    _id  : 1,
                    title: 1
                }
            }
        }, {
            $project: {
                _id        : 1,
                title      : 1,
                createdBy  : 1,
                editedBy   : 1,
                type       : 1,
                deleted    : 1,
                archived   : 1,
                breadcrumbs: 1,
                attachment : {
                    $ifNull: ['$attachment', null]
                },
                parent     : {
                    $ifNull: ['$parent', null]
                }
            }
        }];
        
        DocumentModel.aggregate(pipeLine).allowDiskUse(true).exec((err, docs) => {
            if (err) {
                return cb(err);
            }
            
            let result = docs && docs.length ? docs[0] : null;
            
            if (!result) {
                return errorSender.badRequest(cb, 'Document not found')
            }
            
            if (result.deleted) {
                return errorSender.badRequest(cb, 'Document already deleted')
            }
            
            cb(null, result);
        });
    };
    
    const getAllDocs = (options, cb) => {
        const {
            parentId = null,
            personnelId = null,
            lastLogOut = null,
            sortBy = 'createdAt',
            sortOrder = -1,
            skip = 0,
            count = 20,
            search = ''
        } = options;
        const pipeLine = [];
        const matchObj = {
            $match: {
                'createdBy.user': ObjectId(personnelId)
            }
        };
        
        if (parentId) {
            matchObj.$match.parent = typeof parentId === 'string' ? ObjectId(parentId) : parentId;
        }
        
        if (lastLogOut) {
            matchObj.$match.$or = [
                {
                    'createdBy.date': {
                        $gte: lastLogOut
                    }
                }, {
                    'updatedBy.date': {
                        $gte: lastLogOut
                    }
                }
            ];
        }
        
        pipeLine.push(matchObj);
        
        if (search) {
            let regExpObject = {
                $match: {
                    title: {
                        $regex  : search,
                        $options: 'xi'
                    }
                }
            };
            
            pipeLine.push(regExpObject);
        }
        
        
        pipeLine.push({
                $group: {
                    _id  : null,
                    total: {$sum: 1},
                    root : {$push: '$$ROOT'}
                }
            }, {
                $unwind: '$root'
            }, {
                $project: {
                    _id        : '$root._id',
                    title      : '$root.title',
                    createdBy  : '$root.createdBy',
                    editedBy   : '$root.editedBy',
                    type       : '$root.type',
                    deleted    : '$root.deleted',
                    archived   : '$root.archived',
                    breadcrumbs: '$root.breadcrumbs',
                    attachment : '$root.attachment',
                    parent     : '$root.parent',
                    total      : 1
                }
            }, {
                $sort: {
                    [sortBy]: sortOrder
                }
            }, {
                $skip: skip
            }, {
                $limit: count
            },
            ...getMainPipeline({projectTotal: true}),
            {
                $group: {
                    _id : '$total',
                    root: {
                        $push: {
                            _id        : '$_id',
                            title      : '$title',
                            createdBy  : '$createdBy',
                            editedBy   : '$editedBy',
                            type       : '$type',
                            deleted    : '$deleted',
                            archived   : '$archived',
                            breadcrumbs: '$breadcrumbs',
                            attachment : '$attachment',
                            parent     : '$parent',
                        }
                    }
                }
            }, {
                $project: {
                    _id  : 0,
                    total: '$_id',
                    data : '$root'
                }
            });
        
        DocumentModel.aggregate(pipeLine).allowDiskUse(true).exec((err, docs) => {
            if (err) {
                return cb(err);
            }
            
            let result = docs && docs.length ? docs[0] : null;
            
            cb(null, Object.assign({total: 0, data: []}, result));
        });
    };
    
    const getBreadcrumbsByParent = (parent, cb) => {
        let breadcrumbs = [];
        
        if (!parent) {
            return cb(null, breadcrumbs);
        }
        
        DocumentModel.findById(parent, (err, doc) => {
            if (err) {
                return cb(err);
            }
            
            if (doc.type !== 'folder') {
                return errorSender.badRequest(cb, 'You can create document only inside folder')
            }
            
            breadcrumbs = [...doc.breadcrumbs, doc._id];
            
            cb(null, breadcrumbs);
        });
    };
    
    this.create = function (req, res, next) {
        function queryRun(body) {
            const userId = req.session && req.session.uId;
            const {
                title,
                attachment,
                type,
                parent,
            } = body;
            const createdBy = {
                user: ObjectId(userId),
                date: new Date(),
            };
            
            async.waterfall([
                
                // if parent exist => check is valid and get breadcrumbs
                (cb) => {
                    getBreadcrumbsByParent(parent, cb);
                },
                
                (breadcrumbs, cb) => {
                    const options = {
                        title     : _.escape(title),
                        attachment: type == 'file' ? attachment : null,
                        editedBy  : createdBy,
                        parent,
                        type,
                        breadcrumbs,
                        createdBy
                    };
                    
                    DocumentModel.create(options, function (err, model) {
                        if (err) {
                            return cb(err);
                        }
                        
                        cb(null, model);
                    });
                },
                
                (model, cb) => {
                    getById(model._id, cb);
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }
    
                res.status(201).send(result);
            });
        }
        
        access.getWriteAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }
            
            if (!allowed) {
                return errorSender.forbidden(next);
            }
    
            joiValidate(req.body, req.session.level, CONTENT_TYPES.DOCUMENTS, 'create', function (err, body) {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }
        
                queryRun(body);
            });
        });
    };
    
    this.update = function (req, res, next) {
        function queryRun(body) {
            const userId = req.session && req.session.uId;
            const id = req.params.id;
            const {
                title,
            } = body;
            const editedBy = {
                user: ObjectId(userId),
                date: new Date(),
            };
            
            async.waterfall([
                (cb) => {
                    const findObj = {
                        _id             : id,
                        'createdBy.user': userId
                    };
                    const updateObj = {
                        title: _.escape(title),
                        editedBy
                    };
                    const opt = {
                        new: true
                    };
                    
                    DocumentModel.findOneAndUpdate(findObj, updateObj, opt, function (err, model) {
                        if (err) {
                            return cb(err);
                        }
                        
                        if (!model) {
                            return errorSender.badRequest(cb, 'Document not found')
                        }
                        
                        if(model.type === 'folder') {
                            // update nested files for mobile sync
                            // ToDo: push notification
                            
                        } else {
                            // ToDo: push notification
                        }
                        
                        cb(null, model._id);
                    });
                },
                getById
            ], function (err, result) {
                if (err) {
                    return next(err);
                }
                
                res.status(200).send(result);
            });
        }
        
        access.getWriteAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }
            
            if (!allowed) {
                return errorSender.forbidden(next);
            }
            
            joiValidate(req.body, req.session.level, CONTENT_TYPES.DOCUMENTS, 'update', function (err, body) {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }
                
                queryRun(body);
            });
        });
    };
    
    // web only
    this.getById = function (req, res, next) {
        function queryRun() {
            const id = ObjectId(req.params.id);
            
            getById(id, function (err, result) {
                if (err) {
                    return next(err);
                }
                if (!result) {
                    return res.status(404);
                }
                
                res.status(200).send(result);
            });
        }
        
        access.getReadAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                return errorSender.forbidden(next);
            }
            
            queryRun();
        });
    };
    
    // web only
    this.getFolderContent = function (req, res, next) {
        function queryRun(query) {
            const parentId = req.params.id ? ObjectId(req.params.id) : null;
            
            const {
                session: {uId : personnelId} = {uId: null}
            } = req;
            const {
                skip,
                count,
                sortBy,
                sortOrder,
                search,
            } = query;
            
            getAllDocs({
                skip,
                count,
                parentId,
                personnelId,
                sortBy,
                sortOrder,
                search
            }, (err, response) => {
                if (err) {
                    return next(err);
                }
                
                if (response.total === 0) {
                    return res.status(200).send(response);
                }
                
                const fileIds = [];
                const options = {
                    data: {}
                };
                
                response.data = _.map(response.data, function (elem) {
                    if (elem.title) {
                        elem.title = _.unescape(elem.title);
                    }
                    
                    if (elem.attachment) {
                        fileIds.push(elem.attachment._id);
                    }
                    
                    return elem;
                });
                
                options.data[CONTENT_TYPES.FILES] = fileIds;
                
                getImagesHelper.getImages(options, function (err, result) {
                    if (err) {
                        return next(err);
                    }
    
                    const fieldNames = {};
                    const setOptions = {
                        response  : response,
                        imgsObject: result
                    };
    
                    fieldNames[CONTENT_TYPES.FILES] = ['attachment'];
                    setOptions.fields = fieldNames;
    
                    getImagesHelper.setIntoResult(setOptions, function (response) {
        
                        res.status(200).send(response);
                    });
                });
            })
        }
        
        access.getReadAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed) {
            if (err) {
                return next(err);
            }
            
            if (!allowed) {
                return errorSender.forbidden(next);
            }
            
            joiValidate(req.body, req.session.level, CONTENT_TYPES.DOCUMENTS, 'read', function (err, body) {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }
                
                queryRun(body);
            });
        });
    };
    
    // mobile only
    this.getAllForMobile = function (req, res, next) {
        function queryRun(query) {
            const {
                session: {uId : personnelId} = {uId: null}
            } = req;
            const {
                page,
                count,
                parentId = null,
                sortBy,
                sortOrder
            } = query;
            const skip = (page - 1) * count;
            getAllDocs({
                skip,
                count,
                parentId,
                personnelId,
                sortBy,
                sortOrder
            }, (err, response) => {
                if (err) {
                    return next(err);
                }
                
                if (response.total === 0) {
                    return next({status: 200, body: response});
                }
                
                const fileIds = [];
                const options = {
                    data: {}
                };
                
                response.data = _.map(response.data, function (elem) {
                    if (elem.title) {
                        elem.title = _.unescape(elem.title);
                    }
                    
                    if (elem.attachment) {
                        fileIds.push(elem.attachment._id);
                    }
                    
                    return elem;
                });
                
                options.data[CONTENT_TYPES.FILES] = fileIds;
                
                getImagesHelper.getImages(options, function (err, result) {
                    if (err) {
                        return next(err);
                    }
    
                    const fieldNames = {};
                    const setOptions = {
                        response  : response,
                        imgsObject: result
                    };
    
                    fieldNames[CONTENT_TYPES.FILES] = ['attachment'];
                    setOptions.fields = fieldNames;
    
                    getImagesHelper.setIntoResult(setOptions, function (response) {
        
                        next({status: 200, body: response});
                    });
                });
            })
        }
        
        access.getReadAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed) {
            if (err) {
                return next(err);
            }
            
            if (!allowed) {
                return errorSender.forbidden(next);
            }
            
            joiValidate(req.query, req.session.level, CONTENT_TYPES.DOCUMENTS, 'read', function (err, query) {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }
                
                queryRun(query);
            });
        });
    };
    
    // mobile only
    this.getAllForSync = function (req, res, next) {
        function queryRun(query) {
            const {
                session: {uId : personnelId} = {uId: null}
            } = req;
            const {
                lastLogOut
            } = query;
            getAllDocs({
                personnelId,
                lastLogOut
            }, (err, response) => {
                if (err) {
                    return next(err);
                }
                
                if (response.total === 0) {
                    return next({status: 200, body: response});
                }
                
                const fileIds = [];
                const options = {
                    data: {}
                };
                
                response.data = _.map(response.data, function (elem) {
                    if (elem.title) {
                        elem.title = _.unescape(elem.title);
                    }
                    
                    if (elem.attachment) {
                        fileIds.push(elem.attachment._id);
                    }
                    
                    return elem;
                });
                
                options.data[CONTENT_TYPES.FILES] = fileIds;
                
                getImagesHelper.getImages(options, function (err, result) {
                    if (err) {
                        return next(err);
                    }
    
                    const fieldNames = {};
                    const setOptions = {
                        response  : response,
                        imgsObject: result
                    };
    
                    fieldNames[CONTENT_TYPES.FILES] = ['attachment'];
                    setOptions.fields = fieldNames;
                    
                    getImagesHelper.setIntoResult(setOptions, function (response) {
    
                        next({status: 200, body: response});
                    });
                });
            })
        }
        
        access.getReadAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed) {
            if (err) {
                return next(err);
            }
    
            if (!allowed) {
                return errorSender.forbidden(next);
            }
    
            joiValidate(req.query, req.session.level, CONTENT_TYPES.DOCUMENTS, 'sync', function (err, query) {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }
        
                queryRun(query);
            });
        });
    };
    
    
    // ===================================================
    
    this.archive = function (req, res, next) {
        function queryRun() {
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var uId = req.session.uId;
            var editedBy = {
                user: req.session.uId,
                date: new Date()
            };
            var type = ACTIVITY_TYPES.ARCHIVED
            var options;
    
            function getContractsSecondary(parallelCb) {
                ContractSecondaryModel.find({documents: {$in: idsToArchive}}, function (err, collection) {
                    if (err) {
                        return parallelCb(err);
                    }
                    if (collection && collection.length) {
                        return parallelCb(null, true);
                    }
                    parallelCb(null, false);
                });
            }
    
            function getContractsYearly(parallelCb) {
                ContractYearlyModel.find({documents: {$in: idsToArchive}}, function (err, collection) {
                    if (err) {
                        return parallelCb(err);
                    }
                    if (collection && collection.length) {
                        return parallelCb(null, true);
                    }
                    parallelCb(null, false);
                });
            }
    
            async.parallel([getContractsSecondary, getContractsYearly],
                function (err, result) {
                    var error;
    
                    if (err) {
                        return next(err);
                    }
                    if (result && result.length && (result[0] || result[1])) {
                        error = new Error();
                        error.status = 403;
                        error.message = 'Document is in use';
    
                        return next(error);
                    }
                    options = [
                        {
                            idsToArchive   : idsToArchive,
                            keyForCondition: '_id',
                            archived       : archived,
                            model          : DocumentModel
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
                            // event.emit('activityChange', {
                            //     module    : 42,
                            //     actionType: type,
                            //     createdBy : editedBy,
                            //     itemId    : item,
                            //     itemType  : CONTENT_TYPES.DOCUMENTS
                            // });
                            callback();
    
                        }, function (err) {
                            if (err) {
                                logWriter.log('document archived error', err);
                            }
                        });
                        res.status(200).send();
                    });
                });
        }
        
        access.getArchiveAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                return errorSender.forbidden(next);
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
            $match: {
                _id: id
            }
        });
        
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}}
        }));
        
        pipeLine.push({
            $group: {
                _id         : '$_id',
                title       : {$first: '$title'},
                contentType : {$first: '$contentType'},
                originalName: {$first: '$originalName'},
                attachments : {$first: '$attachments'},
                editedBy    : {$first: '$editedBy'},
                createdBy   : {$first: '$createdBy'}
            }
        });
        
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
            
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    creationDate: '$createdBy.date',
                    updateDate  : '$editedBy.date'
                })
            });
        }
        
        aggregation = DocumentModel.aggregate(pipeLine);
        
        aggregation.options = {
            allowDiskUse: true
        };
        
        aggregation.exec(function (err, response) {
            var options = {
                data: {}
            };
            var personnelIds = [];
            var fileIds = [];
            if (err) {
                return callback(err);
            }
            
            if (!response || !response.length) {
                return callback(null, response);
            }
            response = response[0];
            
            if (response.title) {
                response.title = _.unescape(response.title);
            }
            
            personnelIds.push(response.createdBy.user._id);
            fileIds.push(response._id);
            
            options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
            options.data[CONTENT_TYPES.DOCUMENTS] = fileIds;
            
            getImagesHelper.getImages(options, function (err, result) {
                var fieldNames = {};
                var setOptions;
                if (err) {
                    return callback(err);
                }
                
                setOptions = {
                    response  : response,
                    imgsObject: result
                };
                fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                fieldNames[CONTENT_TYPES.DOCUMENTS] = [];
                setOptions.fields = fieldNames;
                
                getImagesHelper.setIntoResult(setOptions, function (response) {
                    response.attachments = {
                        contentType : response.contentType,
                        _id         : response.attachments,
                        preview     : response.preview,
                        originalName: response.originalName
                    };
                    
                    delete response.preview;
                    delete response.contentType;
                    delete response.originalName;
                    
                    callback(null, response);
                })
            });
        });
    };
    
    this.createDocIfNewContract = function (user_Id, _files, callback) {
        var files = _files;
        var userId = user_Id;
        var model;
        var titles = Object.keys(files);
        
        var files_Ids;
        
        async.waterfall([
            function (wtfCb) {
                fileHandler.uploadFile(userId, files, CONTENT_TYPES.DOCUMENTS, function (err, fileIds) {
                    if (err) {
                        return wtfCb(err);
                    }
                    files_Ids = fileIds;
                    return wtfCb(null, fileIds);
                });
            },
            function (fileIds, wtfCb) {
                fileHandler.getByIds(fileIds, userId, function (err, result) {
                    if (err) {
                        return wtfCb(err);
                    }
                    return wtfCb(null, result);
                });
            },
            function (fileModels, wtfCb) {
                var i = 0;
                var arrOfDocId = [];
    
                function iterator(item, callback) {
                    model = new DocumentModel({
                        attachments : item._id,
                        createdBy   : {
                            user: userId,
                            date: new Date()
                        },
                        editedBy    : {
                            user: userId,
                            date: new Date()
                        },
                        title       : titles[i],
                        preview     : (item.preview || item.type),
                        contentType : item.contentType,
                        originalName: item.originalName
                    });
                    model.save(function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        arrOfDocId.push(result._id);
                        return callback();
                    });
                    i++;
                }
    
                async.each(fileModels, iterator, function (err) {
                    if (err) {
                        return wtfCb(err);
                    }
                    return wtfCb(null, arrOfDocId);
                });
            }
        ], function (err, result) {
            if (err) {
                return callback(err);
            }
            
            return callback(null, result);
        });
    };
};

module.exports = Documents;
