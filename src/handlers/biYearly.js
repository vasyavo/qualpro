var BiYearlyHandler = function (db) {
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var ACL_ROLES = require('../constants/aclRolesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType');
    var access = require('../helpers/access')(db);
    var BiYearlyModel = require('./../types/biYearly/model');
    var PersonnelModel = require('./../types/personnel/model');
    var bodyValidator = require('../helpers/bodyValidator');

    function parseDetailsToModel(details, saveObject) {
        var bodyObj;
        var groups;

        for (var key in details) {
            bodyObj = details[key];

            if (bodyObj.type === 'text') {
                saveObject[key] = _.escape(bodyObj.result);
            }

            if (bodyObj.type === 'table') {
                saveObject[key] = {
                    result: _.escape(bodyObj.result)
                };
                groups = bodyObj.groups || [];
                groups.forEach(function (group) {
                    if (!Array.isArray(group)) {
                        group = [group];
                    }

                    group.forEach(function (rateObject) {
                        if (rateObject.id) {
                            saveObject[key][rateObject.id] = _.escape(rateObject.value);
                        }
                    });
                });
            }

            if (bodyObj.type === 'singleSelect') {
                saveObject[key] = _.escape(bodyObj.result && bodyObj.result.value);
            }
        }
    }

    function getNextAvailableRatingDataKey(confirmedDate, lastRatingDataKey) {
        var registeredYear;
        var registeredMonth;
        var nextAfterRatingDataKey;
        var currentDate = new Date();
        var currentYear = currentDate.getFullYear();
        var currentMonth = currentDate.getMonth() + 1;
        var currentDataKey = (currentYear * 100) + currentMonth;
        var lastRatingYear = lastRatingDataKey ? parseInt(lastRatingDataKey.substr(0, 4)) : null;
        var lastRatingMonth = lastRatingDataKey ? parseInt(lastRatingDataKey.substr(4, 2)) : null;
        var nextAfterLastRatingDataKey;
        var nextAfterLastRatingYear;
        var nextAfterLastRatingMonth;
        var nextAfterLastRatingTime;

        if (!confirmedDate) {
            return false; //user is not joined yet
        }

        registeredYear = confirmedDate.getFullYear();
        registeredMonth = confirmedDate.getMonth() + 1;
        nextAfterRatingDataKey = registeredMonth <= 6 ? (registeredYear * 100) + 6 : (registeredYear * 100) + 12;

        if (!lastRatingDataKey) {
            if (nextAfterRatingDataKey >= currentDataKey) {
                return false; //cant rate in future
            }

            return {
                dataKey: nextAfterRatingDataKey,
                year   : registeredYear,
                month  : registeredMonth <= 6 ? 6 : 12,
                time   : registeredMonth <= 6 ? 'spring' : 'fall'
            };
        } else {
            //compare with existing rating

            if (lastRatingMonth === 6) {
                nextAfterLastRatingYear = lastRatingYear;
                nextAfterLastRatingMonth = 12;
                nextAfterLastRatingTime = 'fall';
            } else {
                nextAfterLastRatingYear = lastRatingYear + 1;
                nextAfterLastRatingMonth = 6;
                nextAfterLastRatingTime = 'spring';
            }

            nextAfterLastRatingDataKey = (nextAfterLastRatingYear * 100) + nextAfterLastRatingMonth;

            if (nextAfterLastRatingDataKey >= currentDataKey) {
                return false; //cant rate in future
            }

            return {
                dataKey: nextAfterLastRatingDataKey,
                year   : nextAfterLastRatingYear,
                month  : nextAfterLastRatingMonth,
                time   : nextAfterLastRatingTime
            };
        }
    }

    // Update average rating of personnel
    function updAvgRating(personnelModel, callback) {
        function aggregate(callback) {
            BiYearlyModel.aggregate({
                $match: {
                    personnel: personnelModel._id
                }
            }, {
                $group: {
                    _id      : null,
                    avgRating: {
                        $avg: '$rating'
                    }
                }
            }, {
                $project: {
                    _id      : 0,
                    avgRating: 1
                }
            }, callback);
        }

        function saveToPersonnel(result, callback) {
            var avgRating;

            avgRating = Math.round(result[0].avgRating * 10) / 10;
            personnelModel.avgRating[CONTENT_TYPES.BIYEARLY] = avgRating;

            personnelModel.save(callback);
        }

        async.waterfall([aggregate, saveToPersonnel], callback);
    }

    this.create = function (req, res, next) {
        function queryRun(body) {
            var level = req.session.level;
            var createDataKey = body.dataKey;
            var createDataObject;

            if (createDataKey) {
                createDataObject = {
                    dataKey: createDataKey,
                    year   : createDataKey.substr(0, 4),
                    month  : createDataKey.substr(4, 2),
                    time   : parseInt(createDataKey.substr(4, 2)) === 6 ? 'spring' : 'fall'
                };
            }

            function findPersonnel(callback) {
                PersonnelModel.findById(body.personnel, function (err, personnel) {
                    var error;

                    if (err) {
                        return callback(err);
                    }

                    if (!personnel) {
                        error = new Error('Personnel not found');
                        error.status = 400;
                        return callback(error);
                    }

                    callback(null, personnel);
                });
            }

            // Verify rating existence
            function findOne(personnelModel, callback) {
                var conditions;

                if (createDataKey) {
                    conditions = {
                        personnel: body.personnel,
                        dataKey  : createDataKey
                    };
                } else {
                    conditions = {
                        personnel: body.personnel
                    };
                }

                BiYearlyModel
                    .find(conditions)
                    .sort({dateKey: -1})
                    .exec(function (err, results) {
                        var error;

                        if (err) {
                            return callback(err);
                        }

                        if (createDataKey && results.length) {
                            error = new Error('Forbidden to create two ratings for one period for the same personnel');
                            error.status = 400;

                            return callback(error);
                        }

                        if (!results.length) {
                            return callback(null, null, personnelModel);
                        }

                        callback(null, results[0], personnelModel);
                    });
            }

            function errorIfExist(ratingModel, personnelModel, callback) {
                var dataKey;
                var error;
                var currentDate = new Date();
                var currentMonth = currentDate.getMonth() + 1;
                var currentYear = currentDate.getFullYear();
                var confirmedDate = personnelModel.get('confirmed');
                var newDataKey;
                var nextRatingData;
                var oldRatingDataKey = null;

                // for Master Admin and Country Admin //TODO need more testing, get first unrated period
                if (_.includes(_(ACL_ROLES).pick([
                        'MASTER_ADMIN',
                        'COUNTRY_ADMIN'
                    ]).values().value(), level)) {
                    if (ratingModel) {
                        oldRatingDataKey = ratingModel.get('dataKey');
                    }

                    if (!createDataKey) {
                        nextRatingData = getNextAvailableRatingDataKey(confirmedDate, oldRatingDataKey);
                    }

                    if (!createDataKey && !nextRatingData) {
                        error = new Error('Forbidden to create ratings for future period');
                        error.status = 400;

                        return callback(error);
                    }

                    body.year = createDataObject ? createDataObject.year : nextRatingData.year;
                    body.time = createDataObject ? createDataObject.time : nextRatingData.time;

                } else {
                    //for other admins
                    if (currentMonth === 7 || currentMonth === 1) {
                        currentMonth--;

                        if (!currentMonth) {
                            currentMonth = 12;
                            currentYear--;
                        }

                        if (ratingModel) {
                            dataKey = ratingModel.get('dataKey');
                            newDataKey = (currentYear * 100 + currentMonth).toString();

                            if (dataKey >= newDataKey) {
                                error = new Error('Forbidden to create two ratings for one period for the same personnel');
                                error.status = 400;

                                return callback(error);
                            }

                        }

                        body.year = currentYear;
                        body.time = (currentMonth <= 6) ? 'spring' : 'fall';

                    } else {
                        error = new Error('Forbidden to create ratings for the past period');
                        error.status = 400;

                        return callback(error);
                    }
                }

                callback(null, personnelModel);
            }

            // Create rating
            function create(personnelModel, callback) {
                var createdBy = {
                    user: req.session.uId,
                    date: new Date()
                };
                var model;
                var saveObject = {
                    personnel: body.personnel,
                    rating   : Math.round(body.rating * 10) / 10,
                    year     : body.year,
                    time     : body.time,

                    createdBy: createdBy,
                    editedBy : createdBy
                };

                body.details = body.details || {};
                parseDetailsToModel(body.details, saveObject);

                model = new BiYearlyModel(saveObject);
                model.save(body, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, model, personnelModel);
                });
            }

            // Update personnel average rating and add it to model object
            function addAverage(model, personnelModel, callback) {
                updAvgRating(personnelModel, function (err, personnel) {
                    if (err) {
                        return callback(err);
                    }

                    model = model.toObject();
                    model.avgRating = personnel.avgRating[CONTENT_TYPES.BIYEARLY];

                    callback(null, model);
                });
            }

            async.waterfall([
                findPersonnel,
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BIYEARLY, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.getAll = function (req, res, next) {
        function queryRun() {
            var query = req.query;
            var conditions = {
                type: CONTENT_TYPES.BIYEARLY
            };
            var dbQuery;

            if (query.personnel) {
                conditions.personnel = query.personnel;
            }

            if (query.year) {
                conditions.year = query.year;
            }

            dbQuery = BiYearlyModel.find(conditions)
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
            var type = req.params.type;
            var id = req.params.id;

            BiYearlyModel.findOne({
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
            var type = req.params.type;
            var id = req.params.id;
            var conditions = {
                _id: id
            };
            var saveObject = {
                rating  : Math.round(body.rating * 10) / 10,
                editedBy: {
                    user: req.session.uId,
                    date: Date.now()
                }
            };

            body.details = body.details || {};
            parseDetailsToModel(body.details, saveObject);

            BiYearlyModel.findOneAndUpdate(conditions, saveObject, {new: true}, function (err, result) {
                if (err) {
                    return next(err);
                }

                PersonnelModel.findById(body.personnel, function (err, personnelModel) {
                    var error;

                    if (err) {
                        return next(err);
                    }

                    if (!personnelModel) {
                        error = new Error('Personnel not found');
                        error.status = 400;
                        return next(error);
                    }

                    updAvgRating(personnelModel, function (err, personnel) {
                        if (err) {
                            return next(err);
                        }

                        result = result.toObject();
                        result.avgRating = personnel.avgRating[CONTENT_TYPES.BIYEARLY];

                        res.status(200).send(result);
                    });
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

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.BIYEARLY, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.remove = function (req, res, next) {
        var type = req.params.type;
        var id = req.params.id;
        var conditions = {
            _id : id,
            type: type
        };

        BiYearlyModel.findOneAndRemove(conditions, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send();
        });
    };
};

module.exports = BiYearlyHandler;
