const async = require('async');
const logger = require('./../utils/logger');
const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const isValidObjectId = require('bson-objectid').isValid;
const QuestionnaryModel = require('./../types/questionnaries/model');
const QuestionnaryAnswerModel = require('./../types/questionnariesAnswer/model');
const PersonnelModel = require('./../types/personnel/model');
const ACL_CONSTANTS = require('../constants/aclRolesNames');
const ACL_MODULES = require('../constants/aclModulesNames');
const CONTENT_TYPES = require('../public/js/constants/contentType.js');
const CONSTANTS = require('../constants/mainConstants');
const ACTIVITY_TYPES = require('../constants/activityTypes');
const FilterMapper = require('../helpers/filterMapper');
const bodyValidator = require('../helpers/bodyValidator');
const AggregationHelper = require('../helpers/aggregationCreater');
const access = require('../helpers/access')();
const GetImageHelper = require('../helpers/getImages');

const QuestionnaryHandler = function (db, redis, event) {
    const getImagesHelper = new GetImageHelper(db);
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

    const filterRetrievedResultOnGetAll = (options, cb) => {
        const personnel = options.personnel;
        const accessRoleLevel = options.accessRoleLevel;
        const result = options.result;
        const personnelId = personnel._id.toString();

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

        if (accessRoleLevel !== 1) {
            body.data = body.data.filter((question) => {
                const personnelArray = question.personnels.fromObjectID();
                const isEnoughMembers = question.personnels && personnelArray.length;
                const isMember = personnelArray.indexOf(personnelId) !== -1;
                const creator = question.createdBy.user;

                let isCreator = null;

                if (isValidObjectId(creator)) {
                    // fixme: should check it here as sync aggregation do not includes projection for $createdBy.user
                    isCreator = creator && creator.toString() === personnelId;
                } else {
                    // fixme: if $createdBy.user already projected then get only _id
                    isCreator = creator && creator._id.toString() === personnelId;
                }

                return isCreator || (isEnoughMembers && isMember);
            });

            body.total = body.data.length;
        }

        cb(null, body);
    };

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel, callback) {
            const query = req.query;
            const page = query.page || 1;
            const isMobile = req.isMobile;
            const accessRoleLevel = req.session.level;
            const lastLogOut = new Date(query.lastLogOut);
            const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            const skip = (page - 1) * limit;
            const filterMapper = new FilterMapper();
            const queryFilter = query.filter || {};

            const sort = query.sort || {
                lastDate: -1
            };

            delete queryFilter.globalSearch;

            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.QUESTIONNARIES,
                filter: queryFilter
            });

            for (let key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            const aggregateHelper = new AggregationHelper($defProjection, queryObject);

            queryObject.$and = [{
                // standard synchronization behaviour
                $or : [{
                    'editedBy.date': {
                        $gt: lastLogOut
                    }
                }, {
                    'createdBy.date': {
                        $gt: lastLogOut
                    }
                }]
            }, {
                // user should see questionnaire which are related to him, probably which are active
                $or: [{
                    'createdBy.user': personnel._id
                }, {
                    'createdBy.user': {
                        $ne: personnel._id
                    },
                    status: {
                        $eq: 'active'
                    }
                }]
            }];

            if (isMobile) {
                // user sees only ongoing questionnaire via mobile app
                const currentDate = new Date();

                queryObject.$and.push({
                    dueDate: {
                        $gt: currentDate
                    }
                });
            }

            const pipeline = [];

            pipeline.push({
                $match: queryObject
            });

            async.waterfall([

                (cb) => {
                    if (isMobile) {
                        pipeline.push({
                            $project: Object.assign({}, $defProjection, {
                                creationDate: '$createdBy.date',
                                updateDate: '$editedBy.date'
                            })
                        });
                    }

                    pipeline.push({
                        $project: Object.assign({}, $defProjection, {
                            lastDate: {
                                $ifNull: [
                                    '$editedBy.date',
                                    '$createdBy.date'
                                ]
                            }
                        })
                    });

                    pipeline.push({
                        $sort: sort
                    });

                    pipeline.push(...aggregateHelper.setTotal());

                    pipeline.push({
                        $skip: skip
                    });

                    pipeline.push({
                        $limit: limit
                    });

                    pipeline.push(...aggregateHelper.groupForUi());

                    const aggregation = QuestionnaryModel.aggregate(pipeline);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(cb);
                },

                (result, cb) => {
                    filterRetrievedResultOnGetAll({
                        personnel,
                        accessRoleLevel,
                        result
                    }, cb);
                }

            ], callback);
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE),

            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            }

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            return next({
                status: 200,
                body
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
            const filterSearch = queryFilter.globalSearch || "";

            const searchFieldsArray = [
                'title.en',
                'title.ar',
            ];

            const sort = query.sort || {
                lastDate: -1
            };

            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.QUESTIONNARIES,
                filter: queryFilter
            });

            if (queryObject.globalSearch) {
                delete queryObject.globalSearch;
            }

            for (let key in sort) {
                sort[key] = parseInt(sort[key], 10);
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

            if (isMobile) {
                // user sees only ongoing questionnaire via mobile app
                const currentDate = new Date();

                queryObject.dueDate = {
                    $gt: currentDate
                };
            }

            const aggregateHelper = new AggregationHelper($defProjection);
            const pipeline = [];

            pipeline.push({
                $match: queryObject
            });

            async.waterfall([

                (cb) => {
                    if (personnelFilter) {
                        pipeline.push({
                            $match: {
                                personnels: personnelFilter
                            }
                        });
                    }

                    if (publisherFilter) {
                        pipeline.push({
                            $match: {
                                'createdBy.user': publisherFilter
                            }
                        });
                    }

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'personnels',
                        key: 'createdBy.user',
                        isArray: false,
                        addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
                        includeSiblings: { createdBy: { date: 1 } }
                    }));

                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'personnels',
                        key: 'personnels',
                        addMainProjection: ['position'],
                        isArray: true
                    }));

                    if (positionFilter) {
                        pipeline.push({
                            $match: {
                                $or: [
                                    {
                                        position: positionFilter
                                    },
                                    {
                                        'createdBy.user.position': positionFilter
                                    }
                                ]
                            }
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
                                    lastName: 1
                                }
                            }
                        }
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
                                    lastName: 1
                                }
                            }
                        }
                    }));

                    if (isMobile) {
                        pipeline.push(...aggregateHelper.aggregationPartMaker({
                            from: 'personnels',
                            key: 'editedBy.user',
                            isArray: false,
                            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
                            includeSiblings: { editedBy: { date: 1 } }
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
                                        lastName: 1
                                    }
                                }
                            }
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
                                        lastName: 1
                                    }
                                }
                            }
                        }));
                    }

                    pipeline.push({
                        $unwind: {
                            path: '$personnels',
                            preserveNullAndEmptyArrays: true
                        }
                    });

                    pipeline.push({
                        $project: aggregateHelper.getProjection({
                            personnel: '$personnels._id'
                        })
                    });

                    pipeline.push({
                        $group: aggregateHelper.getGroupObject({
                            personnels: {
                                $addToSet: '$personnel'
                            }
                        })
                    });

                    pipeline.push(...aggregateHelper.endOfPipeLine({
                        isMobile,
                        filterSearch,
                        searchFieldsArray,
                        skip,
                        limit,
                        sort
                    }));

                    const aggregation = QuestionnaryModel.aggregate(pipeline);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(cb);
                },

                (result, cb) => {
                    filterRetrievedResultOnGetAll({
                        personnel,
                        accessRoleLevel,
                        result
                    }, cb);
                }

            ], callback);
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE),

            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            }

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            return next({
                status: 200,
                body
            });
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var aggregateHelper = new AggregationHelper($defProjection);

            async.waterfall([
                function (waterfallCb) {
                    var pipeLine = [];
                    var $match = {};
                    var retailSegmentFilter;
                    var outletFilter;

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
                        retailSegmentFilter = {$in: body.retailSegment.objectID()};
                    }

                    if (body.outlet) {
                        body.outlet = body.outlet.length ? body.outlet : [body.outlet.length];
                        outletFilter = {$in: body.outlet.objectID()};
                    }

                    if (body.branch) {
                        body.branch = body.branch.length ? body.branch : [body.branch.length];
                        $match.branch = {$in: body.branch.objectID()};
                    }

                    if (body.personnel) {
                        body.personnel = body.personnel.length ? body.personnel : [body.personnel.length];
                        $match._id = {$in: body.personnel.objectID()};
                    }

                    if (body.position) {
                        body.position = body.position.length ? body.position : [body.position.length];
                        $match.position = {$in: body.position.objectID()};
                    }

                    pipeLine.push({
                        $match: $match
                    });

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from         : 'accessRoles',
                        key          : 'accessRole',
                        isArray      : false,
                        addProjection: ['level']
                    }));

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
                        $match: {
                            'accessRole.level': {
                                $nin: [
                                    ACL_CONSTANTS.MASTER_ADMIN,
                                    ACL_CONSTANTS.MASTER_UPLOADER,
                                    ACL_CONSTANTS.COUNTRY_UPLOADER
                                    ]
                            }
                        }
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

                        event.emit('activityChange', {
                            module    : 31,
                            actionType: ACTIVITY_TYPES.CREATED,
                            createdBy : body.createdBy,
                            itemId    : result._id,
                            itemType  : CONTENT_TYPES.QUESTIONNARIES
                        });

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

                        event.emit('activityChange', {
                            module    : ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
                            actionType: ACTIVITY_TYPES.UPDATED,
                            createdBy : body.editedBy,
                            itemId    : id,
                            itemType  : CONTENT_TYPES.QUESTIONNARIES
                        });

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
                addProjection    : ['firstName', 'lastName'],
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

            aggregation.exec(function (err, response) {
                var personnelIds = [];
                var options = {
                    data: {}
                };

                if (!response.length) {
                    return next({status: 200, body: []});
                }

                _.map(response, function (answer) {
                    if (answer.text) {
                        answer.text = {
                            en: _.unescape(answer.text.en),
                            ar: _.unescape(answer.text.ar)
                        }
                    }
                    personnelIds.push(answer.personnel._id);

                    return answer;
                });

                personnelIds = lodash.uniqBy(personnelIds, 'id');

                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;

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
                    fieldNames[CONTENT_TYPES.PERSONNEL] = ['personnel'];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
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
        function queryRun(body) {
            var personnelId = ObjectId(req.session.uId);
            var update;
            var updater = {};
            var personnelAnswerExists = true;
            async.waterfall([
                function (waterfallCB) {
                    if (body && !body.answers) {
                        body.answers = [];
                    }
                    async.each(body.answers, function (answer, eachCallback) {
                        var newAnswer = {
                            personnelId   : personnelId,
                            questionnaryId: body.questionnaryId,
                            questionId    : answer.questionId,
                            country       : body.country,
                            region        : body.region,
                            subRegion     : body.subRegion,
                            retailSegment : body.retailSegment,
                            outlet        : body.outlet,
                            branch        : body.branch
                        };
                        if (answer.optionIndex && answer.optionIndex.length) {
                            newAnswer.optionIndex = answer.optionIndex;
                        }
                        if (answer.text && Object.keys(answer.text).length) {
                            newAnswer.text = {
                                en: _.escape(answer.text.en),
                                ar: _.escape(answer.text.ar)
                            }
                        }

                        async.waterfall([
                            function (waterfallCb) {
                                var query = {
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
                                var query = {
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
                                var createdBy = {
                                    user: personnelId,
                                    date: new Date()
                                };
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
                        ], function (err, result) {
                            if (err) {
                                return eachCallback(err);
                            }
                            eachCallback(null);
                        });
                    }, function (err) {
                        if (err) {
                            return waterfallCB(err);
                        }
                        waterfallCB(null);
                    });
                },
                function (waterfallCB) {
                    QuestionnaryModel.findById(body.questionnaryId, function (err, questionnary) {
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

                    if (questionnary.countBranches * 1 - 1 <= 0) {
                        updater.status = 'completed';
                    }

                    updater.editedBy = {
                        user: personnelId,
                        date: new Date()
                    };
                    QuestionnaryModel.findByIdAndUpdate(body.questionnaryId, updater, function (err) {
                        if (err) {
                            return waterfallCB(err);
                        }
                        waterfallCB(null);
                    });
                }
            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                event.emit('activityChange', {
                    module    : ACL_MODULES.AL_ALALI_QUESTIONNAIRE,
                    actionType: ACTIVITY_TYPES.UPDATED,
                    createdBy : updater.editedBy,
                    itemId    : body.questionnaryId,
                    itemType  : CONTENT_TYPES.QUESTIONNARIES
                });

                next({status: 200, body: {}});
            });
        }

        access.getEditAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, function (err, allowed) {
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

            bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.QUESTIONNARIES, 'update', function (err, saveData) {
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
