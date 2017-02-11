const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');
const extractBody = require('./../utils/extractBody');
const detectObjectivesForSubordinates = require('./../reusableComponents/detectObjectivesForSubordinates');
const TestUtils = require('./../stories/push-notifications/utils/TestUtils');
const ActivityLog = require('./../stories/push-notifications/activityLog');
const ObjectiveUtils = require('./../stories/test-utils').ObjectiveUtils;
const logger = require('./../utils/logger');
const toString = require('./../utils/toString');
const mongo = require('./../utils/mongo');

const ACL_CONSTANTS = require('./../constants/aclRolesNames');
const ACL_MODULES = require('./../constants/aclModulesNames');
const CONTENT_TYPES = require('./../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../public/js/constants/otherConstants');
const CONSTANTS = require('./../constants/mainConstants');

const AccessManager = require('./../helpers/access')();
const AggregationHelper = require('./../helpers/aggregationCreater');
const GetImage = require('./../helpers/getImages');
const FilterMapper = require('./../helpers/filterMapper');
const bodyValidator = require('./../helpers/bodyValidator');
const coveredByMe = require('./../helpers/coveredByMe');

const ObjectiveModel = require('./../types/objective/model');
const ObjectiveHistoryModel = require('./../types/objectiveHistory/model');
const PersonnelModel = require('./../types/personnel/model');
const FileModel = require('./../types/file/model');

const FileHandler = require('./../handlers/file');
const DistributionFormHandler = require('./../handlers/distributionForm');
const VisibilityFormHandler = require('./../handlers/visibilityForm');

const getImage = new GetImage();
const fileHandler = new FileHandler();
const distributionFormHandler = new DistributionFormHandler(mongo);
const visibilityFormHandler = new VisibilityFormHandler(mongo);
const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
const ObjectId = mongoose.Types.ObjectId;

const $defProjection = {
    _id: 1,
    title: 1,
    companyObjective: 1,
    description: 1,
    objectiveType: 1,
    priority: 1,
    status: 1,
    assignedTo: 1,
    complete: 1,
    parent: 1,
    level: 1,
    countSubTasks: 1,
    completedSubTasks: 1,
    dateStart: 1,
    dateEnd: 1,
    dateClosed: 1,
    comments: 1,
    attachments: 1,
    editedBy: 1,
    createdBy: 1,
    country: 1,
    region: 1,
    subRegion: 1,
    retailSegment: 1,
    outlet: 1,
    branch: 1,
    location: 1,
    form: 1,
    efforts: 1,
    context: 1,
    creationDate: 1,
    updateDate: 1,
    archived: 1,
};

const getByIdAggr = (options, callback) => {
    const id = options.id;
    const isMobile = options.isMobile || false;

    const aggregateHelper = new AggregationHelper($defProjection);
    const pipeline = [];

    pipeline.push({
        $match: { _id: id },
    });

    if (isMobile) {
        pipeline.push({
            $project: aggregateHelper.getProjection({
                parent: {
                    level1: '$parent.1',
                    level2: '$parent.2',
                    level3: '$parent.3',
                    level4: '$parent.4',
                },
            }),
        });
    }

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'assignedTo',
        addProjection: ['firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'files',
        key: 'attachments',
        addProjection: ['contentType', 'originalName', 'createdBy'],
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'country',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'region',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'subRegion',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'retailSegments',
        key: 'retailSegment',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'outlets',
        key: 'outlet',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'branches',
        key: 'branch',
        addProjection: ['_id', 'name', 'outlet'],
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'createdBy.user',
        isArray: false,
        addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
        includeSiblings: { createdBy: { date: 1 } },
    }));

    pipeline.push({
        $unwind: {
            path: '$assignedTo',
            preserveNullAndEmptyArrays: true,
        },
    });

    if (!isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'assignedTo.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                assignedTo: {
                    _id: 1,
                    position: 1,
                    firstName: 1,
                    lastName: 1,
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'assignedTo.position',
            isArray: false,
            includeSiblings: {
                assignedTo: {
                    _id: 1,
                    accessRole: 1,
                    firstName: 1,
                    lastName: 1,
                },
            },
        }));
    }

    pipeline.push({
        $group: aggregateHelper.getGroupObject({
            assignedTo: { $addToSet: '$assignedTo' },
        }),
    });

    pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                },
            },
        },
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                },
            },
        },
    }));

    if (isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: { editedBy: { date: 1 } },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                    },
                },
            },
        }));
    }

    if (isMobile) {
        pipeline.push({
            $project: aggregateHelper.getProjection({
                creationDate: '$createdBy.date',
            }),
        });
    }

    pipeline.push({
        $project: aggregateHelper.getProjection({
            assignedTo: {
                $filter: {
                    input: '$assignedTo',
                    as: 'oneItem',
                    cond: { $ne: ['$$oneItem', null] },
                },
            },
        }),
    });

    ObjectiveModel.aggregate(pipeline)
        .allowDiskUse(true)
        .exec((err, response) => {
            if (err) {
                return callback(err);
            }

            const objective = response[0];

            if (!objective || !Object.keys(objective).length) {
                return callback(null, objective);
            }

            const setFileId = _.map(objective.attachments, '_id');
            const setPersonnelId = [
                _.get(objective, 'createdBy.user._id'),
                ..._.map(objective.assignedTo, '_id'),
            ];

            const options = {
                data: {
                    [CONTENT_TYPES.PERSONNEL]: setPersonnelId,
                    [CONTENT_TYPES.FILES]: setFileId,
                },
            };

            getImage.getImages(options, (err, result) => {
                if (err) {
                    return callback(err);
                }

                const setOptions = {
                    response: objective,
                    imgsObject: result,
                    fields: {
                        [CONTENT_TYPES.PERSONNEL]: [['assignedTo'], 'createdBy.user'],
                        [CONTENT_TYPES.FILES]: [['attachments']],
                    },
                };

                getImage.setIntoResult(setOptions, (model) => {
                    if (model) {
                        if (model.title) {
                            model.title = {
                                en: model.title.en ? _.unescape(model.title.en) : '',
                                ar: model.title.ar ? _.unescape(model.title.ar) : '',
                            };
                        }
                        if (model.description) {
                            model.description = {
                                en: model.description.en ? _.unescape(model.description.en) : '',
                                ar: model.description.ar ? _.unescape(model.description.ar) : '',
                            };
                        }
                        if (model.companyObjective) {
                            model.companyObjective = {
                                en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                                ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : '',
                            };
                        }
                    }
                    callback(null, model);
                });
            });
        });
};

