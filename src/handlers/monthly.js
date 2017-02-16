const ActivityLog = require('./../stories/push-notifications/activityLog');

var Rating = function () {
    var _ = require('underscore');
    var async = require('async');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType');
    var access = require('../helpers/access')();

    var MonthlyModel = require('./../types/monthly/model');
    var PersonnelModel = require('./../types/personnel/model');

    var ObjectiveModel = require('./../types/objective/model');
    var PromotionItemModel = require('./../types/promotionItem/model');
    var CompetitorPromotionModel = require('./../types/competitorPromotion/model');
    var CompetitorBrandingModel = require('./../types/competitorBranding/model');
    var AchievementFormModel = require('./../types/achievementForm/model');
    var NewProductLaunchModel = require('./../types/newProductLaunch/model');

    var bodyValidator = require('../helpers/bodyValidator');
    var ObjectId = mongoose.Types.ObjectId;

    // Update average rating of personnel
    function updAvgRating(options, ratingType, callback) {
        var personnelId = options.personnelId;
        var dataKey = options.dataKey;

        function aggregate(callback) {
            MonthlyModel.aggregate({
                $match: {
                    type: ratingType,
                    personnel: ObjectId(personnelId)
                }
            }, {
                $group: {
                    _id: null,
                    avgRating: {
                        $avg: '$rating'
                    }
                }
            }, {
                $project: {
                    _id: 0,
                    avgRating: 1
                }
            }, callback);
        }

        function saveToPersonnel(result, callback) {
            PersonnelModel.findById(personnelId, function (err, personnel) {
                var avgRating;

                if (err) {
                    return callback(err);
                }

                avgRating = Math.round(result[0].avgRating * 10) / 10;
                personnel.avgRating[ratingType] = avgRating;

                personnel.lasMonthEvaluate = !personnel.lasMonthEvaluate || personnel.lasMonthEvaluate < dataKey ? dataKey : personnel.lasMonthEvaluate;

                personnel.save(callback);
            });
        }

        async.waterfall([aggregate, saveToPersonnel], callback);
    }

    this.getForCreate = function(req, res, next) {
        function queryRun() {
            var query = req.query;
            var personnel = query.personnel;
            var month = parseInt(query.month) - 1;
            var year = parseInt(query.year);
            var dateStart = new Date(year, month, 1);
            var dateEnd = new Date(year, month + 1, 1);

            var dateMatch = { $gte: dateStart, $lt: dateEnd };

            var objectivesDefMatch = [{
                $or: [
                    { assignedTo          : ObjectId(personnel) },
                    { "history.assignedTo": ObjectId(personnel) }
                ]
            }, {
                $or: [
                    { dateStart : dateMatch },
                    { dateEnd   : dateMatch },
                    { dateClosed: dateMatch }
                ]
            }];

            var objectivesDefProjection = {
                title        : 1,
                status       : 1,
                dateStart    : 1,
                dateEnd      : 1,
                dateClosed   : 1,
                history      : 1,
                objectiveType: 1,
                context      : 1
            };

            var reportsDefMatch = {
                "createdBy.user": ObjectId(personnel),
                "createdBy.date": dateMatch
            };

            function individualObjectives(callback) {
                var pipeLine = [];
                var aggregation;

                pipeLine.push({
                    $match: {
                        $and: objectivesDefMatch.concat({
                            context: CONTENT_TYPES.OBJECTIVES
                        }, {
                            objectiveType: 'individual'
                        })
                    }
                });

                pipeLine.push({
                    $project: objectivesDefProjection
                });

                aggregation = ObjectiveModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true
                };

                aggregation.exec(callback);
            }

            function companyObjectives(callback) {
                var pipeLine = [];
                var aggregation;

                pipeLine.push({
                    $match: {
                        $and: objectivesDefMatch.concat({
                            context: CONTENT_TYPES.OBJECTIVES
                        }, {
                            objectiveType: { $ne: 'individual' }
                        })
                    }
                });

                pipeLine.push({
                    $project: objectivesDefProjection
                });

                aggregation = ObjectiveModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true
                };

                aggregation.exec(callback);
            }

            function inStoreTasks(callback) {
                var pipeLine = [];
                var aggregation;

                pipeLine.push({
                    $match: {
                        $and: objectivesDefMatch.concat({
                            context: CONTENT_TYPES.INSTORETASKS
                        })
                    }
                });

                pipeLine.push({
                    $project: objectivesDefProjection
                });

                aggregation = ObjectiveModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true
                };

                aggregation.exec(callback);
            }

            function submittingReports(callback) {
                async.parallel([
                    function (callback) {
                        var pipeLine = [];
                        var aggregation;

                        pipeLine.push({
                            $match: reportsDefMatch
                        });

                        pipeLine.push({
                            $project: {
                                type: { $literal: 'promotionsItems' },
                                date: "$createdBy.date"
                            }
                        });

                        aggregation = PromotionItemModel.aggregate(pipeLine);

                        aggregation.options = {
                            allowDiskUse: true
                        };

                        aggregation.exec(callback);
                    },
                    function (callback) {
                        var pipeLine = [];
                        var aggregation;

                        pipeLine.push({
                            $match: reportsDefMatch
                        });

                        pipeLine.push({
                            $project: {
                                type: { $literal: 'competitorPromotion' },
                                date: "$createdBy.date"
                            }
                        });

                        aggregation = CompetitorPromotionModel.aggregate(pipeLine);

                        aggregation.options = {
                            allowDiskUse: true
                        };

                        aggregation.exec(callback);
                    },
                    function (callback) {
                        var pipeLine = [];
                        var aggregation;

                        pipeLine.push({
                            $match: reportsDefMatch
                        });

                        pipeLine.push({
                            $project: {
                                type: { $literal: 'competitorBranding' },
                                date: "$createdBy.date"
                            }
                        });

                        aggregation = CompetitorBrandingModel.aggregate(pipeLine);

                        aggregation.options = {
                            allowDiskUse: true
                        };

                        aggregation.exec(callback);
                    },
                    function (callback) {
                        var pipeLine = [];
                        var aggregation;

                        pipeLine.push({
                            $match: reportsDefMatch
                        });

                        pipeLine.push({
                            $project: {
                                type: { $literal: 'achievementForm' },
                                date: "$createdBy.date"
                            }
                        });

                        aggregation = AchievementFormModel.aggregate(pipeLine);

                        aggregation.options = {
                            allowDiskUse: true
                        };

                        aggregation.exec(callback);
                    },
                    function (callback) {
                        var pipeLine = [];
                        var aggregation;

                        pipeLine.push({
                            $match: reportsDefMatch
                        });

                        pipeLine.push({
                            $project: {
                                type: { $literal: 'newProductLaunch' },
                                date: "$createdBy.date"
                            }
                        });

                        aggregation = NewProductLaunchModel.aggregate(pipeLine);

                        aggregation.options = {
                            allowDiskUse: true
                        };

                        aggregation.exec(callback);
                    }
                ], function(err, results) {
                    if (err) {
                        return callback(err);
                    }

                    results = _.union.apply(null, results);
                    results = _.sortBy(results, 'date');

                    callback(null, results);
                });
            }

            async.parallel({
                individualObjectives: individualObjectives,
                companyObjectives   : companyObjectives,
                inStoreTasks        : inStoreTasks,
                submittingReports   : submittingReports
            }, function (err, results) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(results);
            });
        }

        access.getReadAccess(req, ACL_MODULES.EMPLOYEES_PERFORMANCE, function (err, allowed) {
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

    this.create = function (req, res, next) {
        function queryRun(body) {
            var type = CONTENT_TYPES.MONTHLY;
            var level = req.session.level;
            var month = parseInt(body.month);
            var year = parseInt(body.year);
            var dataKey = year * 100 + month;

            // Date verification
            function verifyDate(callback) {
                var date = new Date();
                var currentMonth;
                var currentYear;
                var currentDataKey;
                var error;

                date.setMonth(date.getMonth() - 1);
                currentMonth = date.getMonth() + 1;
                currentYear = date.getFullYear();
                currentDataKey = currentYear * 100 + currentMonth;

                if (dataKey > currentDataKey) {
                    error = new Error('Forbidden to create rating for the future period');
                    error.status = 403;

                    return callback(error);
                }

                if (dataKey < currentDataKey && level !== 1 && level !== 2) {
                    error = new Error('Forbidden to create rating for the past period');
                    error.status = 403;

                    return callback(error);
                }

                callback(null);
            }

            // Verify rating existence
            function findOne(callback) {
                var conditions = {
                    type     : type,
                    personnel: body.personnel,
                    dataKey  : dataKey
                };

                MonthlyModel.findOne(conditions, callback);
            }

            function errorIfExist(rating, callback) {
                var error;

                if (rating) {
                    error = new Error('Forbidden to create two ratings for one period for the same personnel');
                    error.status = 403;

                    return callback(error);
                }

                callback(null);
            }

            // Create rating
            function create(callback) {
                var createdBy = {
                    user: req.session.uId,
                    date: new Date()
                };

                body.type = type;
                body.createdBy = createdBy;
                body.editedBy = createdBy;
                body.rating = Math.round(body.rating * 10) / 10;

                MonthlyModel.create(body, callback);
            }

            // Update personnel average rating and add it to model object
            function addAverage(model, callback) {
                updAvgRating({
                    personnelId: body.personnel,
                    dataKey    : dataKey
                }, type, function (err, personnel) {
                    if (err) {
                        return callback(err);
                    }

                    ActivityLog.emit('personnel:monthly', {
                        actionOriginator: req.session.uId,
                        accessRoleLevel : req.session.level,
                        body: personnel,
                    });


                    model = model.toObject();
                    model.avgRating = personnel.avgRating[type];

                    callback(null, model);
                });
            }

            async.waterfall([
                verifyDate,
                findOne,
                errorIfExist,
                create,
                addAverage
            ], function (err, model) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(model);
            });
        }
        access.getWriteAccess(req, ACL_MODULES.EMPLOYEES_PERFORMANCE, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.MONTHLY, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAll = function (req, res, next) {
        function queryRun() {
            var type = CONTENT_TYPES.MONTHLY;
            var query = req.query;
            var conditions = {
                type: type
            };
            var dbQuery;

            if (query.personnel) {
                conditions.personnel = query.personnel;
            }

            if (query.year) {
                conditions.year = query.year;
            }

            dbQuery = MonthlyModel.find(conditions)
                .sort({
                    dataKey: -1
                });

            if (query.recentsNum) {
                dbQuery = dbQuery.limit(+query.recentsNum);
            }

            dbQuery.exec(function (err, ratings) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(ratings);
            });
        }
        access.getReadAccess(req, ACL_MODULES.EMPLOYEES_PERFORMANCE, function (err, allowed) {
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
            var type = CONTENT_TYPES.MONTHLY;
            var id = req.params.id;

            MonthlyModel.findOne({
                _id : id,
                type: type
            }, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }
        access.getReadAccess(req, ACL_MODULES.EMPLOYEES_PERFORMANCE, function (err, allowed) {
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

    this.update = function (req, res, next) {
        function queryRun(body) {
            var type = CONTENT_TYPES.MONTHLY;
            var id = req.params.id;
            var conditions = {
                _id : id,
                type: type
            };

            body.rating = Math.round(body.rating * 10) / 10;
            body.age = Math.round(body.achiev / body.target * 100);
            body.editedBy = {
                user: req.session.uId,
                date: Date.now()
            };

            MonthlyModel.findOneAndUpdate(conditions, body, {new: true})
                .exec(function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    updAvgRating({
                        personnelId: result.personnel,
                        dataKey    : result.dataKey
                    }, result.type, function (err, personnel) {
                        if (err) {
                            return next(err);
                        }

                        ActivityLog.emit('personnel:monthly', {
                            actionOriginator: req.session.uId,
                            accessRoleLevel : req.session.level,
                            body: personnel,
                        });

                        result = result.toObject();
                        result.avgRating = personnel.avgRating[type];

                        res.status(200).send(result);
                    });
                });
        }
        access.getEditAccess(req, ACL_MODULES.EMPLOYEES_PERFORMANCE, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.MONTHLY, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.remove = function (req, res, next) {
        var type = CONTENT_TYPES.MONTHLY;
        var id = req.params.id;
        var conditions = {
            _id: id,
            type: type
        };

        MonthlyModel.findOneAndRemove(conditions, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send();
        });
    };
};

module.exports = Rating;
