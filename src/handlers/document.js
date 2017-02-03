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
    
    function getAllPipelineOld(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var pipeLine = [];

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

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter
            });
        }

        pipeLine.push({
            $group: {
                _id         : '$_id',
                title       : {$first: '$title'},
                attachments : {$first: '$attachments'},
                contentType : {$first: '$contentType'},
                originalName: {$first: '$originalName'},
                editedBy    : {$first: '$editedBy'},
                createdBy   : {$first: '$createdBy'},
                archived    : {$first: '$archived'}
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

            /*pipeLine.push({
             $project: aggregateHelper.getProjection({
             creationDate: '$createdBy.date',
             updateDate  : '$editedBy.date'
             })
             });*/
        }

        /*if (!forSync) {
         pipeLine.push({
         $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
         });
         }

         pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

         if (limit && limit !== -1) {
         pipeLine.push({
         $skip: skip
         });

         pipeLine.push({
         $limit: limit
         });
         }

         pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit,
            creationDate     : true
        }));

        return pipeLine;
    }
    
    // projectTotal option needs for getAll method
    function getMainPipeline(options) {
        let pipeLine = [];
        
        pipeLine.push({
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
            $project: {
                _id        : 1,
                total      : 1,
                title      : 1,
                type       : 1,
                deleted    : 1,
                archived   : 1,
                attachment : 1,
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
                attachment : 1,
                parent     : {
                    $ifNull: ['$parent', null]
                }
            }
        });
        
        return pipeLine;
    }
    
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
                attachment : 1,
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
    
    const getByParent = (options, cb) => {
        const {
            parentId = null,
            personnelId = null,
            sortBy = 'createdAt',
            sortOrder = -1,
            skip = 0,
            count = 20,
            search = ''
        } = options;
        
        const pipeLine = [{
            $match: {
                parent          : typeof parentId === 'string' ? ObjectId(parentId) : parentId,
                'createdBy.user': ObjectId(personnelId)
                
            }
        }];
        
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
            const {
                session: {uId : userId} = {uId: null}
            } = req;
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
            let body;

            if (err) {
                return next(err);
            }
            
            if (!allowed) {
                errorSender.forbidden(next);
            }
            
            try {
                if (typeof req.body === 'string') {
                    body = JSON.parse(req.body);
                } else {
                    body = req.body;
                }
            } catch (err) {
                return next(err);
            }
            
            // bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.DOCUMENTS, 'create', (err, saveData) => {
            //     if (err) {
            //         return next(err);
            //     }
            //
            //     queryRun(saveData);
            // });
            queryRun(body);
        });
    };

    this.update = function (req, res, next) {
        function queryRun(updateObject) {
            var session = req.session;
            var userId = session.uId;
            var documentId = req.params.id;

            async.waterfall([
                function (cb) {
                    if (updateObject.title) {
                        updateObject.title = _.escape(updateObject.title);
                    }

                    updateObject.editedBy = {
                        user: ObjectId(userId),
                        date: new Date()
                    };

                    DocumentModel.findByIdAndUpdate(documentId, updateObject, function (err, result) {
                        if (err) {
                            return cb(err);
                        }
                        // event.emit('activityChange', {
                        //     module    : 42,
                        //     actionType: ACTIVITY_TYPES.UPDATED,
                        //     createdBy : updateObject.editedBy,
                        //     itemId    : documentId,
                        //     itemType  : CONTENT_TYPES.DOCUMENTS
                        // });

                        cb(null, result._id);
                    });
                },
                function (id, cb) {
                    self.getByIdAggr({id: id, isMobile: req.isMobile}, cb);
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getEditAccess(req, 42, function (err, allowed) {
            var updateObject;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            try {
                if (req.body.data) {
                    updateObject = JSON.parse(req.body.data);
                } else {
                    updateObject = req.body;
                }
            } catch (err) {
                return next(err);
            }

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.DOCUMENTS, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun(uid) {
            var query = req.query;
            var isMobile = req.isMobile;
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var sort = {'createdBy.date': -1};
            var filter = query.filter || {};
            var queryObject;
            var pipeLine;
            var aggregation;
            var ids;

            delete filter.globalSearch;
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.DOCUMENTS,
                filter     : filter
            });
            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }

            queryObject['createdBy.user'] = ObjectId(uid);

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = getAllPipeline({
                queryObject    : queryObject,
                aggregateHelper: aggregateHelper,
                sort           : sort,
                query          : query,
                isMobile       : isMobile,
                forSync        : true
            });

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
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                if (response && response.data && response.data.length) {
                    response.data = _.map(response.data, function (model) {
                        if (model.title) {
                            model.title = _.unescape(model.title);
                        }

                        personnelIds.push(model.createdBy.user._id);
                        fileIds.push(model._id);

                        return model;
                    });
                }

                personnelIds = _.uniqBy(personnelIds, 'id');
                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.DOCUMENTS] = fileIds;

                getImagesHelper.getImages(options, function (err, result) {
                    var fieldNames = {};
                    var setOptions;
                    if (err) {
                        return next(err);
                    }

                    setOptions = {
                        response  : response,
                        imgsObject: result
                    };
                    fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                    fieldNames[CONTENT_TYPES.DOCUMENTS] = [];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        response.data = _.map(response.data, function (element) {
                            element.attachments = {
                                contentType : element.contentType,
                                _id         : element.attachments,
                                preview     : element.preview,
                                originalName: element.originalName
                            };

                            delete element.preview;
                            delete element.contentType;
                            delete element.originalName;

                            return element;
                        });
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun(req.session.uId);
        });
    };
    
    this.getAll_old = function (req, res, next) {
        function queryRun(uid) {
            var query = req.query;
            var filter = query.filter || {};
            var page = query.page || 1;
            var contentType = query.contentType;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var pipeLine;
            var aggregation;
            var positionFilter = {};

            var searchFieldsArray = [
                'title',
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'createdBy.user.accessRole.name.en',
                'createdBy.user.accessRole.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar'
            ];

            delete filter.globalSearch;

            queryObject = query.filter ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.DOCUMENTS,
                filter     : filter
            }) : {};

            if (!filter.hasOwnProperty('archived')) {
                queryObject.archived = false;
            }

            if (queryObject.personnel) {
                queryObject['createdBy.user'] = queryObject.personnel;
                delete queryObject.personnel;
            }

            queryObject['createdBy.user'] = ObjectId(uid);

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {
                    $or: [
                        {
                            'createdBy.user.position': queryObject.position
                        }
                    ]
                };

                delete queryObject.position;
            }

            aggregateHelper = new AggregationHelper($defProjection);

            pipeLine = getAllPipeline({
                aggregateHelper  : aggregateHelper,
                queryObject      : queryObject,
                positionFilter   : positionFilter,
                isMobile         : req.isMobile,
                searchFieldsArray: searchFieldsArray,
                filterSearch     : filterSearch,
                skip             : skip,
                limit            : limit
            });

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
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                if (response && response.data && response.data.length) {
                    response.data = _.map(response.data, function (model) {
                        if (model.title) {
                            model.title = _.unescape(model.title);
                        }

                        personnelIds.push(model.createdBy.user._id);
                        fileIds.push(model._id);

                        return model;
                    });
                }

                personnelIds = _.uniqBy(personnelIds, 'id');
                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.DOCUMENTS] = fileIds;

                getImagesHelper.getImages(options, function (err, result) {
                    var fieldNames = {};
                    var setOptions;
                    if (err) {
                        return next(err);
                    }

                    setOptions = {
                        response  : response,
                        imgsObject: result
                    };
                    fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                    fieldNames[CONTENT_TYPES.DOCUMENTS] = [];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        response.data = _.map(response.data, function (element) {
                            element.attachments = {
                                contentType : element.contentType,
                                _id         : element.attachments,
                                preview     : element.preview,
                                originalName: element.originalName
                            };

                            delete element.preview;
                            delete element.contentType;
                            delete element.originalName;

                            return element;
                        });
                        next({status: 200, body: response});
                    });
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun(req.session.uId);
        });
    };
    
    this.getAll = function (req, res, next) {
        function queryRun() {
            const {
                session: {uId : personnelId} = {uId: null}
            } = req;
            const {
                skip = 0,
                count = 10,
                parentId = null,
                sortBy = 'createdAt',
                sortOrder = -1,
                search = '',
            } = req.query;
            
            getByParent({
                skip,
                count,
                parentId,
                personnelId,
                sortBy,
                sortOrder,
                search
            }, (err, result) => {
                if (err) {
                    return next(err);
                }
                
                if (result.total === 0) {
                    res.status(200).send(result);
                }
                
                const fileIds = [];
                const options = {
                    data: {}
                };
                
                result.data = _.pluck(result.data, function (elem) {
                    if (elem.title) {
                        elem.title = _.unescape(elem.title);
                    }
                    
                    if (elem.attachment) {
                        fileIds.push(elem.attachment._id);
                    }
                    
                    return elem;
                });
                
                options.data[CONTENT_TYPES.DOCUMENTS] = fileIds;
                
                getImagesHelper.getImages(options, function (err, result) {
                    if (err) {
                        return next(err);
                    }
    
                    const fieldNames = {};
                    let setOptions = {
                        response  : response,
                        imgsObject: result
                    };
                    fieldNames[CONTENT_TYPES.DOCUMENTS] = [];
                    
                    setOptions.fields = fieldNames;
                    
                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        response.data = _.map(response.data, function (element) {
                            element.attachment = {
                                contentType : element.contentType,
                                _id         : element.attachment,
                                preview     : element.preview,
                                originalName: element.originalName
                            };
                            
                            delete element.preview;
                            delete element.contentType;
                            delete element.originalName;
                            
                            return element;
                        });
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
                err = new Error();
                err.status = 403;
                
                return next(err);
            }
            
            queryRun();
        });
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);
            var isMobile = req.isMobile;

            self.getByIdAggr({id: id, isMobile: isMobile}, function (err, result) {
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
                err = new Error();
                err.status = 403;

                return next(err);
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