const updateParents = (objective, callback) => {
    const updateParentObjective = (id, cb) => {
        async.waterfall([

            (cb) => {
                ObjectiveModel.findById(id, (err, parentObjective) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!parentObjective) {
                        const error = new Error('Parent objective not found.');

                        error.status = 400;
                        return cb(error);
                    }

                    cb(null, parentObjective);
                });
            },

            (parentObjective, cb) => {
                const parentModelLevel = parseInt(parentObjective.level, 10);
                const query = {
                    level: parentModelLevel + 1,
                    [`parent.${parentModelLevel}`]: parentObjective._id,
                };

                ObjectiveModel.find(query, (err, children) => {
                    const actualStatus = parentObjective.status;
                    const countSubTasks = children.filter(child => child.status !== 'draft').length;
                    const completedSubTasks = children.filter(child => child.status === 'completed').length;
                    const complete = Math.floor((completedSubTasks * 100) / countSubTasks);
                    const changes = {
                        countSubTasks,
                        completedSubTasks,
                        complete,
                    };

                    if (complete >= 100 && actualStatus === OBJECTIVE_STATUSES.RE_OPENED) {
                        changes.status = OBJECTIVE_STATUSES.CLOSED;
                    }

                    if (complete < 100 && actualStatus === OBJECTIVE_STATUSES.CLOSED) {
                        changes.status = OBJECTIVE_STATUSES.RE_OPENED;
                    }

                    parentObjective.set(changes);

                    cb(null, parentObjective);
                });
            },

        ], (err, parentObjective) => {
            if (err) {
                return cb(err);
            }

            parentObjective.save((err) => {
                if (err) {
                    return cb(err);
                }

                cb(null);
            });
        });
    };

    const series = [];
    const objectiveAsJson = _.assignIn({}, objective.toObject());
    const level = objectiveAsJson.level;
    const setParentObjective = objectiveAsJson.parent;

    for (let i = level - 1; i >= 1; i--) {
        const nextParent = setParentObjective[i];

        if (nextParent) {
            series.push((cb) => {
                updateParentObjective(nextParent, cb);
            });
        }
    }

    async.series(series, (err) => {
        if (err) {
            logger.error(err);
            return;
        }
    });

    callback(null, objective);
};

const createSubObjective = (options, callback) => {
    const {
        parentId,
        files,
        createdBy,
        isMobile,
    } = options;
    const saveObjective = options.saveObjective;
    const accessRoleLevel = options.level;
    const actionOriginator = options.createdBy.user;

    async.waterfall([

        (cb) => {
            ObjectiveModel.findById(parentId)
                .lean()
                .exec((err, parentObjective) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!parentObjective) {
                        const error = new Error('Parent objective not found.');

                        error.status = 400;
                        return cb(error);
                    }

                    cb(null, parentObjective);
                });
        },

        (parentObjective, cb) => {
            const attachments = [...options.attachments];
            const objectivePayload = {
                title: options.title,
                description: options.description,
                parent: parentObjective.parent,
                priority: options.priority || parentObjective.priority,
                objectiveType: parentObjective.objectiveType,
                companyObjective: options.companyObjective || parentObjective.companyObjective,
                status: saveObjective ?
                    OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS,
                assignedTo: options.assignedTo,
                level: accessRoleLevel,
                createdBy,
                editedBy: createdBy,
                attachments,
                location: options.location,
                country: options.country,
                region: options.region,
                subRegion: options.subRegion,
                retailSegment: options.retailSegment,
                outlet: options.outlet,
                branch: options.branch,
                dateStart: options.dateStart || parentObjective.dateStart,
                dateEnd: options.dateEnd || parentObjective.dateEnd,
            };

            // attach form like in parent objective to sub objective
            // if it not defined
            if (!options.formType && parentObjective.form) {
                objectivePayload.form = parentObjective.form;
            }

            if (options.title) {
                objectivePayload.title = {
                    en: _.escape(_.get(options, 'title.en') || ''),
                    ar: _.escape(_.get(options, 'title.ar') || ''),
                };
            }

            if (options.description) {
                objectivePayload.description = {
                    en: _.escape(_.get(options, 'description.en') || ''),
                    ar: _.escape(_.get(options, 'description.ar') || ''),
                };
            }

            if (parentObjective.parent) {
                objectivePayload.parent = {
                    1: parentObjective.parent['1'] || null,
                    2: parentObjective.parent['2'] || null,
                    3: parentObjective.parent['3'] || null,
                    4: parentObjective.parent['4'] || null,
                };
                /*
                 * less then or equals to Area in Charge manager without Trade Marketer
                 * */
                const everyAdmin = [
                    ACL_CONSTANTS.MASTER_ADMIN,
                    ACL_CONSTANTS.COUNTRY_ADMIN,
                    ACL_CONSTANTS.AREA_MANAGER,
                    ACL_CONSTANTS.AREA_IN_CHARGE,
                    ACL_CONSTANTS.SALES_MAN,
                ];

                if (parentObjective.level && everyAdmin.indexOf(parentObjective.level) > -1) {
                    objectivePayload.parent[parentObjective.level] = parentObjective._id;
                }
            }

            if (parentObjective.companyObjective) {
                objectivePayload.companyObjective = parentObjective.companyObjective;
            }

            if (options.companyObjective) {
                objectivePayload.companyObjective = {
                    en: _.escape(_.get(options, 'companyObjective.en') || ''),
                    ar: _.escape(_.get(options, 'companyObjective.ar') || ''),
                };
            }

            async.waterfall([

                (cb) => {
                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(actionOriginator, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                        if (err) {
                            return cb(err, null);
                        }

                        attachments.push(
                            ...setFileId
                        );

                        cb(null);
                    });
                },

                (cb) => {
                    const objective = new ObjectiveModel();

                    objective.set(objectivePayload);
                    objective.save((err, objective) => {
                        cb(err, objective);
                    });
                },

                (objective, cb) => {
                    if (options.formType === 'distribution') {
                        const data = {
                            objective: objective.get('_id'),
                        };

                        return distributionFormHandler.createForm(actionOriginator, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: options.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    if (options.formType === 'visibility') {
                        const data = {
                            objective: objective.get('_id'),
                            createdBy,
                        };

                        return visibilityFormHandler.createForm(actionOriginator, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: options.formType,
                            };

                            cb(null, objective);
                        });
                    }
                },

                (objective, cb) => {
                    if (!options.formType) {
                        return cb(null, objective);
                    }

                    objective.save((err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, objective);
                    });
                },

                updateParents,

                (objective, cb) => {
                    const isNotVisibility = options.formType !== 'visibility';

                    if (isNotVisibility) {
                        const eventPayload = {
                            actionOriginator,
                            accessRoleLevel,
                            body: objective.toJSON(),
                        };

                        if (TestUtils.isObjectiveDraft(objective)) {
                            ActivityLog.emit('sub-objective:draft-created', eventPayload);
                        }

                        if (TestUtils.isObjectivePublished(objective)) {
                            ActivityLog.emit('sub-objective:published', eventPayload);
                        }
                    }

                    const id = objective.get('_id');

                    getByIdAggr({
                        id,
                        isMobile,
                    }, cb);
                },

            ], cb);
        },

    ], callback);
};

