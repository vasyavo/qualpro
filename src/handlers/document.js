const async = require('async');
const _ = require('lodash');
const mongoose = require('mongoose');

const logger = require('../utils/logger');
const ActivityLog = require('./../stories/push-notifications/activityLog');

const ACL_MODULES = require('../constants/aclModulesNames');
const CONTENT_TYPES = require('../public/js/constants/contentType');
const ERROR_MESSAGES = require('../constants/errorMessages');

const DocumentModel = require('./../types/document/model');
const ContractYearlyModel = require('./../types/contractYearly/model');
const ContractSecondaryModel = require('./../types/contractSecondary/model');
const FileHandler = require('../handlers/file');
const errorSender = require('../utils/errorSender');
const joiValidate = require('../helpers/joiValidate');
const access = require('../helpers/access')();

const fileHandler = new FileHandler();
const ObjectId = mongoose.Types.ObjectId;

const Documents = function () {
    // projectTotal option needs for getAll method
    const getMainPipeline = () => {
        const pipeLine = [{
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'breadcrumbs',
                as          : 'breadcrumbs',
            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
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
                    title: 1,
                },
            },
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
                    $push: '$breadcrumbs',
                },
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'parent',
                as          : 'parent',
            },
        }, {
            $unwind: {
                path                      : '$parent',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'createdBy.user',
                as          : 'createdBy.user',
            },
        }, {
            $unwind: {
                path                      : '$createdBy.user',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'editedBy.user',
                as          : 'editedBy.user',
            },
        }, {
            $unwind: {
                path                      : '$editedBy.user',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'files',
                foreignField: '_id',
                localField  : 'attachment',
                as          : 'attachment',
            },
        }, {
            $unwind: {
                path                      : '$attachment',
                preserveNullAndEmptyArrays: true,
            },
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
                    extension   : 1,
                    preview     : 1,
                },
                breadcrumbs: 1,
                createdBy  : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1,
                        imageSrc : 1,
                    },
                },
                editedBy   : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1,
                        imageSrc : 1,
                    },
                },
                parent     : {
                    _id  : 1,
                    title: 1,
                },
            },
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
                    $ifNull: ['$attachment', null],
                },
                parent     : {
                    $ifNull: ['$parent', null],
                },
            },
        }];

        return pipeLine;
    };

    const getById = (_id, cb) => {
        const pipeLine = [{
            $match: {
                _id: ObjectId(_id),

            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'breadcrumbs',
                as          : 'breadcrumbs',
            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
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
                    title: 1,
                },
            },
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
                    $push: '$breadcrumbs',
                },
            },
        }, {
            $lookup: {
                from        : 'files',
                foreignField: '_id',
                localField  : 'attachment',
                as          : 'attachment',
            },
        }, {
            $unwind: {
                path                      : '$attachment',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'parent',
                as          : 'parent',
            },
        }, {
            $unwind: {
                path                      : '$parent',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'createdBy.user',
                as          : 'createdBy.user',
            },
        }, {
            $unwind: {
                path                      : '$createdBy.user',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'editedBy.user',
                as          : 'editedBy.user',
            },
        }, {
            $unwind: {
                path                      : '$editedBy.user',
                preserveNullAndEmptyArrays: true,
            },
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
                        lastName : 1,
                        imageSrc : 1,
                    },
                },
                editedBy   : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1,
                        imageSrc : 1,
                    },
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
                    title: 1,
                },
            },
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
                    $ifNull: ['$attachment', null],
                },
                parent     : {
                    $ifNull: ['$parent', null],
                },
            },
        }];

        DocumentModel.aggregate(pipeLine).allowDiskUse(true).exec((err, docs) => {
            if (err) {
                return cb(err);
            }

            const result = docs && docs.length ? docs[0] : null;

            if (!result) {
                return errorSender.badRequest(cb, 'Document not found');
            }

            cb(null, result);
        });
    };

    const getByIds = (_ids, cb) => {
        const pipeLine = [{
            $match: {
                _id: {$in: _ids},
            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'breadcrumbs',
                as          : 'breadcrumbs',
            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
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
                    title: 1,
                },
            },
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
                    $push: '$breadcrumbs',
                },
            },
        }, {
            $lookup: {
                from        : 'files',
                foreignField: '_id',
                localField  : 'attachment',
                as          : 'attachment',
            },
        }, {
            $unwind: {
                path                      : '$attachment',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'parent',
                as          : 'parent',
            },
        }, {
            $unwind: {
                path                      : '$parent',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'createdBy.user',
                as          : 'createdBy.user',
            },
        }, {
            $unwind: {
                path                      : '$createdBy.user',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'editedBy.user',
                as          : 'editedBy.user',
            },
        }, {
            $unwind: {
                path                      : '$editedBy.user',
                preserveNullAndEmptyArrays: true,
            },
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
                        lastName : 1,
                        imageSrc : 1,
                    },
                },
                editedBy   : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1,
                        imageSrc : 1,
                    },
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
                    title: 1,
                },
            },
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
                    $ifNull: ['$attachment', null],
                },
                parent     : {
                    $ifNull: ['$parent', null],
                },
            },
        }];

        DocumentModel.aggregate(pipeLine).allowDiskUse(true).exec((err, docs) => {
            if (err) {
                return cb(err);
            }

            const result = docs && docs.length ? {data: docs} : null;

            if (!result) {
                return errorSender.badRequest(cb, 'Documents not found');
            }

            cb(null, result);
        });
    };

    const getAllDocs = (options, cb) => {
        const pipeLine = [];
        const {
            isMobile = false,
            parentId = null,
            personnelId = null,
            lastLogOut = null,
            archived = false,
            filesOnly = false,
            sortBy = 'createdAt',
            sortOrder = -1,
            skip = 0,
            count = 20,
            filter = null,
        } = options;

        const matchObj = {
            $match: {
                'createdBy.user': ObjectId(personnelId),
            },
        };

        const search = filter ? filter.globalSearch : null;

        if (isMobile) {
            // for sync only
            if (lastLogOut) {
                matchObj.$match.$or = [
                    {
                        'createdBy.date': {
                            $gte: lastLogOut,
                        },
                    }, {
                        'editedBy.date': {
                            $gte: lastLogOut,
                        },
                    },
                ];
            }
        } else {
            if (filter && filter.time) {
                const fromDate = filter.time.values[0];
                const toDate = filter.time.values[1];
                matchObj.$match['createdBy.date'] = {
                    $gte: new Date(fromDate),
                    $lte: new Date(toDate),
                };
                matchObj.$match['editedBy.date'] = {
                    $gte: new Date(fromDate),
                    $lte: new Date(toDate),
                };
            }
            // web should not see deleted items
            matchObj.$match.deleted = false;

            // by default web fetching not archived docs
            matchObj.$match.archived = archived;

            // filesOnly using only for getRawFiles method
            // for retrieving all files when creating contracts
            // in other case just checking for parent
            if (filesOnly) {
                matchObj.$match.type = 'file';
            } else {
                // fix to allow search by nested files
                if (!search) {
                    matchObj.$match.parent = typeof parentId === 'string' ? ObjectId(parentId) : parentId;
                }
            }
        }

        pipeLine.push(matchObj);

        // search sor web only
        if (search) {
            const searchArr = search.split(' ')
                .filter(elem => elem)
                .map(elem => {
                    return {
                        title: {
                            $regex  : elem,
                            $options: 'xi',
                        },
                    };
                });

            pipeLine.push({
                $match: {
                    $or: searchArr,
                },
            });
        }

        pipeLine.push({
                $group: {
                    _id  : null,
                    total: {$sum: 1},
                    root : {$push: '$$ROOT'},
                },
            }, {
                $unwind: '$root',
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
                    total      : 1,
                },
            }, {
                $sort: {
                    [sortBy]: sortOrder,
                },
            }, {
                $skip: skip,
            }, {
                $limit: count,
            },
            ...getMainPipeline(),
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
                        },
                    },
                },
            }, {
                $project: {
                    _id  : 0,
                    total: '$_id',
                    data : '$root',
                },
            });

        DocumentModel.aggregate(pipeLine).allowDiskUse(true).exec((err, docs) => {
            if (err) {
                return cb(err);
            }

            const result = docs && docs.length ? docs[0] : null;

            cb(null, Object.assign({total: 0, data: []}, result));
        });
    };

    const getPopulatedBreadcrumbsByDocumentId = (id, cb) => {
        const _id = typeof id === 'string' ? ObjectId(id) : id;
        const pipeLine = [];

        pipeLine.push({
            $match: {
                _id,
            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'breadcrumbs',
                as          : 'breadcrumbs',
            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $group: {
                _id        : {
                    _id  : '$_id',
                    title: '$title',
                },
                breadcrumbs: {
                    $push: {
                        _id  : '$breadcrumbs._id',
                        title: '$breadcrumbs.title',
                    },
                },

            },
        }, {
            $project: {
                _id        : 0,
                breadcrumbs: {
                    $setDifference: [{
                        $setUnion: ['$breadcrumbs', [{_id: '$_id._id', title: '$_id.title'}]],
                    }, [null, {}]],
                },
            },
        });

        DocumentModel.aggregate(pipeLine).allowDiskUse(true).exec((err, docs) => {
            if (err) {
                return cb(err);
            }

            const result = docs && docs.length && docs[0] && docs[0].breadcrumbs;

            cb(null, result || []);
        });
    };

    const getBreadcrumbsIdsByParent = (parent, cb) => {
        let breadcrumbs = [];

        if (!parent) {
            return cb(null, breadcrumbs);
        }

        DocumentModel.findById(parent, (err, doc) => {
            if (err) {
                return cb(err);
            }

            if (!doc || doc.deleted) {
                return errorSender.badRequest(cb, 'Target folder is not found');
            }

            if (doc.type !== 'folder') {
                return errorSender.badRequest(cb, 'You can create document only inside folder');
            }

            breadcrumbs = [...doc.breadcrumbs, doc._id];

            cb(null, breadcrumbs);
        });
    };

    const updateAllChildDocuments = (parent, updateObj, callback) => {
        const id = typeof parent === 'string' ? ObjectId(parent) : parent;

        async.waterfall([

            (cb) => {
                DocumentModel.distinct('_id', {breadcrumbs: {$in: [id]}}, (err, setId) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, setId);
                });
            },

            (setId, cb) => {
                if (!setId || !setId.length) {
                    return cb(null, []);
                }

                DocumentModel.update({_id: {$in: setId}}, updateObj, (err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, setId);
                });
            },

        ], (err, setModifiedId) => {
            if (err) {
                return callback(err);
            }

            setModifiedId.push(id);

            callback(null, setModifiedId);
        });
    };

    const getChangedForMobile = (ids, cb) => {
        // const ids_ = ids;

        const pipeLine = [{
            $match: {
                _id: {
                    $in: ids,
                },
            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'breadcrumbs',
                as          : 'breadcrumbs',
            },
        }, {
            $unwind: {
                path                      : '$breadcrumbs',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $project: {
                _id        : 1,
                title      : 1,
                editedBy   : 1,
                archived   : 1,
                parent     : 1,
                breadcrumbs: {
                    _id  : 1,
                    title: 1,
                },
            },
        }, {
            $group: {
                _id        : '$_id',
                title      : {$first: '$title'},
                editedBy   : {$first: '$editedBy'},
                attachment : {$first: '$attachment'},
                parent     : {$first: '$parent'},
                archived   : {$first: '$archived'},
                breadcrumbs: {
                    $push: '$breadcrumbs',
                },
            },
        }, {
            $lookup: {
                from        : 'documents',
                foreignField: '_id',
                localField  : 'parent',
                as          : 'parent',
            },
        }, {
            $unwind: {
                path                      : '$parent',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'personnels',
                foreignField: '_id',
                localField  : 'editedBy.user',
                as          : 'editedBy.user',
            },
        }, {
            $unwind: {
                path                      : '$editedBy.user',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $project: {
                _id        : 1,
                title      : 1,
                breadcrumbs: 1,
                archived   : 1,
                editedBy   : {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1,
                    },
                },
                parent     : {
                    _id  : 1,
                    title: 1,
                },
            },
        }, {
            $project: {
                _id        : 1,
                title      : 1,
                editedBy   : 1,
                archived   : 1,
                breadcrumbs: 1,
                parent     : {
                    $ifNull: ['$parent', null],
                },
            },
        }];

        DocumentModel.aggregate(pipeLine).allowDiskUse(true).exec((err, data) => {
            if (err) {
                return cb(err);
            }

            cb(null, data || []);
        });
    };

    const getUpdatedBreadcrumbs = (old, newPart, parent) => {
        if (!parent) {
            return [...newPart];
        }

        const _old = old.fromObjectID();
        let index = _old.indexOf(parent.toString());

        if (index === -1) {
            index = 0;
        }

        return [...newPart, ...old.slice(index)];
    };

    const cutDocumentWithNested = (opt, cb) => {
        const {
            id,
            title,
            target,
            archive,
            personnelId,
            newBreadcrumbsPart,
        } = opt;

        const editedBy = {
            user: personnelId,
            date: new Date(),
        };

        async.waterfall([
            (cb) => {
                DocumentModel.findById(id, (err, model) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!model || model.deleted) {
                        return errorSender.badRequest(cb, 'Document not found');
                    }

                    const updateObj = {
                        parent     : target,
                        breadcrumbs: newBreadcrumbsPart,
                        editedBy,
                    };

                    if (typeof archive === 'boolean') {
                        updateObj.archived = archive;
                    }

                    if (title) {
                        updateObj.title = title;
                    }

                    DocumentModel.findByIdAndUpdate(id, updateObj, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, model);
                    });
                });
            },

            (model, cb) => {
                const parentId = model._id;

                if (model.type === 'file') {
                    return cb(null, [parentId]);
                }

                const findObj = {
                    deleted    : false,
                    breadcrumbs: {
                        $in: [parentId],
                    },
                };

                DocumentModel.find(findObj, '_id breadcrumbs', (err, models) => {
                    if (err) {
                        return cb(err);
                    }

                    async.each(models, (elem, eachCb) => {
                        const obj = {
                            editedBy,
                            breadcrumbs: getUpdatedBreadcrumbs(elem.breadcrumbs, newBreadcrumbsPart, parentId),
                        };

                        if (typeof archive === 'boolean') {
                            obj.archived = archive;
                        }

                        DocumentModel.findByIdAndUpdate(elem._id, obj, eachCb);
                    }, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        const updatedDocIds = models.map(el => el._id);
                        updatedDocIds.push(parentId);

                        cb(null, updatedDocIds);
                    });
                });
            },
        ], (err, modified) => {
            if (err) {
                return cb(err);
            }

            cb(null, modified);
        });
    };

    // copy child documents
    // return array of models with type folder
    // and array ids of created documents
    const copyChild = (parentModel, cb) => {
        const folderDocs = [];
        const newDocIds = [];

        DocumentModel.find({
            deleted: false,
            parent : parentModel.oldId,
        }).lean().exec((err, needToCopyModels) => {
            if (err) {
                return cb(err);
            }

            if (!needToCopyModels || !needToCopyModels.length) {
                return cb(null, [], []);
            }

            async.each(needToCopyModels, (oldModel, eachCb) => {
                const editedBy = {
                    user: oldModel.editedBy.user,
                    date: new Date(),
                };

                const createObj = {
                    archived   : oldModel.archived,
                    attachment : oldModel.attachment,
                    title      : oldModel.title,
                    type       : oldModel.type,
                    parent     : parentModel._id,
                    breadcrumbs: [...parentModel.breadcrumbs, parentModel._id],
                    createdBy  : editedBy,
                    editedBy,
                };

                DocumentModel.create(createObj, (err, newModel) => {
                    if (err) {
                        return eachCb(err);
                    }

                    if (newModel.type === 'folder') {
                        newModel.oldId = oldModel._id;
                        folderDocs.push(newModel);
                    }

                    newDocIds.push(newModel._id);

                    eachCb(null);
                });
            }, (err) => {
                if (err) {
                    return cb(err);
                }

                cb(null, folderDocs, newDocIds);
            });
        });
    };

    const copyDocumentWithNested = (opt, cb) => {
        const {
            id,
            title,
            target,
            personnelId,
            newBreadcrumbsPart,
        } = opt;

        const editedBy = {
            user: personnelId,
            date: new Date(),
        };

        async.waterfall([
            (cb) => {
                DocumentModel.findById(id).lean().exec((err, model) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!model || model.deleted) {
                        return errorSender.badRequest(cb, 'Document not found');
                    }

                    if (model.type === 'folder') {
                        return errorSender.badRequest(cb, 'Folder can\'t be copied');
                    }

                    const createObj = {
                        title      : title || model.title,
                        archived   : model.archived,
                        attachment : model.attachment,
                        type       : model.type,
                        parent     : target,
                        editedBy,
                        createdBy  : editedBy,
                        breadcrumbs: newBreadcrumbsPart,
                    };

                    DocumentModel.create(createObj, (err, newModel) => {
                        if (err) {
                            return cb(err);
                        }

                        newModel.oldId = model._id;

                        cb(null, newModel);
                    });
                });
            },

            (newModel, cb) => {
                const modified = [newModel._id];

                if (newModel.type === 'file') {
                    return cb(null, modified);
                }

                let parentModels = [newModel];

                async.whilst(
                    () => {  // <= condition func
                        return !!parentModels.length;
                    },

                    (callback) => { // <= iterator func
                        // here will be pushed folders for the next iteration
                        const tempParentModels = [];

                        async.each(parentModels, (parentModel, eachCb) => {
                            copyChild(parentModel, (err, folderDocs, changedIds) => {
                                if (err) {
                                    return eachCb(err);
                                }

                                tempParentModels.push(...folderDocs);
                                modified.push(...changedIds);

                                eachCb(null);
                            });
                        }, (err) => {
                            if (err) {
                                return callback(err);
                            }

                            parentModels = [...tempParentModels];
                            callback(null);
                        });
                    }, (err) => { // <= final cb
                        if (err) {
                            return cb(err);
                        }

                        cb(null, modified);
                    });
            },
        ], (err, modified) => {
            if (err) {
                return cb(err);
            }

            cb(null, modified);
        });
    };

    const fillImagesIntoResult = (body, cb) => {
        body.data.forEach(elem => {
            if (elem.title) {
                elem.title = _.unescape(elem.title);
            }
        });

        cb(null, body);
    };

    const getDocsForContracts = (options, callback) => {
        const {
            personnelId,
            contractId,
            contractType,
        } = options;

        async.waterfall([
            (cb) => {
                if (contractType === CONTENT_TYPES.CONTRACTSYEARLY) {
                    ContractYearlyModel.findOne(ObjectId(contractId), cb);
                } else {
                    ContractSecondaryModel.findOne(ObjectId(contractId), cb);
                }
            },
            (contract, cb) => {
                const pipeLine = [];

                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                _id: {
                                    $in: contract.documents,
                                },
                            },
                            {
                                'createdBy.user': ObjectId(personnelId),
                            },
                        ],
                    },
                });

                pipeLine.push({
                    $lookup: {
                        from        : 'files',
                        localField  : 'attachment',
                        foreignField: '_id',
                        as          : 'attachment',
                    },
                });

                pipeLine.push({
                    $addFields: {
                        attachment: {
                            $arrayElemAt: ['$attachment', 0],
                        },
                    },
                });

                pipeLine.push({
                    $match: {
                        attachment: {$ne: null},
                    },
                });

                DocumentModel.aggregate(pipeLine).allowDiskUse(true).exec(cb);
            },
        ], callback);
    };

    // ============== METHODS ==================

    this.create = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
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

            if (type === 'file' && !attachment) {
                return errorSender.badRequest(next, 'Document with type file, should have attachment');
            }

            async.waterfall([

                // if parent exist => check is valid and get breadcrumbs
                (cb) => {
                    getBreadcrumbsIdsByParent(parent, cb);
                },

                (breadcrumbs, cb) => {
                    const options = {
                        title     : _.escape(title),
                        attachment: type === 'file' ? attachment : null,
                        editedBy  : createdBy,
                        parent,
                        type,
                        breadcrumbs,
                        createdBy,
                    };

                    DocumentModel.create(options, (err, model) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, model);
                    });
                },

                (model, cb) => {
                    const isFile = model.type === 'file';
                    const eventPayload = {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body            : model.toJSON(),
                    };

                    if (isFile) {
                        ActivityLog.emit('documents:file-uploaded', eventPayload);
                    } else {
                        ActivityLog.emit('documents:folder-created', eventPayload);
                    }

                    getById(model._id, cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.DOCUMENT, cb);
            },

            (allowed, personnel, cb) => {
                joiValidate(req.body, accessRoleLevel, CONTENT_TYPES.DOCUMENTS, 'create', (err, body) => {
                    if (err) {
                        return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                    }

                    cb(null, body);
                });
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(result);
        });
    };

    this.update = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
            const id = req.params.id;
            const isMobile = req.isMobile;
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
                        'createdBy.user': userId,
                    };
                    const updateObj = {
                        title: _.escape(title),
                        editedBy,
                    };
                    const opt = {
                        new: true,
                    };

                    DocumentModel.findOneAndUpdate(findObj, updateObj, opt, (err, model) => {
                        if (err) {
                            return cb(err);
                        }

                        if (!model) {
                            return errorSender.badRequest(cb, 'Document not found');
                        }

                        const id = model._id;

                        if (model.type === 'folder') {
                            return updateAllChildDocuments(id, {editedBy}, (err, modified) => {
                                if (err) {
                                    logger.error(`Document: updating child documents error: ${err}`);

                                    return cb(err);
                                }

                                cb(null, modified);
                            });
                        }

                        cb(null, [id]);
                    });
                },

                (setModifiedId, cb) => {
                    ActivityLog.emit('documents:changes-applied', {
                        actionOriginator: userId,
                        accessRoleLevel,
                        items           : setModifiedId,
                    });

                    if (isMobile) {
                        // get all changed docs for mobile
                        return getChangedForMobile(setModifiedId, cb);
                    }

                    getById(id, cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.DOCUMENT, cb);
            },

            (allowed, personnel, cb) => {
                joiValidate(req.body, accessRoleLevel, CONTENT_TYPES.DOCUMENTS, 'update', (err, body) => {
                    if (err) {
                        return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                    }

                    cb(null, body);
                });
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.delete = function (req, res, next) {
        function queryRun(body) {
            const userId = req.session && req.session.uId;
            let {
                ids,
            } = body;
            const editedBy = {
                user: ObjectId(userId),
                date: new Date(),
            };

            ids = ids.objectID();

            async.waterfall([
                (cb) => {
                    const findObj = {
                        'createdBy.user': userId,
                        $or             : [
                            {
                                _id: {
                                    $in: ids,
                                },
                            }, {
                                breadcrumbs: {
                                    $in: ids,
                                },
                            },
                        ],

                    };

                    DocumentModel.distinct('_id', findObj, (err, items) => {
                        if (err) {
                            return cb(err);
                        }

                        if (!items || !items.length) {
                            return errorSender.badRequest(cb, 'Document not found');
                        }

                        cb(null, items);
                    });
                },

                (ids, cb) => {
                    const updateObj = {
                        deleted: true,
                        editedBy,
                    };

                    DocumentModel.update({_id: {$in: ids}}, updateObj, {multi: true}, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        // ToDo: push notification only for current user

                        cb(null, ids);
                    });
                },
            ], (err, data) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send({data});
            });
        }

        access.getWriteAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            joiValidate(req.body, req.session.level, CONTENT_TYPES.DOCUMENTS, 'remove', (err, body) => {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }

                queryRun(body);
            });
        });
    };

    this.archive = function (req, res, next) {
        function queryRun(body) {
            const personnelId = req.session && req.session.uId;
            const isMobile = req.isMobile;

            const {
                ids,
                archive,
                parent,
            } = body;

            async.waterfall([
                (cb) => {
                    if (!parent) {
                        return cb(null);
                    }

                    DocumentModel.findById(parent, (err, model) => {
                        if (err) {
                            return cb();
                        }

                        if (!model) {
                            return errorSender.badRequest(cb, 'Target folder is not found');
                        }

                        if (model.type !== 'folder') {
                            return errorSender.badRequest(cb, 'Target folder must be a folder');
                        }

                        if (model.archived !== archive) {
                            return errorSender.badRequest(cb, 'Target folder have wrong archived type');
                        }

                        cb(null);
                    });
                },

                (cb) => {
                    // get new part of breadcrumbs
                    // each modified document breadcrumbs will be begin from this breadcrumbs
                    getBreadcrumbsIdsByParent(parent, cb);
                },

                (newBreadcrumbsPart, cb) => {
                    const modified = [];

                    async.each(ids, (id, eachCb) => {
                        const opt = {
                            id,
                            archive,
                            target: parent,
                            personnelId,
                            newBreadcrumbsPart,
                        };

                        cutDocumentWithNested(opt, (err, updatedItems) => {
                            modified.push(...updatedItems);
                            eachCb(null);
                        });
                    }, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, modified);
                    });
                },

                (modified, cb) => {
                    if (isMobile) {
                        // get all changed docs for mobile

                        getChangedForMobile(modified, cb);
                    } else {
                        // get only parent directory that files are pasted in

                        getAllDocs({
                            archived: !!archive,
                            parentId: parent,
                            personnelId,
                        }, (err, response) => {
                            if (err) {
                                return cb(err);
                            }

                            if (response.total === 0) {
                                return cb(null, response);
                            }

                            fillImagesIntoResult(response, (err, result) => {
                                if (err) {
                                    return cb(err);
                                }

                                cb(null, result);
                            });
                        });
                    }
                },
            ], (err, modified) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(modified);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            joiValidate(req.body, req.session.level, CONTENT_TYPES.DOCUMENTS, 'archive', (err, body) => {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }

                queryRun(body);
            });
        });
    };

    this.move = function (req, res, next) {
        function queryRun(body) {
            const personnelId = req.session && req.session.uId;
            const isMobile = req.isMobile;

            const {
                ids,
                action,
                title,
                parent,
            } = body;

            if (ids && ids.length > 1 && title) {
                return errorSender.badRequest(next, 'You can set title only when moving exactly 1 item');
            }

            if (parent && ids.indexOf(parent) !== -1) {
                return errorSender.badRequest(next, 'You cannot paste files inside itself');
            }

            async.waterfall([
                (cb) => {
                    if (!parent) {
                        return cb(null);
                    }

                    DocumentModel.findById(parent, (err, model) => {
                        if (err) {
                            return cb();
                        }

                        if (!model || model.deleted) {
                            return errorSender.badRequest(cb, 'Target folder is not found');
                        }

                        if (model.type !== 'folder') {
                            return errorSender.badRequest(cb, 'Target folder must be a folder');
                        }

                        cb(null);
                    });
                },

                (cb) => {
                    // get new part of breadcrumbs
                    // each modified document breadcrumbs will be begin from this breadcrumbs
                    getBreadcrumbsIdsByParent(parent, cb);
                },

                (newBreadcrumbsPart, cb) => {
                    const modified = [];

                    async.each(ids, (id, eachCb) => {
                        const opt = {
                            id,
                            target: parent,
                            personnelId,
                            newBreadcrumbsPart,
                        };

                        if (action === 'cut') {
                            cutDocumentWithNested(opt, (err, updatedItems) => {
                                if (err) {
                                    return eachCb(err);
                                }

                                modified.push(...updatedItems);
                                eachCb(null);
                            });
                        } else {
                            copyDocumentWithNested(opt, (err, updatedItems) => {
                                if (err) {
                                    return eachCb(err);
                                }

                                modified.push(...updatedItems);
                                eachCb(null);
                            });
                        }
                    }, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, modified);
                    });
                },

                (modified, cb) => {
                    if (isMobile) {
                        // get all changed docs for mobile

                        getChangedForMobile(modified, cb);
                    } else {
                        // get only parent directory that files are pasted in

                        getAllDocs({
                            parentId: parent,
                            personnelId,
                        }, (err, response) => {
                            if (err) {
                                return cb(err);
                            }

                            if (response.total === 0) {
                                return cb(null, response);
                            }

                            fillImagesIntoResult(response, (err, result) => {
                                if (err) {
                                    return cb(err);
                                }

                                cb(null, result);
                            });
                        });
                    }
                },
            ], (err, modified) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(modified);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            joiValidate(req.body, req.session.level, CONTENT_TYPES.DOCUMENTS, 'move', (err, body) => {
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

            getById(id, (err, result) => {
                if (err) {
                    return next(err);
                }
                if (!result) {
                    return res.status(404);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                return errorSender.forbidden(next);
            }

            queryRun();
        });
    };

    this.getByIds = function (req, res, next) {
        function queryRun() {
            let ids = req.body.ids;
            if (ids && ids.length) {
                ids = ids.map((id) => {
                    return ObjectId(id);
                });

                getByIds(ids, (err, result) => {
                    if (err) {
                        return next(err);
                    }
                    if (!result) {
                        return res.status(404);
                    }

                    res.status(200).send(result);
                });
            } else {
                res.status(200).send({data: []});
            }
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
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
                session: {uId: personnelId} = {uId: null},
            } = req;
            const {
                page,
                count,
                sortBy,
                sortOrder,
                archived,
                search,
                filter,
            } = query;
            const skip = (page - 1) * count;

            async.parallel([
                // get breadcrumbs for parent
                (parallelCb) => {
                    if (!parentId) {
                        return parallelCb(null, []);
                    }

                    getPopulatedBreadcrumbsByDocumentId(parentId, parallelCb);
                },

                // get data
                (parallelCb) => {
                    getAllDocs({
                        skip,
                        count,
                        archived,
                        parentId,
                        personnelId,
                        sortBy,
                        sortOrder,
                        search,
                        filter,
                    }, (err, response) => {
                        if (err) {
                            return parallelCb(err);
                        }

                        if (response.total === 0) {
                            return parallelCb(null, response);
                        }

                        fillImagesIntoResult(response, (err, result) => {
                            if (err) {
                                return parallelCb(err);
                            }

                            parallelCb(null, result);
                        });
                    });
                },
            ], (err, result) => {
                if (err) {
                    return next(err);
                }

                const breadcrumbsResult = result[0];
                const response = result[1];

                response.breadcrumbs = breadcrumbsResult;

                res.status(200).send(response);
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            joiValidate(req.query, req.session.level, CONTENT_TYPES.DOCUMENTS, 'read', (err, body) => {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }

                queryRun(body);
            });
        });
    };

    // web only
    this.getRawFiles = function (req, res, next) {
        function queryRun(query) {
            const {
                session: {uId: personnelId} = {uId: null},
            } = req;
            const {
                page,
                count,
                sortBy,
                sortOrder,
                search,
            } = query;
            const skip = (page - 1) * count;
            getAllDocs({
                filesOnly: true,
                skip,
                count,
                archived : false,
                personnelId,
                sortBy,
                sortOrder,
                search,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                if (response.total === 0) {
                    return res.status(200).send(response);
                }

                fillImagesIntoResult(response, (err, result) => {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(result);
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            joiValidate(req.query, req.session.level, CONTENT_TYPES.DOCUMENTS, 'read', (err, body) => {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }

                queryRun(body);
            });
        });
    };

    // web only
    this.getFilesForContract = function (req, res, next) {
        function queryRun(query) {
            const {
                session: {uId: personnelId} = {uId: null},
            } = req;
            const {
                contractId,
                contractType,
            } = query;
            getDocsForContracts({
                personnelId,
                contractId,
                contractType,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                if (response.total === 0) {
                    return res.status(200).send(response);
                }

                res.status(200).send(response);
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            joiValidate(req.query, req.session.level, CONTENT_TYPES.DOCUMENTS, 'read', (err, body) => {
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
                session: {uId: personnelId} = {uId: null},
            } = req;
            const {
                page,
                count,
                parentId = null,
                sortBy,
                sortOrder,
            } = query;
            const skip = (page - 1) * count;
            getAllDocs({
                isMobile: true,
                skip,
                count,
                parentId,
                personnelId,
                sortBy,
                sortOrder,
            }, (err, body) => {
                if (err) {
                    return next(err);
                }

                body.data.forEach(elem => {
                    if (elem.title) {
                        elem.title = _.unescape(elem.title);
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            joiValidate(req.query, req.session.level, CONTENT_TYPES.DOCUMENTS, 'read', (err, query) => {
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
                session: {uId: personnelId} = {uId: null},
            } = req;
            const {
                lastLogOut,
            } = query;
            getAllDocs({
                isMobile: true,
                personnelId,
                lastLogOut,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                if (response.total === 0) {
                    return next({status: 200, body: response});
                }

                fillImagesIntoResult(response, (err, result) => {
                    if (err) {
                        return next(err);
                    }

                    next({status: 200, body: result});
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.DOCUMENT, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            joiValidate(req.query, req.session.level, CONTENT_TYPES.DOCUMENTS, 'sync', (err, query) => {
                if (err) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
                }

                queryRun(query);
            });
        });
    };

    this.createDocIfNewContract = function (userId, files, callback) {
        const titles = Object.keys(files);

        async.waterfall([
            (cb) => {
                fileHandler.uploadFile(userId, files, CONTENT_TYPES.DOCUMENTS, (err, ids) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, ids);
                });
            },

            (fileIds, cb) => {
                fileHandler.getByIds(fileIds, userId, (err, result) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, result);
                });
            },

            (fileModels, cb) => {
                const arrOfDocId = [];
                const createdBy = {
                    user: userId,
                    date: new Date(),
                };

                let i = 0;

                function iterator(item, callback) {
                    DocumentModel.create({
                        attachment : item._id,
                        breadcrumbs: [],
                        createdBy,
                        editedBy   : createdBy,
                        title      : titles[i],
                        type       : 'file',
                    }, (err, result) => {
                        if (err) {
                            return callback(err);
                        }

                        i++;
                        arrOfDocId.push(result._id);

                        callback(null);
                    });
                }

                async.each(fileModels, iterator, (err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, arrOfDocId);
                });
            },
        ], (err, result) => {
            if (err) {
                return callback(err);
            }

            callback(null, result);
        });
    };
};

module.exports = Documents;
