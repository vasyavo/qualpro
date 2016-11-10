const async = require('async');
const nodeScheduler = require('node-schedule');
const mongoose = require('mongoose');
const CONTENT_TYPES = require('../public/js/constants/contentType.js');
const OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
const ACTIVITY_TYPES = require('../constants/activityTypes');
const logger = require('./../utils/logger');

const logWriter = require('../helpers/logWriter');
const hourlyRule = '0 * * * *';

function consoleLogENV(message) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(message);
    }
}

module.exports = function (db, event) {
    function getPipeLine(query) {
        const pipeLine = [];

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

    function personnelInactive() {
        var PERSONNEL_STATUSES = require('../public/js/constants/personnelStatuses.js');
        const PersonnelModel = require('./../types/personnel/model');
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
            PersonnelModel.findByIdAndUpdate(id, {
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

        PersonnelModel.aggregate(getPipeLine(query), schedulerCallBack('personnel', 'Inactive', updateEachGenerator(updatePersonnel)));

    }

    function contractsYearlyExpired() {
        const ContractYearlyModel = require('./../types/contractYearly/model');
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
            ContractYearlyModel.findByIdAndUpdate(id, {
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

        ContractYearlyModel.aggregate(getPipeLine(query), schedulerCallBack('contractsYearly', 'Expired', updateEachGenerator(updateContract)));

    }

    function contractsSecondaryExpired() {
        const ContractSecondaryModel = require('./../types/contractSecondary/model');
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
            ContractSecondaryModel.findByIdAndUpdate(id, {
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

        ContractSecondaryModel.aggregate(getPipeLine(query), schedulerCallBack('contractsSecondary', 'Expired', updateEachGenerator(updateContract)));
    }

    function promotionExpired() {
        const PromotionModel = require('./../types/promotion/model');
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
            PromotionModel.findByIdAndUpdate(id, {
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

        PromotionModel.aggregate(getPipeLine(query), schedulerCallBack('promotions', 'Expired', updateEachGenerator(updatePromotion)));
    }

    function promotionItemExpired() {
        const PromotionItemModel = require('./../types/promotionItem/model');
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
            PromotionItemModel.findByIdAndUpdate(id, {
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

        PromotionItemModel.aggregate(getPipeLine(query), schedulerCallBack(CONTENT_TYPES.PROMOTIONSITEMS, 'Expired', updateEachGenerator(updatePromotionItems)));
    }

    function competitorPromotionExpired() {
        const CompetitorPromotionModel = require('./../types/competitorPromotion/model');
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
            CompetitorPromotionModel.findByIdAndUpdate(id, {
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

        CompetitorPromotionModel.aggregate(getPipeLine(query), schedulerCallBack('competitorPromotion', 'Expired', updateEachGenerator(updateCompetitorPromotion)));
    }

    function brandingAndDisplayExpired() {
        const BrandingAndDisplayModel = require('../types/brandingAndDisplay/model');
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
            BrandingAndDisplayModel.findByIdAndUpdate(id, {
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

        BrandingAndDisplayModel.aggregate(getPipeLine(query), schedulerCallBack('brandingAndDisplay', 'Expired', updateEachGenerator(updateBrandingAndDisplay)));
    }

    function competitorBrandingAndDisplayExpired() {
        const CompetitorBrandingModel = require('./../types/competitorBranding/model');
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
            CompetitorBrandingModel.findByIdAndUpdate(id, {
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

        CompetitorBrandingModel.aggregate(getPipeLine(query), schedulerCallBack('competitorBranding', 'Expired', updateEachGenerator(updateCompetitorBrandingAndDisplay)));
    }

    function questionaryExpired() {
        const QuestionnariesModel = require('./../types/questionnaries/model');
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
            QuestionnariesModel.findByIdAndUpdate(id, {
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

        QuestionnariesModel.aggregate(getPipeLine(query), schedulerCallBack('questionnary', 'Expired', updateEachGenerator(updateQuestionary)));
    }

    function objectivesOverDue() {
        const ObjectiveModel = require('./../types/objective/model');
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
            ObjectiveModel.findByIdAndUpdate(id, {
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

        ObjectiveModel.aggregate(getPipeLine(query), schedulerCallBack('objectives', 'OverDue', updateEachGenerator(updateObjective)));
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
                logger.info('=================== initEveryHourScheduler ===================');
            } else {
                logWriter.log('Scheduler.initEveryHourScheduler is inited');
                logger.info('============== initEveryHourScheduler is INITED ==============');
            }
        };
    }

    return Scheduler;
};
