const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');
const detectObjectivesForSubordinates = require('./../../../reusableComponents/detectObjectivesForSubordinates');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const AccessManager = require('./../../../helpers/access')();
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const coveredByMe = require('./../../../helpers/coveredByMe');
const ObjectiveModel = require('./../../../types/objective/model');
const PersonnelModel = require('./../../../types/personnel/model');
const $defProjection = require('./../reusable-components/$defProjection');
const getAllPipeline = require('./../reusable-components/getAllPipeline');
const getAllPipelineTrue = require('./../reusable-components/getAllPipelineTrue');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;

    const queryRunForAdmins = (personnel, callback) => {
        const query = req.query;
        const lastLogOut = new Date(query.lastLogOut);
        const queryObject = {
            context: CONTENT_TYPES.OBJECTIVES,
        };
        const setSubordinateId = [];

        queryObject.$or = [
            {
                'editedBy.date': {
                    $gt: lastLogOut,
                },
            },
            {
                'createdBy.date': {
                    $gt: lastLogOut,
                },
            },
        ];

        async.waterfall([
            (cb) => {
                PersonnelModel.distinct('_id', {
                    manager: userId,
                }).exec((err, setAvailableSubordinateId) => {
                    if (err) {
                        return cb(err);
                    }

                    setSubordinateId.push(...setAvailableSubordinateId);

                    cb(null);
                });
            },
            (cb) => {
                const pipeLine = [
                    {
                        $match: queryObject,
                    },
                    {
                        $match: {
                            context: 'objectives',
                        },
                    },
                    {
                        $match: {
                            $or: [
                                {
                                    archived: false,
                                },
                                {
                                    archived: {
                                        $exists: false,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            setObjectives: {
                                $push: '$_id',
                            },
                            total: {
                                $sum: 1,
                            },
                        },
                    },
                    {
                        $unwind: '$setObjectives',
                    },
                    {
                        $lookup: {
                            from: 'objectives',
                            localField: 'setObjectives',
                            foreignField: '_id',
                            as: 'objective',
                        },
                    },
                    {
                        $project: {
                            objective: {
                                $let: {
                                    vars: {
                                        fields: {
                                            $arrayElemAt: [
                                                '$objective',
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        total: '$total',
                                        _id: '$$fields._id',
                                        assignedTo: '$$fields.assignedTo',
                                        createdBy: '$$fields.createdBy',
                                        title: '$$fields.title',
                                        companyObjective: '$$fields.companyObjective',
                                        description: '$$fields.description',
                                        objectiveType: '$$fields.objectiveType',
                                        priority: '$$fields.priority',
                                        status: '$$fields.status',
                                        complete: '$$fields.complete',
                                        parent: '$$fields.parent',
                                        level: '$$fields.level',
                                        countSubTasks: '$$fields.countSubTasks',
                                        completedSubTasks: '$$fields.completedSubTasks',
                                        dateStart: '$$fields.dateStart',
                                        dateEnd: '$$fields.dateEnd',
                                        dateClosed: '$$fields.dateClosed',
                                        comments: '$$fields.comments',
                                        attachments: '$$fields.attachments',
                                        editedBy: '$$fields.editedBy',
                                        country: '$$fields.country',
                                        region: '$$fields.region',
                                        subRegion: '$$fields.subRegion',
                                        retailSegment: '$$fields.retailSegment',
                                        outlet: '$$fields.outlet',
                                        branch: '$$fields.branch',
                                        location: '$$fields.location',
                                        form: '$$fields.form',
                                        efforts: '$$fields.efforts',
                                        context: '$$fields.context',
                                        creationDate: '$$fields.creationDate',
                                        updateDate: '$$fields.updateDate',
                                        archived: '$$fields.archived',
                                    },
                                },
                            },
                        },
                    },
                    {
                        $replaceRoot: {
                            newRoot: '$objective',
                        },
                    },
                    {
                        $addFields: {
                            parent: {
                                level1: '$parent.1',
                                level2: '$parent.2',
                                level3: '$parent.3',
                                level4: '$parent.4',
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: 'files',
                            localField: 'attachments',
                            foreignField: '_id',
                            as: 'attachments',
                        },
                    },
                    {
                        $project: {
                            total: 1,
                            assignedTo: 1,
                            createdBy: 1,
                            title: 1,
                            companyObjective: 1,
                            description: 1,
                            objectiveType: 1,
                            priority: 1,
                            status: 1,
                            complete: 1,
                            parent: 1,
                            level: 1,
                            history: 1,
                            countSubTasks: 1,
                            completedSubTasks: 1,
                            dateStart: 1,
                            dateEnd: 1,
                            dateClosed: 1,
                            comments: 1,
                            attachments: {
                                _id: 1,
                                name: 1,
                                contentType: 1,
                                originalName: 1,
                                createdBy: 1,
                                preview: 1,
                            },
                            editedBy: 1,
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
                        },
                    },
                    {
                        $lookup: {
                            from: 'domains',
                            localField: 'country',
                            foreignField: '_id',
                            as: 'country',
                        },
                    },
                    {
                        $project: {
                            total: 1,
                            assignedTo: 1,
                            createdBy: 1,
                            title: 1,
                            companyObjective: 1,
                            description: 1,
                            objectiveType: 1,
                            history: 1,
                            priority: 1,
                            status: 1,
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
                            country: {
                                _id: 1,
                                name: 1,
                            },
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
                        },
                    },
                    {
                        $lookup: {
                            from: 'domains',
                            localField: 'region',
                            foreignField: '_id',
                            as: 'region',
                        },
                    },
                    {
                        $project: {
                            total: 1,
                            assignedTo: 1,
                            createdBy: 1,
                            title: 1,
                            companyObjective: 1,
                            description: 1,
                            objectiveType: 1,
                            priority: 1,
                            status: 1,
                            complete: 1,
                            history: 1,
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
                            country: 1,
                            region: {
                                _id: 1,
                                name: 1,
                            },
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
                        },
                    },
                    {
                        $lookup: {
                            from: 'domains',
                            localField: 'subRegion',
                            foreignField: '_id',
                            as: 'subRegion',
                        },
                    },
                    {
                        $project: {
                            total: 1,
                            assignedTo: 1,
                            createdBy: 1,
                            title: 1,
                            companyObjective: 1,
                            history: 1,
                            description: 1,
                            objectiveType: 1,
                            priority: 1,
                            status: 1,
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
                            country: 1,
                            region: 1,
                            subRegion: {
                                _id: 1,
                                name: 1,
                            },
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
                        },
                    },
                    {
                        $lookup: {
                            from: 'retailSegments',
                            localField: 'retailSegment',
                            foreignField: '_id',
                            as: 'retailSegment',
                        },
                    },
                    {
                        $project: {
                            total: 1,
                            assignedTo: 1,
                            createdBy: 1,
                            title: 1,
                            companyObjective: 1,
                            description: 1,
                            objectiveType: 1,
                            priority: 1,
                            history: 1,
                            status: 1,
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
                            country: 1,
                            region: 1,
                            subRegion: 1,
                            retailSegment: {
                                _id: 1,
                                name: 1,
                            },
                            outlet: 1,
                            branch: 1,
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
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
                            total: 1,
                            assignedTo: 1,
                            createdBy: 1,
                            title: 1,
                            companyObjective: 1,
                            description: 1,
                            objectiveType: 1,
                            history: 1,
                            priority: 1,
                            status: 1,
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
                            country: 1,
                            region: 1,
                            subRegion: 1,
                            retailSegment: 1,
                            outlet: {
                                _id: 1,
                                name: 1,
                            },
                            branch: 1,
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: 'branches',
                            localField: 'branch',
                            foreignField: '_id',
                            as: 'branch',
                        },
                    },
                    {
                        $project: {
                            total: 1,
                            assignedTo: 1,
                            createdBy: '$createdBy.user',
                            title: 1,
                            companyObjective: 1,
                            history: 1,
                            description: 1,
                            objectiveType: 1,
                            priority: 1,
                            status: 1,
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
                            editedBy: '$editedBy.user',
                            country: 1,
                            region: 1,
                            subRegion: 1,
                            retailSegment: 1,
                            outlet: 1,
                            branch: {
                                _id: 1,
                                name: 1,
                            },
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: '$createdBy.date',
                            updateDate: '$editedBy.date',
                            archived: 1,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            data: {
                                $push: '$$ROOT',
                            },
                            total: {
                                $first: '$total',
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            total: 1,
                            data: 1,
                        },
                    },
                ];

                ObjectiveModel.aggregate(pipeLine)
                    .allowDiskUse(true)
                    .exec(cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const body = result.length ?
                result[0] : {data: [], total: 0};

            body.data.forEach(model => {
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
            });

            callback(null, body);
        });
    };

    const queryRun = (personnel, callback) => {
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
                const pipeLine = [
                    {
                        $match: queryObject,
                    },
                    {
                        $match: {
                            $or: [
                                {
                                    'createdBy.user': ObjectId(userId)
                                },
                                {
                                    status: {
                                        $nin: ['draft']
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $match: {
                            $or: [
                                {
                                    archived: false,
                                },
                                {
                                    archived: {
                                        $exists: false,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $project: {
                            parent: {
                                level1: '$parent.1',
                                level2: '$parent.2',
                                level3: '$parent.3',
                                level4: '$parent.4',
                            },
                            _id: 1,
                            title: 1,
                            companyObjective: 1,
                            description: 1,
                            objectiveType: 1,
                            priority: 1,
                            status: 1,
                            assignedTo: 1,
                            complete: 1,
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
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $first: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $first: '$country',
                            },
                            region: {
                                $first: '$region',
                            },
                            subRegion: {
                                $first: '$subRegion',
                            },
                            retailSegment: {
                                $first: '$retailSegment',
                            },
                            outlet: {
                                $first: '$outlet',
                            },
                            branch: {
                                $first: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $unwind: {
                            path: '$attachments',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'files',
                            localField: 'attachments',
                            foreignField: '_id',
                            as: 'attachments',
                        },
                    },
                    {
                        $project: {
                            attachments: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$attachments',
                                            [],
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        $arrayElemAt: [
                                            '$attachments',
                                            0,
                                        ],
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $project: {
                            attachments: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$attachments',
                                            null,
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        _id: '$attachments._id',
                                        name: '$attachments.name',
                                        contentType: '$attachments.contentType',
                                        originalName: '$attachments.originalName',
                                        createdBy: '$attachments.createdBy',
                                        preview: '$attachments.preview',
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $addToSet: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $first: '$country',
                            },
                            region: {
                                $first: '$region',
                            },
                            subRegion: {
                                $first: '$subRegion',
                            },
                            retailSegment: {
                                $first: '$retailSegment',
                            },
                            outlet: {
                                $first: '$outlet',
                            },
                            branch: {
                                $first: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $project: {
                            attachments: {
                                $filter: {
                                    input: '$attachments',
                                    as: 'oneItem',
                                    cond: {
                                        $ne: [
                                            '$$oneItem',
                                            null,
                                        ],
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $unwind: {
                            path: '$country',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'domains',
                            localField: 'country',
                            foreignField: '_id',
                            as: 'country',
                        },
                    },
                    {
                        $project: {
                            country: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$country',
                                            [],
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        $arrayElemAt: [
                                            '$country',
                                            0,
                                        ],
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $project: {
                            country: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$country',
                                            null,
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        _id: '$country._id',
                                        name: '$country.name',
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $first: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $addToSet: '$country',
                            },
                            region: {
                                $first: '$region',
                            },
                            subRegion: {
                                $first: '$subRegion',
                            },
                            retailSegment: {
                                $first: '$retailSegment',
                            },
                            outlet: {
                                $first: '$outlet',
                            },
                            branch: {
                                $first: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $project: {
                            country: {
                                $filter: {
                                    input: '$country',
                                    as: 'oneItem',
                                    cond: {
                                        $ne: [
                                            '$$oneItem',
                                            null,
                                        ],
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $unwind: {
                            path: '$region',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'domains',
                            localField: 'region',
                            foreignField: '_id',
                            as: 'region',
                        },
                    },
                    {
                        $project: {
                            region: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$region',
                                            [],
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        $arrayElemAt: [
                                            '$region',
                                            0,
                                        ],
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $project: {
                            region: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$region',
                                            null,
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        _id: '$region._id',
                                        name: '$region.name',
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $first: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $first: '$country',
                            },
                            region: {
                                $addToSet: '$region',
                            },
                            subRegion: {
                                $first: '$subRegion',
                            },
                            retailSegment: {
                                $first: '$retailSegment',
                            },
                            outlet: {
                                $first: '$outlet',
                            },
                            branch: {
                                $first: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $project: {
                            region: {
                                $filter: {
                                    input: '$region',
                                    as: 'oneItem',
                                    cond: {
                                        $ne: [
                                            '$$oneItem',
                                            null,
                                        ],
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $unwind: {
                            path: '$subRegion',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'domains',
                            localField: 'subRegion',
                            foreignField: '_id',
                            as: 'subRegion',
                        },
                    },
                    {
                        $project: {
                            subRegion: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$subRegion',
                                            [],
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        $arrayElemAt: [
                                            '$subRegion',
                                            0,
                                        ],
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $project: {
                            subRegion: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$subRegion',
                                            null,
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        _id: '$subRegion._id',
                                        name: '$subRegion.name',
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $first: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $first: '$country',
                            },
                            region: {
                                $first: '$region',
                            },
                            subRegion: {
                                $addToSet: '$subRegion',
                            },
                            retailSegment: {
                                $first: '$retailSegment',
                            },
                            outlet: {
                                $first: '$outlet',
                            },
                            branch: {
                                $first: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $project: {
                            subRegion: {
                                $filter: {
                                    input: '$subRegion',
                                    as: 'oneItem',
                                    cond: {
                                        $ne: [
                                            '$$oneItem',
                                            null,
                                        ],
                                    },
                                },
                            },
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
                        },
                    },
                    {
                        $unwind: {
                            path: '$retailSegment',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'retailSegments',
                            localField: 'retailSegment',
                            foreignField: '_id',
                            as: 'retailSegment',
                        },
                    },
                    {
                        $project: {
                            retailSegment: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$retailSegment',
                                            [],
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        $arrayElemAt: [
                                            '$retailSegment',
                                            0,
                                        ],
                                    },
                                },
                            },
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
                            outlet: 1,
                            branch: 1,
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $project: {
                            retailSegment: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$retailSegment',
                                            null,
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        _id: '$retailSegment._id',
                                        name: '$retailSegment.name',
                                    },
                                },
                            },
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
                            outlet: 1,
                            branch: 1,
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $first: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $first: '$country',
                            },
                            region: {
                                $first: '$region',
                            },
                            subRegion: {
                                $first: '$subRegion',
                            },
                            retailSegment: {
                                $addToSet: '$retailSegment',
                            },
                            outlet: {
                                $first: '$outlet',
                            },
                            branch: {
                                $first: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $project: {
                            retailSegment: {
                                $filter: {
                                    input: '$retailSegment',
                                    as: 'oneItem',
                                    cond: {
                                        $ne: [
                                            '$$oneItem',
                                            null,
                                        ],
                                    },
                                },
                            },
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
                            outlet: 1,
                            branch: 1,
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $unwind: {
                            path: '$outlet',
                            preserveNullAndEmptyArrays: true,
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
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$outlet',
                                            [],
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        $arrayElemAt: [
                                            '$outlet',
                                            0,
                                        ],
                                    },
                                },
                            },
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
                            branch: 1,
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $project: {
                            outlet: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$outlet',
                                            null,
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        _id: '$outlet._id',
                                        name: '$outlet.name',
                                    },
                                },
                            },
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
                            branch: 1,
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $first: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $first: '$country',
                            },
                            region: {
                                $first: '$region',
                            },
                            subRegion: {
                                $first: '$subRegion',
                            },
                            retailSegment: {
                                $first: '$retailSegment',
                            },
                            outlet: {
                                $addToSet: '$outlet',
                            },
                            branch: {
                                $first: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $project: {
                            outlet: {
                                $filter: {
                                    input: '$outlet',
                                    as: 'oneItem',
                                    cond: {
                                        $ne: [
                                            '$$oneItem',
                                            null,
                                        ],
                                    },
                                },
                            },
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
                            branch: 1,
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $unwind: {
                            path: '$branch',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'branches',
                            localField: 'branch',
                            foreignField: '_id',
                            as: 'branch',
                        },
                    },
                    {
                        $project: {
                            branch: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$branch',
                                            [],
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        $arrayElemAt: [
                                            '$branch',
                                            0,
                                        ],
                                    },
                                },
                            },
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
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $project: {
                            branch: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$branch',
                                            null,
                                        ],
                                    },
                                    then: null,
                                    else: {
                                        _id: '$branch._id',
                                        name: '$branch.name',
                                    },
                                },
                            },
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
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $first: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $first: '$country',
                            },
                            region: {
                                $first: '$region',
                            },
                            subRegion: {
                                $first: '$subRegion',
                            },
                            retailSegment: {
                                $first: '$retailSegment',
                            },
                            outlet: {
                                $first: '$outlet',
                            },
                            branch: {
                                $addToSet: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $project: {
                            branch: {
                                $filter: {
                                    input: '$branch',
                                    as: 'oneItem',
                                    cond: {
                                        $ne: [
                                            '$$oneItem',
                                            null,
                                        ],
                                    },
                                },
                            },
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
                            location: 1,
                            form: 1,
                            efforts: 1,
                            context: 1,
                            creationDate: 1,
                            updateDate: 1,
                            archived: 1,
                        },
                    },
                    {
                        $group: {
                            _id: '$_id',
                            title: {
                                $first: '$title',
                            },
                            companyObjective: {
                                $first: '$companyObjective',
                            },
                            description: {
                                $first: '$description',
                            },
                            objectiveType: {
                                $first: '$objectiveType',
                            },
                            priority: {
                                $first: '$priority',
                            },
                            status: {
                                $first: '$status',
                            },
                            assignedTo: {
                                $first: '$assignedTo',
                            },
                            complete: {
                                $first: '$complete',
                            },
                            parent: {
                                $first: '$parent',
                            },
                            level: {
                                $first: '$level',
                            },
                            countSubTasks: {
                                $first: '$countSubTasks',
                            },
                            completedSubTasks: {
                                $first: '$completedSubTasks',
                            },
                            dateStart: {
                                $first: '$dateStart',
                            },
                            dateEnd: {
                                $first: '$dateEnd',
                            },
                            dateClosed: {
                                $first: '$dateClosed',
                            },
                            comments: {
                                $first: '$comments',
                            },
                            attachments: {
                                $first: '$attachments',
                            },
                            editedBy: {
                                $first: '$editedBy',
                            },
                            createdBy: {
                                $first: '$createdBy',
                            },
                            country: {
                                $first: '$country',
                            },
                            region: {
                                $first: '$region',
                            },
                            subRegion: {
                                $first: '$subRegion',
                            },
                            retailSegment: {
                                $first: '$retailSegment',
                            },
                            outlet: {
                                $first: '$outlet',
                            },
                            branch: {
                                $first: '$branch',
                            },
                            location: {
                                $first: '$location',
                            },
                            form: {
                                $first: '$form',
                            },
                            efforts: {
                                $first: '$efforts',
                            },
                            context: {
                                $first: '$context',
                            },
                            creationDate: {
                                $first: '$creationDate',
                            },
                            updateDate: {
                                $first: '$updateDate',
                            },
                            archived: {
                                $first: '$archived',
                            },
                        },
                    },
                    {
                        $project: {
                            creationDate: '$createdBy.date',
                            updateDate: '$editedBy.date',
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
                            archived: 1,
                        },
                    },
                    {
                        $project: {
                            lastDate: {
                                $ifNull: [
                                    '$editedBy.date',
                                    '$createdBy.date',
                                ],
                            },
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
                        },
                    },
                    {
                        $sort: {
                            lastDate: -1,
                        },
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
                            title: '$data.title',
                            companyObjective: '$data.companyObjective',
                            description: '$data.description',
                            objectiveType: '$data.objectiveType',
                            priority: '$data.priority',
                            status: '$data.status',
                            assignedTo: '$data.assignedTo',
                            complete: '$data.complete',
                            parent: '$data.parent',
                            level: '$data.level',
                            countSubTasks: '$data.countSubTasks',
                            completedSubTasks: '$data.completedSubTasks',
                            dateStart: '$data.dateStart',
                            dateEnd: '$data.dateEnd',
                            dateClosed: '$data.dateClosed',
                            comments: '$data.comments',
                            attachments: '$data.attachments',
                            editedBy: '$data.editedBy.user',
                            createdBy: '$data.createdBy.user',
                            country: '$data.country',
                            region: '$data.region',
                            subRegion: '$data.subRegion',
                            retailSegment: '$data.retailSegment',
                            outlet: '$data.outlet',
                            branch: '$data.branch',
                            location: '$data.location',
                            form: '$data.form',
                            efforts: '$data.efforts',
                            context: '$data.context',
                            creationDate: '$data.createdBy.date',
                            updateDate: '$data.editedBy.date',
                            archived: '$data.archived',
                            total: 1,
                        },
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

                ObjectiveModel.aggregate(pipeLine)
                    .allowDiskUse(true)
                    .exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const body = result.length ?
                result[0] : {data: [], total: 0};

            body.data.forEach(model => {
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
            });

            const setSubordinateStringId = setSubordinateObjectId.map((ObjectId) => {
                return ObjectId.toString();
            });

            body.data = detectObjectivesForSubordinates(body.data, setSubordinateStringId, userId);

            callback(null, body);
        });
    };

    async.waterfall([

        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (allowed, personnel, cb) => {
            const isAdmin = [
                ACL_CONSTANTS.MASTER_ADMIN,
                ACL_CONSTANTS.COUNTRY_ADMIN,
                ACL_CONSTANTS.AREA_MANAGER,
                ACL_CONSTANTS.AREA_IN_CHARGE,
            ].indexOf(accessRoleLevel) !== -1;

            if (isAdmin) {
                queryRunForAdmins(personnel, cb);
            } else {
                queryRun(personnel, cb);
            }
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
};
