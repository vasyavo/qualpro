const async = require('async');
const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const QuestionnaryModel = require('./../types/questionnaries/model');
const QuestionnaryAnswerModel = require('./../types/questionnariesAnswer/model');
const PersonnelModel = require('./../types/personnel/model');
const EventModel = require('./../types/event/model');
const ACL_CONSTANTS = require('../constants/aclRolesNames');
const ACL_MODULES = require('../constants/aclModulesNames');
const CONTENT_TYPES = require('../public/js/constants/contentType');
const CONSTANTS = require('../constants/mainConstants');
const FilterMapper = require('../helpers/filterMapper');
const bodyValidator = require('../helpers/bodyValidator');
const AggregationHelper = require('../helpers/aggregationCreater');
const access = require('../helpers/access')();
const ActivityLog = require('./../stories/push-notifications/activityLog');

const QuestionnaryHandler = function () {
    const $defProjection = {
        _id: 1,
        title: 1,
        dueDate: 1,
        country: 1,
        region: 1,
        subRegion: 1,
        retailSegment: 1,
        outlet: 1,
        branch: 1,
        countAll: 1,
        countAnswered: 1,
        status: 1,
        questions: 1,
        location: 1,
        editedBy: 1,
        createdBy: 1,
        creationDate: 1,
        updateDate: 1,
        position: 1,
        personnels: 1
    };
    const $answerDefProjection = {
        _id: 1,
        personnel: 1,
        personnelId: 1,
        questionnaryId: 1,
        questionId: 1,
        optionIndex: 1,
        editedBy: 1,
        createdBy: 1,
        branch: 1,
        outlet: 1,
        retailSegment: 1,
        subRegion: 1,
        region: 1,
        country: 1,
        text: 1,
        position: 1
    };
    const self = this;
    const sendEventThatAnswerIsPublished = (options) => {
        const {
            questionnaireId,
            actionOriginator,
            accessRoleLevel,
        } = options;

        QuestionnaryModel.findById(questionnaireId)
            .lean()
            .exec((err, questionnaire) => {
                if (err || !questionnaire) return;

                ActivityLog.emit('marketing:al-alali-questionnaire:item-published', {
                    actionOriginator,
                    accessRoleLevel,
                    body: questionnaire,
                });
            });
    };

    const filterRetrievedResultOnGetAll = (options, cb) => {
        const result = options.result;

        if (result.length) {
            result[0].data = result[0].data
                .filter((item) => (item))
                .map((model) => {
                    if (model.title) {
                        model.title = {
                            en: _.unescape(model.title.en),
                            ar: _.unescape(model.title.ar)
                        };
                    }

                    if (model.questions && model.questions.length) {
                        model.questions = model.questions
                            .filter((item) => (item))
                            .map((question) => {
                                if (question.title) {
                                    question.title = {
                                        en: _.unescape(question.title.en),
                                        ar: _.unescape(question.title.ar)
                                    };
                                }

                                if (question.options && question.options.length) {
                                    question.options = question.options
                                        .filter((item) => (item))
                                        .map((option) => {
                                            return {
                                                en: _.unescape(option.en),
                                                ar: _.unescape(option.ar)
                                            };
                                        });
                                }

                                return question;
                            });
                    }

                    return model;
                });
        }

        const body = result && result[0] ?
            result[0] : { data: [], total: 0 };

        cb(null, body);
    };

    const createOrUpdateQuestionnaryAnswer = (options, callback) => {
        const {
            data,
            createdBy,
            personnelId
        } = options;

        let personnelAnswerExists = true;
        let updater = {};
        let update;

        async.waterfall([
            function (waterfallCB) {
                if (data && !data.answers) {
                    data.answers = [];
                }

                // each answer of questionnary
                async.each(data.answers, (answer, eachCallback) => {
                    const newAnswer = {
                        personnelId   : personnelId,
                        questionnaryId: data.questionnaryId,
                        questionId    : answer.questionId,
                        country       : data.country,
                        region        : data.region,
                        subRegion     : data.subRegion,
                        retailSegment : data.retailSegment,
                        outlet        : data.outlet,
                        branch        : data.branch
                    };

                    // if option
                    if (answer.optionIndex && answer.optionIndex.length) {
                        newAnswer.optionIndex = answer.optionIndex;
                    }

                    // if fullAnswer
                    if (answer.text && Object.keys(answer.text).length) {
                        newAnswer.text = {
                            en: _.escape(answer.text.en),
                            ar: _.escape(answer.text.ar)
                        }
                    }

                    async.waterfall([
                        function (waterfallCb) {
                            const query = {
                                personnelId   : personnelId,
                                questionnaryId: newAnswer.questionnaryId
                            };

                            QuestionnaryAnswerModel.findOne(query, function (err, result) {
                                if (err) {
                                    return waterfallCb(err);
                                }

                                if (!result) {
                                    personnelAnswerExists = false;
                                }

                                waterfallCb(null);
                            });
                        },

                        function (waterfallCb) {
                            const query = {
                                personnelId   : personnelId,
                                questionnaryId: newAnswer.questionnaryId,
                                questionId    : newAnswer.questionId,
                                branch        : newAnswer.branch
                            };

                            QuestionnaryAnswerModel.findOne(query, function (err, result) {
                                if (err) {
                                    return waterfallCb(err);
                                }

                                if (!result) {
                                    return waterfallCb(null, false);
                                }

                                waterfallCb(null, result._id.toString());
                            });
                        },

                        function (questionAnswerIdToUpdate, waterfallCb) {
                            if (questionAnswerIdToUpdate) {
                                newAnswer.editedBy = createdBy;

                                QuestionnaryAnswerModel.update({_id: questionAnswerIdToUpdate}, {$set: newAnswer}, function (err) {
                                    if (err) {
                                        return waterfallCb(err);
                                    }
                                    update = true;
                                    waterfallCb(null);
                                });

                            } else {
                                newAnswer.createdBy = createdBy;
                                newAnswer.editedBy = createdBy;

                                QuestionnaryAnswerModel.create(newAnswer, function (err) {
                                    if (err) {
                                        return waterfallCb(err);
                                    }
                                    waterfallCb(null);
                                });
                            }
                        }
                    ], eachCallback);
                }, (err) => {
                    if (err) {
                        return waterfallCB(err);
                    }

                    waterfallCB(null);
                });
            },

            function (waterfallCB) {
                QuestionnaryModel.findById(data.questionnaryId, function (err, questionnary) {
                    var error;

                    if (err) {
                        return waterfallCB(err);
                    }

                    if (!questionnary) {
                        error = new Error('Questionnary not found');
                        error.status = 404;

                        return waterfallCB(error);
                    }

                    waterfallCB(null, questionnary);
                });
            },

            function (questionnary, waterfallCB) {
                if (update) {
                    return waterfallCB(null);
                }

                updater.$inc = personnelAnswerExists ? {countBranches: -1} : {countAnswered: 1, countBranches: -1};

                updater.editedBy = createdBy;

                QuestionnaryModel.findByIdAndUpdate(data.questionnaryId, updater, function (err) {
                    if (err) {
                        return waterfallCB(err);
                    }

                    waterfallCB(null);
                });
            }
        ], callback);
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel, callback) {
            const query = req.query;
            const accessRoleLevel = req.session.level;
            const lastLogOut = new Date(query.lastLogOut);
            const filterMapper = new FilterMapper();
            const queryFilter = query.filter || {};
            const locations = ['country', 'region', 'subRegion', 'branch'];

            if (personnel.accessRole.level === ACL_CONSTANTS.AREA_IN_CHARGE) {
                locations.pop();
            }

            const sort = {
                lastDate: -1,
            };

            delete queryFilter.globalSearch;

            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.QUESTIONNARIES,
                filter: queryFilter,
            });

            const aggregateHelper = new AggregationHelper($defProjection, queryObject);

            queryObject.$and = [
                {
                    // standard synchronization behaviour
                    $or: [
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
                    ],
                },
                {
                    status: { $nin: ['draft', 'expired'] },
                },
                {
                    dueDate: {
                        $gt: new Date(),
                    },
                },
            ];

            const pipeline = [];

            const $generalMatch = {
                $and: [],
            };

            $generalMatch.$and.push(queryObject);

            const $locationMatch = {
                $and: [],
            };

            locations.forEach((location) => {
                if (personnel[location] && personnel[location].length && !queryObject[location]) {
                    $locationMatch.$and.push({
                        $or: [
                            {
                                [location]: { $in: personnel[location] },
                            },
                            {
                                [location]: { $eq: [] },
                            },
                            {
                                [location]: { $eq: null },
                            },
                            {
                                'createdBy.user': { $eq: personnel._id },
                            },
                            {
                                personnels: personnel._id,
                            },
                        ],
                    });
                }
            });

            if ($locationMatch.$and.length) {
                pipeline.push({
                    $match: $locationMatch,
                });
            }

            async.waterfall([
                (cb) => {
                    PersonnelModel.aggregate([
                        {
                            $match: {
                                _id: personnel._id,
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
                                retailSegments: '$branch.retailSegment',
                                outlets: '$branch.outlet',
                            },
                        },
                    ], cb);
                },

                (result, cb) => {
                    const personnelRetailSegments = result && result[0] && result[0].retailSegments;
                    const personnelOutlets = result && result[0] && result[0].outlets;

                    if (personnelRetailSegments.length) {
                        $generalMatch.$and.push({
                            $or: [
                                {
                                    retailSegment: {
                                        $in: personnelRetailSegments,
                                    },
                                },
                                {
                                    retailSegment: { $eq: [] },
                                },
                                {
                                    retailSegment: { $eq: null },
                                },
                                {
                                    'createdBy.user': { $eq: personnel._id },
                                },
                                {
                                    personnels: personnel._id,
                                },
                            ],
                        });
                    }

                    if (personnelOutlets.length) {
                        $generalMatch.$and.push({
                            $or: [
                                {
                                    outlet: {
                                        $in: personnelOutlets,
                                    },
                                },
                                {
                                    outlet: { $eq: [] },
                                },
                                {
                                    outlet: { $eq: null },
                                },
                                {
                                    'createdBy.user': { $eq: personnel._id },
                                },
                                {
                                    personnels: personnel._id,
                                },
                            ],
                        });
                    }

                    $generalMatch.$and.push({
                        $or: [
                            {
                                personnels: personnel._id,
                            },
                            {
                                personnels: [],
                            },
                            {
                                personnels: null,
                            },
                        ],
                    });

                    pipeline.push({
                        $match: $generalMatch,
                    });

                    pipeline.push({
                        $addFields: {
                            creationDate: '$createdBy.date',
                            updateDate: '$editedBy.date',
                            lastDate: {
                                $ifNull: [
                                    '$editedBy.date',
                                    '$createdBy.date',
                                ],
                            },
                        },
                    });

                    pipeline.push({
                        $sort: sort,
                    });

                    pipeline.push(...aggregateHelper.setTotal());

                    pipeline.push(...aggregateHelper.groupForUi());

                    const aggregation = QuestionnaryModel.aggregate(pipeline);

                    aggregation.options = {
                        allowDiskUse: true,
                    };

                    aggregation.exec(cb);
                },

                (result, cb) => {
                    filterRetrievedResultOnGetAll({
                        personnel,
                        accessRoleLevel,
                        result,
                    }, cb);
                },

            ], callback);
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE),

            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            },

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            return next({
                status: 200,
                body,
            });
        });
    };

    this.getAll = function (req, res, next) {
        function queryRun(personnel, callback) {
            const isMobile = req.isMobile;
            const query = req.query;
            const page = query.page || 1;
            const accessRoleLevel = req.session.level;
            const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            const skip = (page - 1) * limit;
            const filterMapper = new FilterMapper();
            const queryFilter = query.filter || {};
            const filterSearch = queryFilter.globalSearch || '';
            const locations = ['country', 'region', 'subRegion', 'branch'];
            const pipeline = [];

            const searchFieldsArray = [
                'title.en',
                'title.ar',
            ];

            const sort = query.sort || {
                dueDate: -1,
            };

            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.QUESTIONNARIES,
                filter: queryFilter,
            });

            if (queryObject.globalSearch) {
                delete queryObject.globalSearch;
            }

            let positionFilter;

            if (queryObject.position) {
                positionFilter = queryObject.position;
                delete queryObject.position;
            }

            let personnelFilter;

            if (queryObject.personnel) {
                personnelFilter = queryObject.personnel;
                delete queryObject.personnel;
            }

            let publisherFilter;

            if (queryObject.publisher) {
                publisherFilter = queryObject.publisher;
                delete queryObject.publisher;
            }

            const aggregateHelper = new AggregationHelper($defProjection);
            const $generalMatch = {
                $and: [],
            };

            if (isMobile) {
                // user sees only ongoing questionnaire via mobile app
                const currentDate = new Date();

                queryObject.dueDate = {
                    $gt: currentDate,
                };

                queryObject.status = {
                    $nin: ['draft', 'expired'],
                };
            } else if (accessRoleLevel !== ACL_CONSTANTS.MASTER_ADMIN) {
                $generalMatch.$and.push({
                    $or: [
                        {
                            'createdBy.user': personnel._id,
                            status: { $in: ['draft', 'expired'] },
                        }, {
                            status: { $nin: ['draft', 'expired'] },
                        },
                    ],
                });
            } else {
                $generalMatch.$and.push({
                    $or: [
                        {
                            'createdBy.user': personnel._id,
                            status: { $in: ['draft'] },
                        }, {
                            status: { $nin: ['draft'] },
                        },
                    ],
                });
            }

            $generalMatch.$and.push(queryObject);

            if (personnelFilter) {
                $generalMatch.$and.push({
                    personnels: personnelFilter,
                });
            }

            if (publisherFilter) {
                $generalMatch.$and.push({
                    'createdBy.user': publisherFilter,
                });
            }

            const $locationMatch = {
                $and: [],
            };

            if (req.session.level === ACL_CONSTANTS.AREA_IN_CHARGE) {
                locations.pop();
            }

            locations.forEach((location) => {
                if (personnel[location] && personnel[location].length && !queryObject[location]) {
                    $locationMatch.$and.push({
                        $or: [
                            {
                                [location]: { $in: personnel[location] },
                            },
                            {
                                [location]: { $eq: [] },
                            },
                            {
                                [location]: { $eq: null },
                            },
                            {
                                'createdBy.user': { $eq: personnel._id },
                            },
                            {
                                personnels: personnel._id,
                            },
                        ],
                    });
                }
            });

            if ($locationMatch.$and.length) {
                pipeline.push({
                    $match: $locationMatch,
                });
            }

            async.waterfall([
                (cb) => {
                    PersonnelModel.aggregate([
                        {
                            $match: {
                                _id: personnel._id,
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
                                retailSegments: '$branch.retailSegment',
                                outlets: '$branch.outlet',
                            },
                        },
                    ], cb);
                },

                (result, cb) => {
                    const personnelRetailSegments = result && result[0] && result[0].retailSegments;
                    const personnelOutlets = result && result[0] && result[0].outlets;

                    if (personnelRetailSegments.length) {
                        $generalMatch.$and.push({
                            $or: [
                                {
                                    retailSegment: {
                                        $in: personnelRetailSegments,
                                    },
                                },
                                {
                                    retailSegment: { $eq: [] },
                                },
                                {
                                    retailSegment: { $eq: null },
                                },
                                {
                                    'createdBy.user': { $eq: personnel._id },
                                },
                                {
                                    personnels: personnel._id,
                                },
                            ],
                        });
                    }

                    if (personnelOutlets.length) {
                        $generalMatch.$and.push({
                            $or: [
                                {
                                    outlet: {
                                        $in: personnelOutlets,
                                    },
                                },
                                {
                                    outlet: { $eq: [] },
                                },
                                {
                                    outlet: { $eq: null },
                                },
                                {
                                    'createdBy.user': { $eq: personnel._id },
                                },
                                {
                                    personnels: personnel._id,
                                },
                            ],
                        });
                    }

                    pipeline.push({
                        $match: {
                            $or: [
                                {
                                    personnels: personnel._id,
                                },
                                {
                                    personnels: [],
                                },
                            ],
                        },
                    });

                    // remove for onLeave functionality
                   /* $generalMatch.$and.push({
                        $or: [
                            {
                                personnels: personnel._id,
                            },
                            {
                                personnels: [],
                            },
                            {
                                personnels: null,
                            },
                            {
                                'createdBy.user': { $eq: personnel._id },
                            },
                        ],
                    });*/

                    pipeline.push({
                        $match: $generalMatch,
                    });

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'personnels',
                        key: 'createdBy.user',
                        isArray: false,
                        addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
                        includeSiblings: { createdBy: { date: 1 } },
                    }));

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'personnels',
                        key: 'personnels',
                        addMainProjection: ['position'],
                        isArray: true,
                    }));

                    if (positionFilter) {
                        pipeline.push({
                            $match: {
                                $or: [
                                    {
                                        position: positionFilter,
                                    },
                                    {
                                        'createdBy.user.position': positionFilter,
                                    },
                                ],
                            },
                        });
                    }

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
                        $unwind: {
                            path: '$personnels',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeline.push({
                        $project: aggregateHelper.getProjection({
                            personnel: '$personnels._id',
                        }),
                    });

                    pipeline.push({
                        $group: aggregateHelper.getGroupObject({
                            personnels: {
                                $addToSet: '$personnel',
                            },
                        }),
                    });

                    pipeline.push(...aggregateHelper.endOfPipeLine({
                        isMobile,
                        filterSearch,
                        searchFieldsArray,
                        skip,
                        limit,
                        sort,
                    }));

                    const aggregation = QuestionnaryModel.aggregate(pipeline);

                    aggregation.options = {
                        allowDiskUse: true,
                    };

                    aggregation.exec(cb);
                },

                (result, cb) => {
                    filterRetrievedResultOnGetAll({
                        personnel,
                        accessRoleLevel,
                        result,
                    }, cb);
                },

            ], callback);
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE),

            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            },

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            return next({
                status: 200,
                body,
            });
        });
    };

    this.create = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var aggregateHelper = new AggregationHelper($defProjection);

            async.waterfall([
                function (waterfallCb) {
                    var pipeLine = [];
                    var $match = {
                        $and: [],
                    };
                    var retailSegmentFilter;
                    var outletFilter;
                    const locations = ['country', 'region', 'subRegion', 'branch'];

                    locations.forEach((location) => {
                        if (body[location]) {
                            body[location] = body[location].length ? body[location] : [body[location]];

                            $match.$and.push({
                                $or: [
                                    {
                                        [location]: {
                                            $in: body[location].objectID(),
                                        },
                                    },
                                    {
                                        [location]: [],
                                    },
                                    {
                                        [location]: null,
                                    },
                                ],
                            });
                        }
                    });

                    if (body.personnel) {
                        body.personnel = body.personnel.length ? body.personnel : [body.personnel];
                        $match.$and.push({
                            _id: {
                                $in: body.personnel.objectID(),
                            },
                        });
                    }

                    if (body.position) {
                        body.position = body.position.length ? body.position : [body.position.length];

                        $match.$and.push({
                            position: {
                                $in: body.position.objectID()
                            },
                        });
                    }

                    pipeLine.push({
                        $match,
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from         : 'accessRoles',
                        key          : 'accessRole',
                        isArray      : false,
                        addProjection: ['level'],
                    }));

                    if (body.retailSegment) {
                        body.retailSegment = body.retailSegment.length ? body.retailSegment : [body.retailSegment.length];
                        retailSegmentFilter = {$in: body.retailSegment.objectID()};
                    }

                    if (body.outlet) {
                        body.outlet = body.outlet.length ? body.outlet : [body.outlet.length];
                        outletFilter = {$in: body.outlet.objectID()};
                    }

                    if (retailSegmentFilter || outletFilter) {
                        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                            from         : 'branches',
                            key          : 'branch',
                            isArray      : true,
                            addProjection: ['retailSegment', 'outlet']
                        }));

                        pipeLine.push({
                            $unwind: {
                                path                      : '$branch',
                                preserveNullAndEmptyArrays: true
                            }
                        });

                        if (retailSegmentFilter) {
                            pipeLine.push({
                                $match: {
                                    'branch.retailSegment': retailSegmentFilter
                                }
                            })
                        }

                        if (outletFilter) {
                            pipeLine.push({
                                $match: {
                                    'branch.outlet': outletFilter
                                }
                            })
                        }

                        pipeLine.push({
                            $group: aggregateHelper.getGroupObject({
                                branch: {
                                    $addToSet: '$branch'
                                }
                            })
                        });

                    }

                    pipeLine.push({
                        $group: {
                            _id            : null,
                            personnelsIds  : {$addToSet: '$_id'},
                            personnelsCount: {
                                $sum: 1
                            },

                            branchesCount: {
                                $sum: {
                                    $size: '$branch'
                                }
                            }
                        }
                    });

                    PersonnelModel.aggregate(pipeLine, function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        result = result && result.length ? result[0] : {};

                        waterfallCb(null, result);
                    });
                },
                function (resultObject, waterfallCb) {
                    var personnelIds = resultObject.personnelsIds;
                    var personnelCount = resultObject.personnelsCount;
                    var branchCount = resultObject.branchesCount;
                    var createdBy = {
                        user: req.session.uId,
                        date: new Date()
                    };

                    if (body.title) {
                        body.title = {
                            en: _.escape(body.title.en),
                            ar: _.escape(body.title.ar)
                        };
                    }

                    if (body.questions && body.questions.length) {
                        body.questions = _.map(body.questions, function (question) {
                            if (question.title) {
                                question.title = {
                                    en: _.escape(question.title.en),
                                    ar: _.escape(question.title.ar)
                                };
                            }
                            if (question.options && question.options.length) {
                                question.options = _.map(question.options, function (option) {
                                    if (option) {
                                        return {
                                            en: _.escape(option.en),
                                            ar: _.escape(option.ar)
                                        };
                                    }
                                });
                            }
                            return question;
                        });
                    }

                    body.countAll = personnelCount;
                    body.countBranches = branchCount;
                    body.status = 'draft';
                    body.dueDate = new Date(body.dueDate);
                    body.personnels = personnelIds;
                    body.createdBy = createdBy;
                    body.editedBy = createdBy;

                    if (body.send) {
                        body.status = 'active';
                    }

                    QuestionnaryModel.create(body, function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        const eventPayload = {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: result.toJSON(),
                        };

                        if (body.send) {
                            ActivityLog.emit('marketing:al-alali-questionnaire:published', eventPayload);
                        } else {
                            ActivityLog.emit('marketing:al-alali-questionnaire:draft-created', eventPayload);
                        }

                        waterfallCb(null, result._id);
                    });
                },
                function (id, waterfallCb) {
                    self.getByIdAggr({id: id}, waterfallCb);
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: result});
            });
        }

        access.getWriteAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, function (err, allowed) {
            var body;

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
                    body = JSON.parse(req.body.data);
                } else {
                    body = req.body;
                }
            } catch (err) {
                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.QUESTIONNARIES, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });

    };

    this.update = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var id = req.params.id;
            var fullUpdate = {
                $set: body
            };

            async.waterfall([
                function (waterfallCb) {
                    var pipeLine = [];
                    var $match = {};

                    if (body.country) {
                        body.country = body.country.length ? body.country : [body.country.length];
                        $match.country = {$in: body.country.objectID()};
                    }

                    if (body.region) {
                        body.region = body.region.length ? body.region : [body.region.length];
                        $match.region = {$in: body.region.objectID()};
                    }

                    if (body.subRegion) {
                        body.subRegion = body.subRegion.length ? body.subRegion : [body.subRegion.length];
                        $match.subRegion = {$in: body.subRegion.objectID()};
                    }

                    if (body.retailSegment) {
                        body.retailSegment = body.retailSegment.length ? body.retailSegment : [body.retailSegment.length];
                        $match.retailSegment = {$in: body.retailSegment.objectID()};
                    }

                    if (body.outlet) {
                        body.outlet = body.outlet.length ? body.outlet : [body.outlet.length];
                        $match.outlet = {$in: body.outlet.objectID()};
                    }

                    if (body.branch) {
                        body.branch = body.branch.length ? body.branch : [body.branch.length];
                        $match.branch = {$in: body.branch.objectID()};
                    }

                    if (Object.keys($match).length) {
                        pipeLine.push({
                            $match: $match
                        });

                        pipeLine.push({
                            $group: {
                                _id            : null,
                                personnelsIds  : {$addToSet: '$_id'},
                                personnelsCount: {
                                    $sum: 1
                                },

                                branchesCount: {
                                    $sum: {
                                        $size: '$branch'
                                    }
                                }
                            }
                        });

                        PersonnelModel.aggregate(pipeLine, function (err, result) {
                            if (err) {
                                return waterfallCb(err);
                            }

                            result = result && result.length ? result[0] : {};

                            waterfallCb(null, result);
                        });
                    } else {
                        return waterfallCb(null, {});
                    }
                },
                function (resultObject, waterfallCb) {
                    var personnelIds = resultObject.personnelsIds;
                    var personnelCount = resultObject.personnelsCount;
                    var branchCount = resultObject.branchesCount;

                    if (body.title) {
                        body.title = {
                            en: _.escape(body.title.en),
                            ar: _.escape(body.title.ar)
                        };
                    }

                    if (body.questions && body.questions.length) {
                        body.questions = _.map(body.questions, function (question) {
                            if (question.title) {
                                question.title = {
                                    en: _.escape(question.title.en),
                                    ar: _.escape(question.title.ar)
                                };
                            }
                            if (question.options && question.options.length) {
                                question.options = _.map(question.options, function (option) {
                                    if (option) {
                                        return {
                                            en: _.escape(option.en),
                                            ar: _.escape(option.ar)
                                        };
                                    }
                                });
                            }
                            return question;
                        });
                    }

                    if (body.dueDate) {
                        body.dueDate = new Date(body.dueDate);
                    }

                    if (personnelCount) {
                        body.countAll = personnelCount;
                        body.countBranches = branchCount;
                        body.personnels = personnelIds;
                    }

                    body.editedBy = {
                        user: req.session.uId,
                        date: new Date()
                    };
                    body.status = body.send ? 'active' : 'draft';

                    QuestionnaryModel.findByIdAndUpdate(id, fullUpdate, {new: true}, function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        const eventPayload = {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: result.toJSON(),
                        };

                        ActivityLog.emit('marketing:al-alali-questionnaire:updated', eventPayload);

                        waterfallCb(null, result._id);
                    });
                },
                function (id, waterfallCb) {
                    self.getByIdAggr({id: id}, waterfallCb);
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                next({status: 200, body: result});
            });
        }

        access.getWriteAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, function (err, allowed) {
            var body;

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
                    body = JSON.parse(req.body.data);
                } else {
                    body = req.body;
                }
            } catch (err) {
                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.QUESTIONNARIES, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });

    };

    this.updateAnswer = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const requestBody = req.body;
        const id = req.params.id;

        const queryRun = (body, callback) => {
            body.editedBy = {
                user: userId,
                date: Date.now()
            };
            QuestionnaryAnswerModel.findByIdAndUpdate(id, body, { new: true }).exec(callback);
        };

        async.waterfall([
            (cb) => {
                access.getEditAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, cb);
            },

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(requestBody, accessRoleLevel, CONTENT_TYPES.QUESTIONNARIES_ANSWER, 'update', cb);
            },

            (body, cb) => {
                queryRun(body, cb);
            },

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(body);
        });
    };
    
    this.removeItem = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;
        const id = req.params.id;
        
        const queryRun = (callback) => {
            async.waterfall([
                
                (cb) => {
                    QuestionnaryAnswerModel.findOne({ _id : id }).lean().exec(cb);
                },
                (removeItem, cb) => {
                    const eventModel = new EventModel();
                    const options = {
                        headers: {
                            contentType: "QuestionnaryAnswer",
                            actionType : "remove",
                            user       : userId,
                        },
                        payload: removeItem
                    };
                    eventModel.set(options);
                    eventModel.save((err) => {
                        cb(null, err);
                    });
                },
                (err) => {
                    if (err) {
                        if (!res.headersSent) {
                            next(err);
                        }
                        
                        return logger.error(err);
                    }
    
                    QuestionnaryAnswerModel.findOneAndRemove({_id: id}, callback)
                },
            ], (err, body) => {
                if (err) {
                    return next(err);
                }
                
                res.status(200).send(body);
            });
        };
        
        async.waterfall([
            
            (cb) => {
                access.getArchiveAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, cb);
            },
            
            (allowed, personnel, cb) => {
                queryRun(cb);
            }
        ], (err, body) => {
            if (err) {
                return next(err);
            }
            
            res.status(200).send(body);
        });
    };

    this.getAnswers = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var pipeLine = [];
            var filterMapper = new FilterMapper();
            var filter = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.QUESTIONNARIES_ANSWER,
                personnel  : personnel
            });
            var aggregateHelper = new AggregationHelper($answerDefProjection, filter);
            var saveObj = {
                questionnaryId: ObjectId(query.questionnaryId)
            };
            var aggregation;

            if (query.questionId) {
                saveObj.questionId = ObjectId(query.questionId);
            }

            pipeLine.push({
                $match: saveObj
            });

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from             : 'personnels',
                key              : 'personnelId',
                as               : 'personnel',
                isArray          : false,
                addProjection    : ['firstName', 'lastName', 'imageSrc'],
                addMainProjection: ['position']
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from   : 'positions',
                key    : 'position',
                isArray: false
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'domains',
                key : 'country'
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'domains',
                key : 'region'
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'domains',
                key : 'subRegion'
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'retailSegments',
                key : 'retailSegment'
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'outlets',
                key : 'outlet'
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'branches',
                key : 'branch'
            }));

            aggregation = QuestionnaryAnswerModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                result.forEach(answer => {
                    if (answer.text) {
                        answer.text = {
                            en: _.unescape(answer.text.en),
                            ar: _.unescape(answer.text.ar),
                        };
                    }
                });

                next({
                    status: 200,
                    body: result,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, function (err, allowed, personnel) {
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

    this.questionnaryAnswer = function (req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(data) {
            const personnelId = ObjectId(req.session.uId);
            const createdBy = {
                user: personnelId,
                date: new Date(),
            };

            let questionnaryId;

            try {
                questionnaryId = data[0].questionnaryId;
            } catch (e) {
                const error = new Error('questionnaryId is required');

                error.status = 400;
                return next(error);
            }

            async.each(data, (item, eachCb) => {
                async.waterfall([

                    (cb) => {
                        const options = {
                            data: item,
                            createdBy,
                            personnelId,
                        };

                        createOrUpdateQuestionnaryAnswer(options, cb);
                    },

                    (cb) => {
                        sendEventThatAnswerIsPublished({
                            actionOriginator: userId,
                            accessRoleLevel,
                            questionnaireId: item.questionnaryId,
                        });
                        cb();
                    },

                ], eachCb);
            }, (err) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send({});
            });
        }

        access.getEditAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            const options = {
                data       : req.body.data,
                level      : req.session.level,
                contentType: CONTENT_TYPES.QUESTIONNARIES,
                method     : 'update'
            };

            bodyValidator.validateEachBody(options, function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
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

        access.getReadAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, function (err, allowed) {
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
        var isMobile = options.isMobile;

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {
                _id: id
            }
        });

        if (isMobile) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    creationDate: '$createdBy.date',
                    updateDate  : '$editedBy.date'
                })
            });
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                lastDate: {
                    $ifNull: [
                        '$editedBy.date',
                        '$createdBy.date'
                    ]
                }
            })
        });

        aggregation = QuestionnaryModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, model) {
            if (err) {
                return callback(err);
            }

            model = model[0];

            if (model) {
                if (model.title) {
                    model.title = {
                        en: _.unescape(model.title.en),
                        ar: _.unescape(model.title.ar)
                    };
                }

                if (model.questions && model.questions.length) {
                    model.questions = _.map(model.questions, function (question) {
                        if (question.title) {
                            question.title = {
                                en: _.unescape(question.title.en),
                                ar: _.unescape(question.title.ar)
                            };
                        }
                        if (question.options && question.options.length) {
                            question.options = _.map(question.options, function (option) {
                                if (option) {
                                    return {
                                        en: _.unescape(option.en),
                                        ar: _.unescape(option.ar)
                                    };
                                }
                            });
                        }
                        return question;
                    });
                }
            }

            return callback(null, model);
        });
    };

};

module.exports = QuestionnaryHandler;
