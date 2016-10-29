var QuestionnaryHandler = function (db, redis, event) {
    var async = require('async');
    var _ = require('underscore');
    var lodash = require('lodash');
    var mongoose = require('mongoose');
    var ACL_CONSTANTS = require('../constants/aclRolesNames');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var access = require('../helpers/access')(db);
    var CONSTANTS = require('../constants/mainConstants');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var FilterMapper = require('../helpers/filterMapper');
    var bodyValidator = require('../helpers/bodyValidator');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImageHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImageHelper(db);
    var ObjectId = mongoose.Types.ObjectId;
    var QuestionnariesModel = db.model(CONTENT_TYPES.QUESTIONNARIES, mongoose.Schemas[CONTENT_TYPES.QUESTIONNARIES]);
    var QuestionnariesAnswerModel = db.model(CONTENT_TYPES.QUESTIONNARIES_ANSWER, mongoose.Schemas[CONTENT_TYPES.QUESTIONNARIES_ANSWER]);
    var PersonnelModel = db.model(CONTENT_TYPES.PERSONNEL, mongoose.Schemas[CONTENT_TYPES.PERSONNEL]);

    var $defProjection = {
        _id          : 1,
        title        : 1,
        dueDate      : 1,
        country      : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        branch       : 1,
        countAll     : 1,
        countAnswered: 1,
        status       : 1,
        questions    : 1,
        location     : 1,
        editedBy     : 1,
        createdBy    : 1,
        creationDate : 1,
        updateDate   : 1,
        position     : 1,
        personnels   : 1
    };

    var $answerDefProjection = {
        _id           : 1,
        personnel     : 1,
        personnelId   : 1,
        questionnaryId: 1,
        questionId    : 1,
        optionIndex   : 1,
        editedBy      : 1,
        createdBy     : 1,
        branch        : 1,
        outlet        : 1,
        retailSegment : 1,
        subRegion     : 1,
        region        : 1,
        country       : 1,
        text          : 1,
        position      : 1
    };
    var self = this;

    function getAnsweredQuestions(userId, cb) {
        var pipeline = [];

        pipeline.push({
            $match: {
                personnelId: ObjectId(userId)
            }
        });

        pipeline.push({
            $group: {
                _id : null,
                _ids: {$addToSet: '$_id'}
            }
        });

        QuestionnariesAnswerModel.aggregate(pipeline, function (err, result) {
            if (err) {
                return cb(err);
            }

            if (result && result.length) {
                result = result[0];

                return cb(null, result._ids);
            }

            return cb(null, []);
        });
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var page = query.page || 1;
            var isMobile = req.isMobile;
            var lastLogOut = new Date(query.lastLogOut);
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var queryObject = query.filter || {};
            var aggregateHelper;
            var key;
            var pipeLine = [];
            var aggregation;
            var waterFallTasks = [];

            var sort = query.sort || {lastDate: -1};

            delete queryObject.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.QUESTIONNARIES,
                filter     : query.filter || {}
            });

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            queryObject.$or = [
                {'createdBy.user': personnel._id},
                {
                    'createdBy.user': {
                        $ne: personnel._id
                    },

                    status: {
                        $eq: 'active'
                    }
                }
            ];

            pipeLine.push({
                $match: queryObject
            });

            function endOfWaterFall(ids, waterFallCb) {
                if (ids && typeof ids !== 'function') {
                    pipeLine.push({
                        $match: {
                            _id: {
                                $nin: ids.objectID()
                            }
                        }
                    });
                } else {
                    waterFallCb = ids;
                }

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

                pipeLine.push({
                    $sort: sort
                });

                pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

                pipeLine.push({
                    $skip: skip
                });

                pipeLine.push({
                    $limit: limit
                });

                pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

                aggregation = QuestionnariesModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true
                };

                aggregation.exec(function (err, response) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    if (response.length) {
                        response[0].data = _.map(response[0].data, function (model) {
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

                            return model;
                        });
                    }

                    waterFallCb(null, response);
                });
            }

            waterFallTasks.push(endOfWaterFall);

            async.waterfall(waterFallTasks, function (err, result) {
                if (err) {
                    return next(err);
                }

                result = result && result[0] ? result[0] : {data: [], total: 0};

                if (req.session.level !== 1) {
                    result.data = _.filter(result.data, function (question) {
                        var personnelArray = question.personnels.fromObjectID();
                        return !question.personnels || !personnelArray.length || personnelArray.indexOf(personnel.id) !== -1;
                    });
                }

                // res.status(200).send(result);

                next({status: 200, body: result});
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

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var isMobile = req.isMobile;
            var query = req.query;
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var queryObject = query.filter || {};
            var aggregateHelper;
            var key;
            var pipeLine = [];
            var aggregation;
            var waterFallTasks = [];
            var positionFilter;
            var personnelFilter;
            var publisherFilter;

            var sort = query.sort || {
                    lastDate: -1
                };

            delete queryObject.globalSearch;
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.QUESTIONNARIES,
                filter     : query.filter || {}
            });

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            if (queryObject.position) {
                positionFilter = queryObject.position;
                delete queryObject.position;
            }

            if (queryObject.personnel) {
                personnelFilter = queryObject.personnel;
                delete queryObject.personnel;
            }

            if (queryObject.publisher) {
                publisherFilter = queryObject.publisher;
                delete queryObject.publisher;
            }

            aggregateHelper = new AggregationHelper($defProjection);

            pipeLine.push({
                $match: queryObject
            });

            function endOfWaterFall(ids, waterFallCb) {
                if (ids && typeof ids !== 'function') {
                    pipeLine.push({
                        $match: {
                            _id: {
                                $nin: ids.objectID()
                            }
                        }
                    });
                } else {
                    waterFallCb = ids;
                }

                if (personnelFilter) {
                    pipeLine.push({
                        $match: {
                            personnels: personnelFilter
                        }
                    });
                }

                if (publisherFilter) {
                    pipeLine.push({
                        $match: {
                            'createdBy.user': publisherFilter
                        }
                    });
                }

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from           : 'personnels',
                    key            : 'createdBy.user',
                    isArray        : false,
                    addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
                    includeSiblings: {createdBy: {date: 1}}
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from             : 'personnels',
                    key              : 'personnels',
                    addMainProjection: ['position'],
                    isArray          : true
                }));

                if (positionFilter) {
                    pipeLine.push({
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
                }

                pipeLine.push({
                    $unwind: {
                        path                      : '$personnels',
                        preserveNullAndEmptyArrays: true
                    }
                });

                pipeLine.push({
                    $project: aggregateHelper.getProjection({
                        personnel: '$personnels._id'
                    })
                });

                pipeLine.push({
                    $group: aggregateHelper.getGroupObject({
                        personnels: {$addToSet: '$personnel'}
                    })
                });

                /*pipeLine.push({
                 $project: aggregateHelper.getProjection({
                 lastDate: {
                 $ifNull: [
                 '$editedBy.date',
                 '$createdBy.date'
                 ]
                 }
                 })
                 });

                 pipeLine.push({
                 $sort: sort
                 });

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
                    isMobile: isMobile,
                    skip    : skip,
                    limit   : limit,
                    sort    : sort
                }));

                aggregation = QuestionnariesModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true
                };

                aggregation.exec(function (err, response) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    if (response.length) {
                        response[0].data = _.map(response[0].data, function (model) {
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

                            return model;
                        });
                    }

                    waterFallCb(null, response);
                });
            }

            waterFallTasks.push(endOfWaterFall);

            async.waterfall(waterFallTasks, function (err, result) {
                if (err) {
                    return next(err);
                }

                result = result && result[0] ? result[0] : {data: [], total: 0};

                if (req.session.level !== 1) {
                    result.data = _.filter(result.data, function (question) {
                        var personnelArray = question.personnels.fromObjectID();
                        return !question.personnels || !personnelArray.length || personnelArray.indexOf(personnel.id) !== -1 || question.createdBy.user._id.toString() === personnel.id;
                    });
                    result.total = result.data.length;
                }

                next({status: 200, body: result});
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
                                    ACL_CONSTANTS.COUNTRY_ADMIN,
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

                    QuestionnariesModel.create(body, function (err, result) {
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

                    QuestionnariesModel.findByIdAndUpdate(id, fullUpdate, {new: true}, function (err, result) {
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

            aggregation = QuestionnariesAnswerModel.aggregate(pipeLine);

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
                                QuestionnariesAnswerModel.findOne(query, function (err, result) {
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
                                QuestionnariesAnswerModel.findOne(query, function (err, result) {
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

                                    QuestionnariesAnswerModel.update({_id: questionAnswerIdToUpdate}, {$set: newAnswer}, function (err) {
                                        if (err) {
                                            return waterfallCb(err);
                                        }
                                        update = true;
                                        waterfallCb(null);
                                    });
                                } else {
                                    newAnswer.createdBy = createdBy;
                                    newAnswer.editedBy = createdBy;

                                    QuestionnariesAnswerModel.create(newAnswer, function (err) {
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
                    QuestionnariesModel.findById(body.questionnaryId, function (err, questionnary) {
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
                    QuestionnariesModel.findByIdAndUpdate(body.questionnaryId, updater, function (err) {
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

        aggregation = QuestionnariesModel.aggregate(pipeLine);

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