const getAllPipeline = (options) => {
    const subordinates = options.subordinates;
    const personnel = options.personnel;
    const aggregateHelper = options.aggregateHelper;
    const queryObject = options.queryObject;
    const parentIds = options.parentIds;
    const positionFilter = options.positionFilter;
    const searchFieldsArray = options.searchFieldsArray;
    const filterSearch = options.filterSearch;
    const skip = options.skip;
    const limit = options.limit;
    const isMobile = options.isMobile;
    const coveredIds = options.coveredIds;
    const pipeline = [];
    const currentUserLevel = options.currentUserLevel;

    if (parentIds && parentIds.length) {
        pipeline.push({
            $match: {
                $and: [{
                    $or: [
                        { 'parent.1': { $in: parentIds } },
                        { 'parent.2': { $in: parentIds } },
                        { 'parent.3': { $in: parentIds } },
                        { 'parent.4': { $in: parentIds } },
                    ],
                }, {
                    _id: { $nin: parentIds },
                }],
            },
        });
    } else {
        if (queryObject) {
            pipeline.push({
                $match: queryObject,
            });
        }

        if (isMobile && currentUserLevel && currentUserLevel !== ACL_CONSTANTS.MASTER_ADMIN) {
            const allowedAccessRoles = [
                ACL_CONSTANTS.COUNTRY_ADMIN,
                ACL_CONSTANTS.AREA_MANAGER,
                ACL_CONSTANTS.AREA_IN_CHARGE,
            ];

            if (allowedAccessRoles.indexOf(currentUserLevel) > -1 && queryObject) {
                // get objectives that assigned to subordinate users
                pipeline.push({
                    $match: {
                        $or: [
                            { assignedTo: { $in: subordinates } },
                            { assignedTo: { $in: coveredIds } },
                            { 'createdBy.user': { $in: coveredIds } },
                        ],
                    },
                });
            }
        }

        // prevent retrieving objectives with status === draft if user not creator
        pipeline.push({
            $match: {
                $or: [{
                    status: { $ne: OBJECTIVE_STATUSES.DRAFT },
                }, {
                    status: { $eq: OBJECTIVE_STATUSES.DRAFT },
                    'createdBy.user': { $eq: personnel },
                }],
            },
        });
    }

    if (!isMobile) {
        pipeline.push({
            $match: {
                $or: [
                    { archived: false },
                    { archived: { $exists: false } },
                ],
            },
        });
    }

    if (isMobile) {
        pipeline.push({
            $project: aggregateHelper.getProjection({
                parent: {
                    level1: '$parent.1',
                    level2: '$parent.2',
                    level3: '$parent.3',
                    level4: '$parent.4',
                },
            }),
        });
    }

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'assignedTo',
        addProjection: ['position', 'accessRole', 'firstName', 'lastName'],
        isArray: true,
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'files',
        key: 'attachments',
        addProjection: ['contentType', 'originalName', 'createdBy'],
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'country',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'region',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'subRegion',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'retailSegments',
        key: 'retailSegment',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'outlets',
        key: 'outlet',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'branches',
        key: 'branch',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'createdBy.user',
        isArray: false,
        addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
        includeSiblings: { createdBy: { date: 1 } },
    }));

    pipeline.push({
        $unwind: {
            path: '$assignedTo',
            preserveNullAndEmptyArrays: true,
        },
    });

    if (positionFilter) {
        pipeline.push({
            $match: positionFilter,
        });
    }

    if (!isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'assignedTo.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                assignedTo: {
                    _id: 1,
                    position: 1,
                    firstName: 1,
                    lastName: 1,
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'assignedTo.position',
            isArray: false,
            includeSiblings: {
                assignedTo: {
                    _id: 1,
                    accessRole: 1,
                    firstName: 1,
                    lastName: 1,
                },
            },
        }));
    }

    pipeline.push({
        $group: aggregateHelper.getGroupObject({
            assignedTo: { $addToSet: '$assignedTo' },
        }),
    });

    pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                },
            },
        },
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                },
            },
        },
    }));

    if (isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: { editedBy: { date: 1 } },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                    },
                },
            },
        }));
    }

    pipeline.push({
        $project: aggregateHelper.getProjection({
            assignedTo: {
                $filter: {
                    input: '$assignedTo',
                    as: 'oneItem',
                    cond: { $ne: ['$$oneItem', null] },
                },
            },
        }),
    });

    pipeline.push(...aggregateHelper.endOfPipeLine({
        isMobile,
        searchFieldsArray,
        filterSearch,
        skip,
        limit,
        creationDate: true,
    }));

    return pipeline;
};

class ObjectiveHandler {

    getUrl(req, res) {
        const imageName = req.params.imageName;
        const url = fileHandler.computeUrl(imageName);

        res.status(200).send(url);
    }

    removeFileFromObjective(req, res, next) {
        const body = req.body;
        const session = req.session;
        const userId = session.uId;
        const fileId = body.fileId;
        const objectiveId = body.objectiveId;

        if (!objectiveId || !fileId) {
            const error = new Error('Not enough params');

            error.status = 400;
            return next(error);
        }

        async.waterfall([

            (cb) => {
                FileModel.findById(fileId, (err, fileModel) => {
                    if (err) {
                        return cb(err, null);
                    }

                    if (!fileModel) {
                        const error = new Error('File not found');

                        error.status = 400;
                        return cb(err, null);
                    }

                    const fileName = fileModel.get('name');

                    if (userId === fileModel.get('createdBy.user').toString()) {
                        return cb(null, {
                            removeFile: true,
                            fileName,
                        });
                    }

                    cb(null, {
                        removeFile: false,
                    });
                });
            },

            (options, cb) => {
                const {
                removeFile,
                fileName,
            } = options;

                ObjectiveModel.update(objectiveId, {
                    $pull: {
                        attachments: ObjectId(fileId),
                    },
                }, (err) => {
                    if (err) {
                        return cb(err);
                    }

                    if (removeFile) {
                        return fileHandler.deleteFile(fileName, CONTENT_TYPES.OBJECTIVES, (err) => {
                            if (err) {
                                return cb(err);
                            }

                            cb();
                        });
                    }

                    cb();
                });
            },

        ], (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send();
        });
    }

