const async = require('async');
const FileHandler = require('../handlers/file');
const getAwsLinks = require('../reusableComponents/getAwsLinkForAttachmentsFromModel');
const FileModel = require('../types/file/model');
const extractBody = require('./../utils/extractBody');
const ActivityLog = require('./../stories/push-notifications/activityLog');
const logger = require('./../utils/logger');

var Note = function () {
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var NoteModel = require('./../types/note/model');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var Archiver = require('../helpers/archiver');
    var archiver = new Archiver(NoteModel);
    var ObjectId = mongoose.Types.ObjectId;
    var access = require('../helpers/access')();
    var bodyValidator = require('../helpers/bodyValidator');

    const fileHandler = new FileHandler();

    var self = this;
    
    var $defProjection = {
        _id        : 1,
        createdBy  : 1,
        editedBy   : 1,
        title      : 1,
        description: 1,
        archived   : 1,
        deleted    : 1,
        theme      : 1,
        attachments: 1
    };

    function getAllPipeline(options) {
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
        var currentUserId = options.currentUserId;

        const matchObj = {
            $match: {
                'createdBy.user': ObjectId(currentUserId)
            }
        };
        
        // mobile needs to know which notes are deleted when sync
        if(!isMobile || (isMobile && !forSync)){
            matchObj.$match.deleted = false;
        }
        
        pipeLine.push(matchObj);

        pipeLine.push({
            $match: queryObject
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter
            });
        }

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
                        lastName : 1,
                        imageSrc: 1,
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
                        lastName  : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'editedBy.user',
                isArray        : false,
                addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
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
                            lastName : 1,
                            imageSrc: 1,
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
                            lastName  : 1,
                            imageSrc: 1,
                        }
                    }
                }
            }));
        }

        pipeLine.push(...aggregateHelper.aggregationPartMaker({
            from : CONTENT_TYPES.FILES,
            key : 'attachments',
            isArray: true,
            addProjection : ['_id', 'name', 'originalName', 'preview']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit
        }));

        return pipeLine;
    }

    const removeNote = (options, callback) => {
        const {
            actionOriginator,
            accessRoleLevel,
            setId,
        } = options;
        const now = new Date();
        const update = {
            deleted: true,
            'createdBy.date': now,
        };

        async.each(setId, (id, eachCb) => {
            NoteModel.findByIdAndUpdate(id, update, { new: true }, (err, note) => {
                if (err) {
                    return callback(err);
                }

                ActivityLog.emit('note:deleted', {
                    actionOriginator,
                    accessRoleLevel,
                    body: note.toJSON(),
                });

                eachCb();
            });
        }, (err) => {
            if (err) {
                return callback(err);
            }

            callback(null);
        });
    }

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const isMobile = req.isMobile;

        const queryRun = (body, callback) => {
            async.waterfall([

                (cb) => {
                    const files = req.files;

                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.NOTES, (err, setFileId) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, setFileId);
                    });
                },

                (serFileId, cb) => {
                    const createdBy = {
                        user: userId,
                        date: new Date(),
                    };
                    const noteData = {
                        attachments: serFileId,
                        description: body.description,
                        theme: body.theme,
                        createdBy,
                        editedBy: createdBy,
                        title: body.title,
                    };

                    if (body.title) {
                        noteData.title = _.escape(body.title);
                    }
                    if (body.theme) {
                        noteData.theme = _.escape(body.theme);
                    }
                    if (body.description) {
                        noteData.description = _.escape(body.description);
                    }

                    const note = new NoteModel(noteData);

                    note.set(noteData);
                    note.save((err, model) => {
                        cb(err, model);
                    });
                },

                (note, cb) => {
                    ActivityLog.emit('note:created', {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body: note.toJSON(),
                    });

                    const id = note.get('_id');

                    self.getByIdAggr({
                        id,
                        isMobile,
                    }, cb);
                },

                (note, cb) => {
                    getAwsLinks(note, cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.NOTE, cb);
            },

            (allowed, personnel, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.NOTES, 'create', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(result);
        });
    };

    this.update = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const isMobile = req.isMobile;
        const noteId = req.params.id;

        const queryRun = (updateObject, callback) => {
            const setToDelete = updateObject.filesToDelete;

            async.waterfall([

                (cb) => {
                    NoteModel.findOne({ _id: noteId }).lean().exec(cb);
                },

                (note, cb) => {
                    async.waterfall([

                        (cb) => {
                            if (!note) {
                                const error = new Error('Note not found');

                                error.status = 400;
                                return cb(error);
                            }

                            if (!setToDelete || !setToDelete.length) {
                                return cb(null);
                            }

                            async.each(setToDelete, (fileId, eachCb) => {
                                async.waterfall([

                                    (cb) => {
                                        FileModel.findByIdAndRemove(fileId, cb);
                                    },

                                    (file, cb) => {
                                        if (!file) {
                                            return cb(null);
                                        }

                                        const fileName = file.get('name');

                                        fileHandler.deleteFile(fileName, CONTENT_TYPES.NOTES, cb);
                                    },

                                ], eachCb);
                            }, cb);
                        },

                        (cb) => {
                            const files = req.files;

                            fileHandler.uploadFile(userId, files, CONTENT_TYPES.NOTES, cb);
                        },

                        (setFileId, cb) => {
                            const setExistingFileId = note.attachments.map(objectId => objectId.toString());
                            const createdBy = {
                                user: ObjectId(userId),
                                date: new Date(),
                            };
                            const attachments = isMobile ? setFileId : [
                                /*
                                * in CMS user has possibility to remove several existing attachments
                                * and add merge with few new
                                * */
                                ..._.without(setExistingFileId, ...setToDelete),
                                ...setFileId.map(objectId => objectId.toString()),
                            ];

                            const update = {
                                attachments,
                                createdBy,
                                editedBy: createdBy,
                            };

                            if (updateObject.title) {
                                update.title = _.escape(updateObject.title);
                            }

                            if (updateObject.theme) {
                                update.theme = _.escape(updateObject.theme);
                            }

                            if (updateObject.description) {
                                update.description = _.escape(updateObject.description);
                            }

                            NoteModel.findOneAndUpdate({ _id: noteId }, update, { new: true }, cb);
                        },

                        (note, cb) => {
                            ActivityLog.emit('note:updated', {
                                actionOriginator: userId,
                                accessRoleLevel,
                                body: note.toJSON(),
                            });

                            self.getByIdAggr({
                                id: note._id,
                                isMobile,
                            }, cb);
                        },

                        (note, cb) => {
                            getAwsLinks(note, cb);
                        },

                    ], cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getEditAccess(req, ACL_MODULES.NOTE, cb);
            },

            (allowed, personnel, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.NOTES, 'update', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(result);
        });
    };

    this.getAll = function (req, res, next) {
        function queryRun() {
            var currentUserId = req.session.uId;
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
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'createdBy.user.accessRole.name.en',
                'createdBy.user.accessRole.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar',
                'title',
                'theme',
                'description'
            ];

            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.NOTES,
                filter     : filter
            });

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            if (queryObject.personnel) {
                queryObject['createdBy.user'] = queryObject.personnel;
                delete queryObject.personnel;
            }

            pipeLine = getAllPipeline({
                currentUserId    : currentUserId,
                aggregateHelper  : aggregateHelper,
                queryObject      : queryObject,
                positionFilter   : positionFilter,
                isMobile         : req.isMobile,
                searchFieldsArray: searchFieldsArray,
                filterSearch     : filterSearch,
                skip             : skip,
                limit            : limit
            });

            aggregation = NoteModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    if (element.attachments) {
                        element.attachments.forEach((file) => {
                            file.url = fileHandler.computeUrl(file.name);
                        });
                    }

                    if (element.title) {
                        element.title = _.unescape(element.title);
                    }

                    if (element.theme) {
                        element.theme = _.unescape(element.theme);
                    }

                    if (element.description) {
                        element.description = _.unescape(element.description);
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.NOTE, function (err, allowed) {
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
            var currentUserId = req.session.uId;
            var query = req.query;
            var filter = query.filter || {};
            var lastLogOut = new Date(query.lastLogOut);
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var queryObject;
            var pipeLine;
            var aggregation;
            var positionFilter = {};
            
            delete filter.globalSearch;
            
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.NOTES,
                filter     : filter
            });
            
            aggregateHelper = new AggregationHelper($defProjection, queryObject);
            
            aggregateHelper.setSyncQuery(queryObject, lastLogOut);
            
            if (queryObject.personnel) {
                queryObject['createdBy.user'] = queryObject.personnel;
                delete queryObject.personnel;
            }
            
            pipeLine = getAllPipeline({
                currentUserId  : currentUserId,
                aggregateHelper: aggregateHelper,
                queryObject    : queryObject,
                positionFilter : positionFilter,
                isMobile       : req.isMobile,
                forSync        : true
            });
            
            aggregation = NoteModel.aggregate(pipeLine);
            
            aggregation.options = {
                allowDiskUse: true
            };
            
            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    if (element.attachments) {
                        element.attachments.forEach((file) => {
                            file.url = fileHandler.computeUrl(file.name);
                        });
                    }
                    if (element.title) {
                        element.title = _.unescape(element.title);
                    }
                    if (element.theme) {
                        element.theme = _.unescape(element.theme);
                    }
                    if (element.description) {
                        element.description = _.unescape(element.description);
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }
        
        access.getReadAccess(req, ACL_MODULES.NOTE, function (err, allowed) {
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
                model: NoteModel,
            }];
            const activityType = archived ? 'archived' : 'unarchived';

            async.waterfall([

                (cb) => {
                    archiver.archive(userId, options, cb);
                },

                (done, cb) => {
                    callback();

                    NoteModel.find({
                        _id: {
                            $in: setIdToArchive,
                        },
                    }).lean().exec(cb);
                },

                (setItem, cb) => {
                    async.each(setItem, (item, eachCb) => {
                        ActivityLog.emit(`note:${activityType}`, {
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
                access.getArchiveAccess(req, ACL_MODULES.NOTE, cb);
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

    this.deleteMany = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const setId = req.body.ids || [];

        removeNote({
            actionOriginator: userId,
            accessRoleLevel,
            setId,
        }, (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send({});
        });
    };

    this.delete = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const id = req.params.id;

        removeNote({
            actionOriginator: userId,
            accessRoleLevel,
            setId: [id],
        }, (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send({});
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

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.NOTE, function (err, allowed) {
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
            $match: {_id: id}
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: {createdBy: {date: 1}}
        }));

        if (!isMobile) {
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
                            lastName : 1,
                            imageSrc: 1,
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
                            lastName  : 1,
                            imageSrc: 1,
                        }
                    }
                }
            }));
        }

        pipeLine.push(...aggregateHelper.aggregationPartMaker({
            from : CONTENT_TYPES.FILES,
            key : 'attachments',
            isArray: true,
            addProjection : ['_id', 'name', 'originalName', 'preview']
        }));

        aggregation = NoteModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec((err, response) => {
            if (err) {
                return callback(err);
            }

            const body = response.length ? response[0] : {};

            if (body.title) {
                body.title = _.unescape(body.title);
            }

            if (body.theme) {
                body.theme = _.unescape(body.theme);
            }

            if (body.description) {
                body.description = _.unescape(body.description);
            }

            callback(null, body);
        });
    };
};

module.exports = Note;
