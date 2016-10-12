module.exports = function (db, event) {
    'use strict';

    var async = require('async');
    var nodeScheduler = require('node-schedule');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');

    var logWriter = require('../helpers/logWriter');

    var hourlyRule = '0 * * * *';

    function consoleLogENV(message) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(message);
        }
    }

    function getPipeLine(query) {
        var pipeLine = [];

        pipeLine.push({
            $match: query
        });

        pipeLine.push({
            $group: {
                _id: null,
                ids: {
                    $addToSet: '$_id'
                }
            }
        });

        return pipeLine;
    }

    function triggerEvent(mid, id, itemType) {
        event.emit('activityChange', {
            module    : mid,
            actionType: ACTIVITY_TYPES.UPDATED,
            createdBy : {user: null, date: new Date()},
            itemId    : id,
            itemType  : itemType
        });
    }

    function schedulerCallBack(scheduler, type, updateFunction) {
        return function (err, resObject) {
            if (err) {
                logWriter.log('Scheduler.' + scheduler + '' + type + ' aggregate Err ' + err);
                consoleLogENV(err);
            } else if (resObject[0] && resObject[0].ids && resObject[0].ids.length) {
                updateFunction(resObject[0].ids, function (err) {
                    if (err) {
                        logWriter.log('Scheduler.brandingAndDisplayExpired Update Err ' + err);
                        consoleLogENV(err);
                    }
                    logWriter.log('Scheduler.' + scheduler + '' + type + ' Update completed');
                    consoleLogENV(scheduler + ' ' + type + ' done');
                });
            } else {
                logWriter.log('Scheduler.' + scheduler + '' + type + ' No Expired');
                consoleLogENV('No ' + scheduler + '' + type);
            }
        };
    }

    function updateEachGenerator(updateMethod) {
        return function (ids, cb) {
            async.each(ids, updateMethod, function (err) {
                if (err) {
                    return cb(err);
                }

                cb(null);
            });
        };
    }

    /* ----------------- */

    function personnelInactive() {
        var PERSONNEL_STATUSES = require('../public/js/constants/personnelStatuses.js');
        var modelAndSchemaName = CONTENT_TYPES.PERSONNEL;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var startDate = new Date();
        var endDate = new Date(startDate.getMonth() - 2);
        var query = {
            lastAccess: {
                $lte: endDate
            },

            temp: false,

            status: {
                $nin: [PERSONNEL_STATUSES.ONLEAVE._id, PERSONNEL_STATUSES.INACTIVE._id]
            }
        };

        function updatePersonnel(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PERSONNEL_STATUSES.INACTIVE._id
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(20, id, CONTENT_TYPES.PERSONNEL);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('personnel', 'Inactive', updateEachGenerator(updatePersonnel)));

    }

    function contractsYearlyExpired() {
        var modelAndSchemaName = CONTENT_TYPES.CONTRACTSYEARLY;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

        var query = {
            dateEnd: {
                $lt: new Date()
            },

            status: {
                $eq: PROMOTION_STATUSES.ACTIVE
            }
        };

        function updateContract(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PROMOTION_STATUSES.EXPIRED
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(20, id, CONTENT_TYPES.CONTRACTSYEARLY);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('contractsYearly', 'Expired', updateEachGenerator(updateContract)));

    }

    function contractsSecondaryExpired() {
        var modelAndSchemaName = CONTENT_TYPES.CONTRACTSSECONDARY;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

        var query = {
            dateEnd: {
                $lt: new Date()
            },

            status: {
                $eq: PROMOTION_STATUSES.ACTIVE
            }
        };

        function updateContract(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PROMOTION_STATUSES.EXPIRED
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(22, id, CONTENT_TYPES.CONTRACTSSECONDARY);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('contractsSecondary', 'Expired', updateEachGenerator(updateContract)));
    }

    function promotionExpired() {
        var modelAndSchemaName = CONTENT_TYPES.PROMOTIONS;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

        var query = {
            dateEnd: {
                $lt: new Date()
            },

            status: {
                $eq: PROMOTION_STATUSES.ACTIVE
            }

        };

        function updatePromotion(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PROMOTION_STATUSES.EXPIRED
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(33, id, CONTENT_TYPES.PROMOTIONS);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('promotions', 'Expired', updateEachGenerator(updatePromotion)));
    }

    function promotionItemExpired() {
        var modelAndSchemaName = CONTENT_TYPES.PROMOTIONSITEMS;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

        var query = {
            dateEnd: {
                $lt: new Date()
            },

            status: {
                $in: [PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.DRAFT]
            }

        };

        function updatePromotionItems(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PROMOTION_STATUSES.EXPIRED
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(35, id, CONTENT_TYPES.PROMOTIONSITEMS);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack(CONTENT_TYPES.PROMOTIONSITEMS, 'Expired', updateEachGenerator(updatePromotionItems)));
    }

    function competitorPromotionExpired() {
        var modelAndSchemaName = CONTENT_TYPES.COMPETITORPROMOTION;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

        var query = {
            dateEnd: {
                $lt: new Date()
            },

            status: {
                $eq: PROMOTION_STATUSES.ACTIVE
            }

        };

        function updateCompetitorPromotion(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PROMOTION_STATUSES.EXPIRED
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(32, id, CONTENT_TYPES.COMPETITORPROMOTION);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('competitorPromotion', 'Expired', updateEachGenerator(updateCompetitorPromotion)));
    }

    function brandingAndDisplayExpired() {
        var modelAndSchemaName = CONTENT_TYPES.BRANDINGANDDISPLAY;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

        var query = {
            dateEnd: {
                $lt: new Date()
            },

            status: {
                $eq: PROMOTION_STATUSES.ACTIVE
            }
        };

        function updateBrandingAndDisplay(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PROMOTION_STATUSES.EXPIRED
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(38, id, CONTENT_TYPES.BRANDINGANDDISPLAY);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('brandingAndDisplay', 'Expired', updateEachGenerator(updateBrandingAndDisplay)));
    }

    function competitorBrandingAndDisplayExpired() {
        var modelAndSchemaName = CONTENT_TYPES.COMPETITORBRANDING;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

        var query = {
            dateEnd: {
                $lt: new Date()
            },

            status: {
                $eq: PROMOTION_STATUSES.ACTIVE
            }
        };

        function updateCompetitorBrandingAndDisplay(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PROMOTION_STATUSES.EXPIRED
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(34, id, CONTENT_TYPES.COMPETITORBRANDING);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('competitorBranding', 'Expired', updateEachGenerator(updateCompetitorBrandingAndDisplay)));
    }

    function questionaryExpired() {
        var modelAndSchemaName = CONTENT_TYPES.QUESTIONNARIES;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

        var query = {
            dueDate: {
                $lt: new Date()
            },

            status: {
                $eq: PROMOTION_STATUSES.ACTIVE
            }
        };

        function updateQuestionary(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: PROMOTION_STATUSES.EXPIRED
                }
            }, function (err, model) {
                if (err) {
                    return cb(err);
                }

                if (model) {
                    triggerEvent(34, id, CONTENT_TYPES.COMPETITORBRANDING);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('questionnary', 'Expired', updateEachGenerator(updateQuestionary)));
    }

    function objectivesOverDue() {
        var modelAndSchemaName = CONTENT_TYPES.OBJECTIVES;
        var schema = mongoose.Schemas[modelAndSchemaName];
        var Model = db.model(modelAndSchemaName, schema);
        var OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

        var query = {
            dateEnd: {
                $lt: new Date()
            },

            status: {
                $in: [
                    OBJECTIVE_STATUSES.IN_PROGRESS,
                    OBJECTIVE_STATUSES.RE_OPENED,
                    OBJECTIVE_STATUSES.TO_BE_DISCUSSED
                ]
            }

        };

        function updateObjective(id, cb) {
            Model.findByIdAndUpdate(id, {
                $set: {
                    status: OBJECTIVE_STATUSES.OVER_DUE
                }
            }, function (err, model) {
                var type;
                var mid;

                if (err) {
                    return cb(err);
                }

                if (model) {
                    type = model.context;
                    mid = type === CONTENT_TYPES.OBJECTIVES ? 7 : 18;

                    triggerEvent(mid, id, type);
                }

                cb(null);
            });
        }

        Model.aggregate(getPipeLine(query), schedulerCallBack('objectives', 'OverDue', updateEachGenerator(updateObjective)));
    }

    function Scheduler() {
        var hourlySchedulersArray = [
            objectivesOverDue,
            contractsYearlyExpired,
            contractsSecondaryExpired,
            promotionExpired,
            promotionItemExpired,
            brandingAndDisplayExpired,
            competitorBrandingAndDisplayExpired,
            competitorPromotionExpired,
            personnelInactive,
            questionaryExpired
        ];

        function addJobs(array, rule) {
            array.forEach(function (scheduler) {
                nodeScheduler.scheduleJob(rule, scheduler);
            });
        }

        this.initEveryHourScheduler = function () {

            if (!process.env.INITED_SCHEDULER) {

                addJobs(hourlySchedulersArray, hourlyRule);

                process.env.INITED_SCHEDULER = true;
                console.log('=================== initEveryHourScheduler ===================');
            } else {
                logWriter.log('Scheduler.initEveryHourScheduler is inited');
                console.log('============== initEveryHourScheduler is INITED ==============');
            }
        };
    }

    return Scheduler;
};