    create(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const isMobile = req.isMobile;

        const queryRun = (body, callback) => {
            const files = req.files;
            const createdBy = {
                user: userId,
                date: new Date(),
            };

            const saveObjective = body.saveObjective;

            if (!body.assignedTo || !body.assignedTo.length) {
                const error = new Error('You must assign person to task');

                error.status = 400;
                return next(error);
            }

            async.waterfall([

                (cb) => {
                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, setFileId);
                    });
                },

                (setFileId, cb) => {
                    const status = saveObjective ?
                    OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS;

                    body.title = {
                        en: _.escape(_.get(body, 'title.en') || ''),
                        ar: _.escape(_.get(body, 'title.ar') || ''),
                    };
                    body.description = {
                        en: _.escape(_.get(body, 'description.en') || ''),
                        ar: _.escape(_.get(body, 'description.ar') || ''),
                    };

                    const data = {
                        objectiveType: body.objectiveType,
                        priority: body.priority,
                        status,
                        assignedTo: body.assignedTo,
                        level: session.level,
                        dateStart: body.dateStart,
                        dateEnd: body.dateEnd,
                        country: body.country,
                        region: body.region,
                        subRegion: body.subRegion,
                        retailSegment: body.retailSegment,
                        outlet: body.outlet,
                        branch: body.branch,
                        location: body.location,
                        attachments: setFileId,
                        createdBy,
                        editedBy: createdBy,
                        title: body.title,
                        description: body.description,
                    };

                    const objective = new ObjectiveModel();

                    objective.set(data);
                    objective.save((err, model) => {
                        cb(err, model);
                    });
                },

                (objective, cb) => {
                    if (body.formType === 'distribution') {
                        const data = {
                            objective: objective.get('_id'),
                        };

                        return distributionFormHandler.createForm(userId, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: body.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    if (body.formType === 'visibility') {
                        const data = {
                            objective: objective.get('_id'),
                            createdBy,
                        };

                        return visibilityFormHandler.createForm(userId, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: body.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    cb(null, objective);
                },

                (objective, cb) => {
                    if (!body.formType) {
                        return cb(null, objective);
                    }

                    objective.save((err) => {
                        cb(err, objective);
                    });
                },

                (objective, cb) => {
                    const hasForm = _.has(body, 'formType');
                    const isDistribution = hasForm && body.formType === 'distribution';

                // skip in case with visibility form
                    if (!hasForm || isDistribution) {
                        if (TestUtils.isObjectiveDraft(objective)) {
                            ActivityLog.emit('objective:draft-created', {
                                actionOriginator: userId,
                                accessRoleLevel,
                                body: objective.toJSON(),
                            });
                        }

                        if (TestUtils.isObjectivePublished(objective)) {
                            ActivityLog.emit('objective:published', {
                                actionOriginator: userId,
                                accessRoleLevel,
                                body: objective.toJSON(),
                            });
                        }
                    }

                    const id = objective.get('_id');

                    getByIdAggr({
                        id,
                        isMobile,
                    }, cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                AccessManager.getWriteAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (personnel, allowed, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'create', cb);
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(result);
        });
    }

    update(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const store = new ObjectiveUtils({
            actionOriginator: userId,
            accessRoleLevel,
        });
        const files = req.files;
        const body = extractBody(req.body);
        const objectiveId = req.params.id;
        const attachments = body.attachments;

        const queryRun = ($set, callback) => {
            const fullUpdate = {
                $set,
            };

            const updateCover = (objective) => {
                PersonnelModel.findOne({
                    $and: [{
                        'vacation.cover': ObjectId(userId),
                    }, {
                        $or: [{
                            _id: {
                                $in: objective.assignedTo,
                            },
                            'vacation.onLeave': true,
                        }, {
                            _id: ObjectId(objective.createdBy.user),
                            'vacation.onLeave': true,
                        }],
                    }],
                }, (err, personnel) => {
                    if (err) {
                        logger.error('Query on objective\'s cover fails', err);
                        return;
                    }

                    if (!personnel) {
                        logger.error('Cover personnel not found');
                        return;
                    }

                    const objectiveHistory = new ObjectiveHistoryModel({
                        objective: ObjectId(objective._id),
                        person: ObjectId(userId),
                    });

                    objectiveHistory.save((err) => {
                        if (err) {
                            logger.error('Objective\'s history doesn\'t saved', err);
                            return;
                        }
                    });
                });
            };

            const updateObjective = (setFileId, cb) => {
                if ($set.status && $set.status !== OBJECTIVE_STATUSES.CLOSED) {
                    $set.complete = $set.status === OBJECTIVE_STATUSES.COMPLETED ? 100 : 0;
                }

                $set.editedBy = {
                    user: ObjectId(userId),
                    date: new Date(),
                };

                if (attachments && attachments.length) {
                    $set.attachments = attachments.objectID().concat(setFileId);
                } else {
                    delete $set.attachments;

                    fullUpdate.$addToSet = {
                        attachments: {
                            $each: setFileId,
                        },
                    };
                }

                if ($set.title) {
                    $set['title.en'] = _.escape(_.get($set, 'title.en') || '');
                    $set['title.ar'] = _.escape(_.get($set, 'title.ar') || '');

                    delete $set.title;
                }

                if ($set.description) {
                    $set['description.en'] = _.escape(_.get($set, 'description.en') || '');
                    $set['description.ar'] = _.escape(_.get($set, 'description.ar') || '');

                    delete $set.description;
                }

                ObjectiveModel.findOne({
                    _id: objectiveId,
                }, (err, model) => {
                    if (err) {
                        return cb(err);
                    }

                    store.setPreviousState(model.toJSON());

                    if (_.includes([
                        OBJECTIVE_STATUSES.FAIL,
                        OBJECTIVE_STATUSES.CLOSED,
                    ], model.status)) {
                        const error = new Error(`You could not update task with status: "${model.status}"`);
                        error.status = 400;

                        return cb(error);
                    }

                    if (model.status === OBJECTIVE_STATUSES.OVER_DUE && toString(model, 'createdBy.user') !== userId) {
                        const error = new Error(`You could not update task with status: "${model.status}"`);

                        error.status = 400;
                        return cb(error);
                    }

                    ObjectiveModel.findOneAndUpdate({
                        _id: objectiveId,
                    }, fullUpdate, {
                        new: true,
                        runValidators: true,
                    }, (err, objective) => {
                        if (err) {
                            return cb(err);
                        }

                        if ($set.cover) {
                            updateCover(objective);
                        }

                        if (objective.status === OBJECTIVE_STATUSES.CLOSED
                        && objective.objectiveType !== 'individual'
                        && objective.level === ACL_CONSTANTS.MASTER_ADMIN) {
                            ObjectiveModel.update({
                                'parent.1': objective._id,
                            }, {
                                $set: {
                                    archived: true,
                                },
                            }, {
                                multi: true,
                            }, (err, result) => {
                                if (err) {
                                    logger.error(err);
                                    return;
                                }

                                logger.info(result);
                            });
                        }

                        store.setNextState(objective.toJSON());
                        store.difference();
                        store.publish();

                        cb(null, objective);
                    });
                });
            };

            const uploadFiles = (cb) => {
                if (!files) {
                    return cb(null, []);
                }

                fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, setFileId);
                });
            };

            const waterfall = [
                uploadFiles,
                updateObjective,
            ];

            if ($set.formType) {
                const createForms = (objective, cb) => {
                    if ($set.formType === 'distribution') {
                    /* TODO fill description from task if AM or AincM will link forms */
                        const data = {
                            objective: objective.get('_id'),
                            description: '',
                        };

                        return distributionFormHandler.createForm(userId, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: $set.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    if ($set.formType === 'visibility') {
                        const data = {
                            objective: objective.get('_id'),
                            createdBy: {
                                user: userId,
                                date: objective.createdBy.date,
                            },
                        };

                        return visibilityFormHandler.createForm(userId, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: $set.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    cb(null, objective);
                };

                const updateObjectiveWithForm = (objective, cb) => {
                    if (!$set.formType) {
                        return cb(null, objective);
                    }

                    objective.save((err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, objective);
                    });
                };

                waterfall.push(createForms);
                waterfall.push(updateObjectiveWithForm);
            }

            if ($set.status && $set.status !== OBJECTIVE_STATUSES.CLOSED) {
                waterfall.push(updateParents);
            }

            if ($set.assignedTo && $set.assignedTo[0]) {
                const updateChildObjective = (options) => {
                    const {
                        nextObjectiveIds,
                        assignedTo,
                    } = options;
                    const query = {
                        _id: {
                            $in: nextObjectiveIds,
                        },
                    };

                    ObjectiveModel.update(query, {
                        $set: {
                            'createdBy.user': ObjectId(assignedTo[0]),
                        },
                    }, (err) => {
                        if (err) {
                            logger.error(err);
                            return;
                        }
                    });
                };

                const updateObjectiveByAssigneeLocation = (objective, cb) => {
                    const objectiveLevel = objective.get('level');
                    const objectiveId = objective.get('_id');
                    const query = {
                        [`parent.${objectiveLevel}`]: objectiveId,
                    };

                    ObjectiveModel.find(query, (err, setObjective) => {
                        if (err) {
                            return cb(err);
                        }

                        if (setObjective) {
                            PersonnelModel.findById($set.assignedTo[0], (err, personnel) => {
                                if (err) {
                                    return cb(err);
                                }

                                ObjectiveModel.findByIdAndUpdate(objectiveId, {
                                    $set: {
                                        country: personnel.country,
                                        region: personnel.region,
                                        subRegion: personnel.subRegion,
                                        branch: personnel.branch,
                                    },
                                }, (err) => {
                                    if (err) {
                                        return cb(err);
                                    }

                                    updateChildObjective({
                                        nextObjectiveIds: setObjective.map(item => item._id),
                                        assignedTo: $set.assignedTo,
                                    });
                                });
                            });
                        }

                        cb(null, objective);
                    });
                };

                waterfall.push(updateObjectiveByAssigneeLocation);
            }

            const getResultAndSend = (objective, cb) => {
                const id = objective.get('_id');

                getByIdAggr({
                    id,
                    isMobile: req.isMobile,
                }, cb);
            };

            waterfall.push(getResultAndSend);

            async.waterfall(waterfall, callback);
        };

        async.waterfall([

            (cb) => {
                AccessManager.getEditAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (personnel, allowed, cb) => {
                bodyValidator.validateBody(body.changed, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'update', cb);
            },

            queryRun,

        ], (err, model) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(model);
        });
    }

    createSubObjective(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
            const files = req.files;
            const parentId = body.parentId;

            if (!body.assignedTo || !body.assignedTo.length) {
                const error = new Error('Should be at least one assignee.');

                error.status = 400;
                return callback(error);
            }

            if (!parentId) {
                const error = new Error('Parent ID is required.');

                error.status = 400;
                return callback(error);
            }

            const createdBy = {
                user: userId,
                date: new Date(),
            };
            const options = Object.assign({}, {
                parentId,
                assignedTo: body.assignedTo,
                createdBy,
                saveObjective: body.saveObjective,
                companyObjective: body.companyObjective,
                description: body.description,
                title: body.title,
                dateStart: body.dateStart,
                dateEnd: body.dateEnd,
                priority: body.priority,
                attachments: body.attachments,
                files,
                objectiveType: body.objectiveType,
                location: body.location,
                country: body.country,
                region: body.region,
                subRegion: body.subRegion,
                retailSegment: body.retailSegment,
                outlet: body.outlet,
                branch: body.branch,
                level: accessRoleLevel,
                formType: body.formType,
                form: body.form,
                isMobile: req.isMobile,
            });

            createSubObjective(options, callback);
        };

        async.waterfall([

            (cb) => {
                AccessManager.getWriteAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (personnel, allowed, cb) => {
                const body = extractBody(req.body);

                bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'createSubObjective', cb);
            },

            queryRun,

        ], (err, parent) => {
            if (err) {
                return next(err);
            }

            if (!parent) {
                return res.status(200).send();
            }

            res.status(200).send(parent);
        });
    }

    getAllForSync(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (callback) => {
            const query = req.query;
            const lastLogOut = new Date(query.lastLogOut);
            const queryObject = {
                context: CONTENT_TYPES.OBJECTIVES,
            };

            const aggregateHelper = new AggregationHelper($defProjection);

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            const setSubordinateObjectId = [];

            async.waterfall([

                (cb) => {
                    PersonnelModel.distinct('_id', {
                        manager: userId,
                    }).exec((err, setAvailableSubordinateId) => {
                        if (err) {
                            return cb(err);
                        }

                        setSubordinateObjectId.push(...setAvailableSubordinateId);

                        cb(null);
                    });
                },

                (cb) => {
                    coveredByMe(PersonnelModel, ObjectId(userId), cb);
                },

                (coveredIds, cb) => {
                    const pipeLine = getAllPipeline({
                        aggregateHelper,
                        queryObject,
                        isMobile: true,
                        forSync: true,
                        personnel: ObjectId(userId),
                        coveredIds,
                        currentUserLevel: accessRoleLevel,
                        subordinates: setSubordinateObjectId,
                    });

                    ObjectiveModel.aggregate(pipeLine)
                        .allowDiskUse(true)
                        .exec((err, response) => {
                            if (err) {
                                return next(err);
                            }

                            response = response && response[0] ?
                                response[0] : { data: [], total: 0 };

                            cb(null, response);
                        });
                },

            ], (err, response) => {
                if (err) {
                    return next(err);
                }


                const setPersonnelId = [];
                const setFileId = [];

                response.data = response.data.map((model) => {
                    if (model.title) {
                        model.title = {
                            en: model.title.en ? _.unescape(model.title.en) : '',
                            ar: model.title.ar ? _.unescape(model.title.ar) : '',
                        };
                    }

                    if (model.description) {
                        model.description = {
                            en: model.description.en ? _.unescape(model.description.en) : '',
                            ar: model.description.ar ? _.unescape(model.description.ar) : '',
                        };
                    }

                    if (model.companyObjective) {
                        model.companyObjective = {
                            en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                            ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : '',
                        };
                    }

                    setFileId.push(..._.map(model.attachments, '_id'));
                    setPersonnelId.push(
                        _.get(model, 'createdBy.user._id'),
                        ..._.map(model.assignedTo, '_id')
                    );

                    return model;
                });


                const options = {
                    data: {
                        [CONTENT_TYPES.PERSONNEL]: setPersonnelId,
                        [CONTENT_TYPES.FILES]: setFileId,
                    },
                };

                getImage.getImages(options, (err, result) => {
                    if (err) {
                        return callback(err);
                    }

                    const setOptions = {
                        response,
                        imgsObject: result,
                        fields: {
                            [CONTENT_TYPES.PERSONNEL]: [['assignedTo'], 'createdBy.user'],
                            [CONTENT_TYPES.FILES]: [['attachments']],
                        },
                    };

                    getImage.setIntoResult(setOptions, (response) => {
                        const setSubordinateStringId = setSubordinateObjectId.map((ObjectId) => {
                            return ObjectId.toString();
                        });

                        response.data = detectObjectivesForSubordinates(response.data, setSubordinateStringId, userId);

                        callback(null, response);
                    });
                });
            });
        };

        async.waterfall([

            (cb) => {
                AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            },

        ], (err, response) => {
            if (err) {
                return next(err);
            }

            next({
                status: 200,
                body: response,
            });
        });
    }

    getAll(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (personnel, callback) => {
            const query = req.query;
            const filter = query.filter || {};
            const page = query.page || 1;
            const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
            const skip = (page - 1) * limit;
            const filterMapper = new FilterMapper();
            const filterSearch = filter.globalSearch || '';
            const isMobile = req.isMobile;

            const searchFieldsArray = [
                'myCC',
                'title.en',
                'title.ar',
                'description.en',
                'description.ar',
                'objectiveType',
                'priority',
                'status',
                'country.name.en',
                'country.name.ar',
                'region.name.en',
                'region.name.ar',
                'subRegion.name.en',
                'subRegion.name.ar',
                'retailSegment.name.en',
                'retailSegment.name.ar',
                'outlet.name.en',
                'outlet.name.ar',
                'branch.name.en',
                'branch.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.lastName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.ar',
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'assignedTo._id',
                'assignedTo.firstName.en',
                'assignedTo.lastName.en',
                'assignedTo.firstName.ar',
                'assignedTo.lastName.ar',
                'assignedTo.position.name.ar',
                'assignedTo.position.name.en',
            ];

            const cover = filter.cover;
            const myCC = filter.myCC;

            delete filter.cover;
            delete filter.globalSearch;
            delete filter.myCC;

            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.OBJECTIVES,
                filter,
                personnel,
            });

            if (cover || isMobile) {
                delete queryObject.region;
                delete queryObject.subRegion;
                delete queryObject.branch;
            }

            const aggregateHelper = new AggregationHelper($defProjection, queryObject);

            const positionFilter = {};

            if (queryObject.position && queryObject.position.$in) {
                positionFilter.$or = [
                    { 'assignedTo.position': queryObject.position },
                    { 'createdBy.user.position': queryObject.position },
                ];

                delete queryObject.position;
            }

            queryObject.context = CONTENT_TYPES.OBJECTIVES;

            const setSubordinateId = [];

            async.waterfall([

                // if request with myCC, then Appends to queryObject _id of user that subordinate to current user.
                (cb) => {
                    if (myCC || isMobile) {
                        return PersonnelModel.distinct('_id', {
                            manager: userId,
                        }).exec((err, setAvailableSubordinateId) => {
                            if (err) {
                                return cb(err);
                            }

                            setSubordinateId.push(...setAvailableSubordinateId);

                            cb(null);
                        });
                    }

                    cb(null);
                },

                (cb) => {
                    if (myCC) {
                        _.set(queryObject, '$and[0].assignedTo.$in', setSubordinateId);
                    }

                    coveredByMe(PersonnelModel, ObjectId(userId), cb);
                },

                (coveredIds, cb) => {
                    const pipeline = getAllPipeline({
                        aggregateHelper,
                        queryObject,
                        positionFilter,
                        isMobile,
                        searchFieldsArray,
                        filterSearch,
                        skip,
                        limit,
                        personnel: ObjectId(userId),
                        coveredIds,
                        subordinates: setSubordinateId,
                        currentUserLevel: accessRoleLevel,
                    });

                    ObjectiveModel.aggregate(pipeline)
                        .allowDiskUse(true)
                        .exec((err, response) => {
                            if (err) {
                                return cb(err);
                            }

                            response = response && response[0]
                                ? response[0] : { data: [], total: 0 };

                            cb(null, response);
                        });
                },

                (response, cb) => {
                    if (!isMobile) {
                        return cb(null, response);
                    }

                    const mobilePipeLine = getAllPipeline({
                        aggregateHelper,
                        parentIds: isMobile ? _.map(response.data, '_id') : [],
                        positionFilter,
                        isMobile,
                        searchFieldsArray,
                        filterSearch,
                        skip,
                        limit,
                        currentUserLevel: accessRoleLevel,
                    });

                    ObjectiveModel.aggregate(mobilePipeLine)
                        .allowDiskUse(true)
                        .exec((err, responseMobile) => {
                            if (err) {
                                return cb(err, null);
                            }

                            responseMobile = responseMobile && responseMobile[0] ?
                                responseMobile[0] : { data: [], total: 0 };

                            response.data = response.data.concat(responseMobile.data);
                            response.total += responseMobile.total;

                            cb(null, response);
                        });
                },

            ], (err, response) => {
                if (err) {
                    return callback(err);
                }

                const setFileId = [];
                const setPersonnelId = [];

                response.data = response.data.map((model) => {
                    if (model.title) {
                        model.title = {
                            en: model.title.en ? _.unescape(model.title.en) : '',
                            ar: model.title.ar ? _.unescape(model.title.ar) : '',
                        };
                    }
                    if (model.description) {
                        model.description = {
                            en: model.description.en ? _.unescape(model.description.en) : '',
                            ar: model.description.ar ? _.unescape(model.description.ar) : '',
                        };
                    }
                    if (model.companyObjective) {
                        model.companyObjective = {
                            en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                            ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : '',
                        };
                    }

                    setFileId.push(..._.map(model.attachments, '_id'));
                    setPersonnelId.push(
                        _.get(model, 'createdBy.user._id'),
                        ..._.map(model.assignedTo, '_id')
                    );

                    return model;
                });

                const options = {
                    data: {
                        [CONTENT_TYPES.PERSONNEL]: setPersonnelId,
                        [CONTENT_TYPES.FILES]: setFileId,
                    },
                };

                getImage.getImages(options, (err, result) => {
                    if (err) {
                        return callback(err);
                    }

                    const setOptions = {
                        response,
                        imgsObject: result,
                        fields: {
                            [CONTENT_TYPES.PERSONNEL]: [['assignedTo'], 'createdBy.user'],
                            [CONTENT_TYPES.FILES]: [['attachments']],
                        },
                    };

                    getImage.setIntoResult(setOptions, (response) => {
                        const subordinatesId = setSubordinateId.map((ObjectId) => {
                            return ObjectId.toString();
                        });

                        response.data = detectObjectivesForSubordinates(response.data, subordinatesId, userId);

                        callback(null, response);
                    });
                });
            });
        };

        async.waterfall([

            (cb) => {
                AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            },

        ], (err, response) => {
            if (err) {
                return next(err);
            }

            next({
                status: 200,
                body: response,
            });
        });
    }

    getById(req, res, next) {
        const queryRun = (callback) => {
            const id = req.params.id;

            getByIdAggr({
                id: ObjectId(id),
                isMobile: req.isMobile,
            }, callback);
        };

        async.waterfall([

            (cb) => {
                AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    }

    getPersonnelForSelection(req, res, next) {
        const queryRun = (personnel, callback) => {
            const query = req.query;
            const page = query.page || 1;
            const limit = parseInt(query.count, 10) || CONSTANTS.LIST_COUNT;
            const skip = (page - 1) * limit;
            const language = req.cookies.currentLanguage;
            const translateFields = ['firstName', 'lastName'];
            const translated = (query.filter && query.filter.translated) ?
                query.filter.translated.values : [];
            const filterMapper = new FilterMapper();
            const filter = query.filter || {};
            const objectiveType = (filter.objectiveType && filter.objectiveType.values) || query.objectiveType ?
                query.objectiveType || filter.objectiveType.values[0] : null;
            const filterSearch = filter.globalSearch || '';
            const currentUserId = req.session.uId;
            const queryObjectAfterLookup = {};
            const $personnelDefProjection = {
                _id: 1,
                position: 1,
                avgRating: 1,
                manager: 1,
                lastAccess: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                phoneNumber: 1,
                accessRole: 1,
                createdBy: 1,
                vacation: 1,
                status: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                country: 1,
                currentLanguage: 1,
                super: 1,
                archived: 1,
                temp: 1,
                confirmed: 1,
                translated: 1,
            };

            const sort = query.sort || {
                'editedBy.date': 1,
            };

            _.forOwn(sort, (value, prop) => {
                sort[prop] = parseInt(value, 10);
            });

            delete filter.globalSearch;
            delete filter.objectiveType;

            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.OBJECTIVES,
                filter,
                context: 'objectivesAssign',
                personnel,
            });
            const aggregateHelper = new AggregationHelper($personnelDefProjection, queryObject);

            if (queryObject.retailSegment) {
                queryObjectAfterLookup.retailSegment = queryObject.retailSegment;
                delete queryObject.retailSegment;
            }

            if (queryObject.outlet) {
                queryObjectAfterLookup.outlet = queryObject.outlet;
                delete queryObject.outlet;
            }

            if (queryObject.assignLevel) {
                queryObjectAfterLookup['accessRole.level'] = queryObject.assignLevel;
                delete queryObject.assignLevel;
            }

            if (!_.has(queryObject, 'archived')) {
                queryObject.archived = false;
            }

            async.waterfall([

                (cb) => {
                    PersonnelModel.aggregate([{
                        $match: {
                            _id: ObjectId(currentUserId),
                        },
                    }, {
                        $lookup: {
                            from: 'accessRoles',
                            localField: 'accessRole',
                            foreignField: '_id',
                            as: 'accessRole',
                        },
                    }, {
                        $project: {
                            accessRole: { $arrayElemAt: ['$accessRole', 0] },
                            country: 1,
                            region: 1,
                            subRegion: 1,
                        },
                    }]).exec((err, personnels) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, personnels[0]);
                    });
                },

                (personnel, cb) => {
                    const domainsArray = ['country', 'region', 'subRegion'];
                    const personnelLocations = _.pick(personnel, 'country', 'region', 'subRegion');
                    const searchFieldsArray = [
                        'firstName.en',
                        'firstName.ar',
                        'lastName.en',
                        'lastName.ar',
                        'country.name.en',
                        'country.name.ar',
                        'region.name.en',
                        'region.name.ar',
                        'subRegion.name.en',
                        'subRegion.name.ar',
                        'retailSegment.name.en',
                        'retailSegment.name.ar',
                        'outlet.name.en',
                        'outlet.name.ar',
                        'branch.name.en',
                        'branch.name.ar',
                        'email',
                        'phoneNumber',
                        'accessRole.name.en',
                        'accessRole.name.ar',
                        'position.name.en',
                        'position.name.ar',
                    ];

                /* eslint-disable no-restricted-syntax */
                    for (const personnelLocationKey in personnelLocations) {
                        if (!personnelLocations[personnelLocationKey][0]) {
                            delete personnelLocations[personnelLocationKey];
                        }
                    }
                /* eslint-enable no-restricted-syntax */

                    queryObject.super = {
                        $ne: true,
                    };

                    queryObject._id = {
                        $ne: ObjectId(currentUserId),
                    };

                    const pipeline = [];

                    pipeline.push({
                        $match: queryObject,
                    });

                    if (translated.length === 1) {
                        pipeline.push({
                            $project: aggregateHelper.getProjection({
                                translated: aggregateHelper.translatedCond(language, translateFields, translated[0]),
                            }),
                        });

                        pipeline.push({
                            $match: {
                                translated: true,
                            },
                        });
                    }

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'positions',
                        key: 'position',
                        isArray: false,
                    }));

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'accessRoles',
                        key: 'accessRole',
                        isArray: false,
                        addProjection: 'level',
                    }));

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'branches',
                        key: 'branch',
                        addMainProjection: ['retailSegment', 'outlet'],
                        addProjection: ['outlet'],
                    }));

                    if (objectiveType && objectiveType !== 'individual') {
                        if (personnel.accessRole.level <= 2) {
                            queryObjectAfterLookup['accessRole.level'] = {
                                $eq: personnel.accessRole.level + 1,
                            };
                        }
                    } else {
                        queryObjectAfterLookup.$and = [
                        { 'accessRole.level': { $gte: personnel.accessRole.level } },
                        { 'accessRole.level': { $lt: 8 } },
                        ];
                    }

                    _.forOwn(personnelLocations, (value, key) => {
                        queryObjectAfterLookup[key] = {
                            $in: value,
                        };
                    });

                    pipeline.push({
                        $match: queryObjectAfterLookup,
                    });

                    domainsArray.forEach((element) => {
                        pipeline.push(...aggregateHelper.aggregationPartMaker({
                            from: 'domains',
                            key: element,
                        }));
                    });

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'retailSegments',
                        key: 'retailSegment',
                    }));

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'outlets',
                        key: 'outlet',
                    }));

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'personnels',
                        key: 'createdBy.user',
                        isArray: false,
                        mameFields: ['firstName', 'lastName'],
                        includeSiblings: { createdBy: { date: 1 } },
                    }));

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'personnels',
                        key: 'manager',
                        isArray: false,
                        addProjection: ['_id', 'firstName', 'lastName'],
                    }));

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'personnels',
                        key: 'vacation.cover',
                        isArray: false,
                        addProjection: ['_id', 'firstName', 'lastName'],
                        includeSiblings: { vacation: { onLeave: 1 } },
                    }));

                    pipeline.push({
                        $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch),
                    });

                    pipeline.push({
                        $sort: sort,
                    });

                    pipeline.push(...aggregateHelper.setTotal());

                    if (limit && limit !== -1) {
                        pipeline.push({
                            $skip: skip,
                        });

                        pipeline.push({
                            $limit: limit,
                        });
                    }

                    pipeline.push(...aggregateHelper.groupForUi());

                    PersonnelModel.aggregate(pipeline)
                    .allowDiskUse(true)
                    .exec((err, result) => {
                        if (err) {
                            return cb(err);
                        }

                        const data = result && result[0] ?
                            result[0] : { data: [], total: 0 };

                        cb(null, data);
                    });
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            },

        ], (err, response) => {
            if (err) {
                return next(err);
            }

            next({
                status: 200,
                body: response,
            });
        });
    }

    deleteByIds(req, res, next) {
        const setId = req.body.ids;

        const parallel = [];

        setId.forEach(id => {
            if (id.length === 24) {
                parallel.push((cb) => {
                    ObjectiveModel.findByIdAndRemove(id, (error, result) => {
                        if (error) {
                            return cb(error);
                        }

                        return cb(null, result);
                    });
                });
            }
        });

        if (setId.length !== parallel.length) {
            const error = new Error('Incorrect ID.');

            error.status = 400;
            return next(error);
        }

        async.parallel(parallel, (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    }

    getByIdHistory(req, res, next) {
        const queryRun = (callback) => {
            const id = ObjectId(req.params.id);
            const pipeline = [{
                $match: { person: id },
            }, {
                $project: {
                    _id: 1,
                    objective: 1,
                    person: 1,
                },
            }, {
                $lookup: {
                    from: 'personnels',
                    localField: 'person',
                    foreignField: '_id',
                    as: 'person',
                },
            }, {
                $lookup: {
                    from: 'objectives',
                    localField: 'objective',
                    foreignField: '_id',
                    as: 'objective',
                },
            }, {
                $project: {
                    _id: 1,
                    objective: { $arrayElemAt: ['$objective', 0] },
                    person: { $arrayElemAt: ['$person', 0] },
                },
            }, {
                $project: {
                    _id: 1,
                    objective: {
                        _id: '$objective._id',
                        title: '$objective.title',
                        status: '$objective.status',
                    },
                    person: {
                        _id: '$person._id',
                        firstName: '$person.firstName',
                        lastName: '$person.lastName',
                    },
                },
            }];

            ObjectiveHistoryModel.aggregate(pipeline)
                .allowDiskUse(true)
                .exec(callback);
        };

        async.waterfall([

            (cb) => {
                AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    }

    getByIdForObjectiveTreePreview(req, res, next) {
        const queryRun = (callback) => {
            const id = ObjectId(req.params.id);
            const isMobile = req.isMobile;

            const aggregateHelper = new AggregationHelper($defProjection);
            const pipeline = [];

            pipeline.push({
                $match: {
                    $or: [
                    { _id: id },
                    { 'parent.1': id },
                    { 'parent.2': id },
                    { 'parent.3': id },
                    { 'parent.4': id },
                    ],
                },
            });

            pipeline.push(...aggregateHelper.aggregationPartMaker({
                from: 'personnels',
                key: 'assignedTo',
                addProjection: ['firstName', 'lastName']
                    .concat(isMobile ? [] : ['position', 'accessRole', 'imageSrc']),
            }));

            pipeline.push(...aggregateHelper.aggregationPartMaker({
                from: 'personnels',
                key: 'createdBy.user',
                isArray: false,
                addProjection: ['_id', 'firstName', 'lastName']
                    .concat(isMobile ? [] : ['position', 'accessRole', 'imageSrc']),
                includeSiblings: {
                    createdBy: {
                        date: 1,
                    },
                },
            }));

            pipeline.push({
                $unwind: {
                    path: '$assignedTo',
                    preserveNullAndEmptyArrays: true,
                },
            });

            if (!isMobile) {
                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'accessRoles',
                    key: 'assignedTo.accessRole',
                    isArray: false,
                    addProjection: ['_id', 'name', 'level'],
                    includeSiblings: {
                        assignedTo: {
                            _id: 1,
                            position: 1,
                            firstName: 1,
                            lastName: 1,
                            imageSrc: 1,
                        },
                    },
                }));

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'positions',
                    key: 'assignedTo.position',
                    isArray: false,
                    includeSiblings: {
                        assignedTo: {
                            _id: 1,
                            accessRole: 1,
                            firstName: 1,
                            lastName: 1,
                            imageSrc: 1,
                        },
                    },
                }));
            }

            pipeline.push({
                $group: aggregateHelper.getGroupObject({
                    assignedTo: {
                        $addToSet: '$assignedTo',
                    },
                }),
            });

            if (!isMobile) {
                pipeline.push(...aggregateHelper.aggregationPartMaker({
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

                pipeline.push(...aggregateHelper.aggregationPartMaker({
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
            }

            pipeline.push({
                $project: aggregateHelper.getProjection({
                    assignedTo: {
                        $filter: {
                            input: '$assignedTo',
                            as: 'oneItem',
                            cond: {
                                $ne: ['$$oneItem', null],
                            },
                        },
                    },
                }),
            });

            pipeline.push({
                $project: aggregateHelper.getProjection({
                    parentNew: {
                        $cond: {
                            if: { $eq: ['$level', 1] },
                            then: 0,
                            else: {
                                $cond: {
                                    if: { $eq: ['$level', 2] },
                                    then: '$parent.1',
                                    else: {
                                        $cond: {
                                            if: { $eq: ['$level', 3] },
                                            then: '$parent.2',
                                            else: {
                                                $cond: {
                                                    if: { $eq: ['$level', 4] },
                                                    then: '$parent.3',
                                                    else: 0,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    child: [],
                }),
            });

            pipeline.push({
                $group: {
                    _id: '$level',
                    subTasks: {
                        $addToSet: '$$ROOT',
                    },
                },
            });

            ObjectiveModel.aggregate(pipeline)
                .allowDiskUse(true)
                .exec(callback);
        };

        async.waterfall([

            (cb) => {
                AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            if (result.length) {
                result.forEach((item) => {
                    const subTasks = item.subTasks;

                    subTasks.forEach((task) => {
                        task.description = {
                            en: _.unescape(_.get(task, 'description.en') || ''),
                            ar: _.unescape(_.get(task, 'description.ar') || ''),
                        };
                    });
                });
            }

            next({
                status: 200,
                body: result,
            });
        });
    }

}

module.exports = ObjectiveHandler;
