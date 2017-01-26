const async = require('async');
const nodeScheduler = require('node-schedule');
const mongoose = require('mongoose');
const moment = require('moment');
const CONTENT_TYPES = require('../public/js/constants/contentType.js');
const OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
const ACTIVITY_TYPES = require('../constants/activityTypes');
const logger = require('./../utils/logger');
const mongo = require('./../utils/mongo');
const event = require('./../utils/eventEmitter');
const ActivityLog = require('./../stories/push-notifications/activityLog');

const getPipeline = (query) => {
    const pipeLine = [];

    pipeLine.push({
        $match: query
    });
    pipeLine.push({
        $group: {
            _id: null,
            setId: {
                $addToSet: '$_id'
            }
        }
    });

    return pipeLine;
};

const triggerEvent = (mid, id, itemType) => {
    event.emit('activityChange', {
        module: mid,
        actionType: ACTIVITY_TYPES.UPDATED,
        createdBy: {
            user: null,
            date: new Date()
        },
        itemId: id,
        itemType
    });
};

const exec = (options) => {
    const {
        domain,
        actionType,
        iterator,
    } = options;

    return (err, resObject) => {
        if (err) {
            logger.error(`[scheduler] ${domain}:${actionType}`, err);
        } else if (resObject[0] && resObject[0].setId && resObject[0].setId.length) {
            iterator(resObject[0].setId, (err) => {
                if (err) {
                    logger.error(`[scheduler] branding-and-display:expired`, err);
                    return
                }

                logger.info(`[scheduler] ${domain}:${actionType} updated.`);
            });
        } else {
            logger.info(`[scheduler] ${domain}:${actionType} skipping...`);
        }
    };
};

const updateEachGenerator = (updateMethod) => {
    return (setId, callback) => {
        async.each(setId, updateMethod, callback);
    };
};

const personnelInactive = () => {
    const PERSONNEL_STATUSES = require('../public/js/constants/personnelStatuses.js');
    const PersonnelModel = require('./../types/personnel/model');
    const startDate = new Date();
    const endDate = new Date(startDate.getMonth() - 2);
    const query = {
        lastAccess: {
            $lte: endDate
        },
        temp: false,
        status: {
            $nin: [PERSONNEL_STATUSES.ONLEAVE._id, PERSONNEL_STATUSES.INACTIVE._id]
        }
    };
    const updatePersonnel = (id, callback) => {
        PersonnelModel.findByIdAndUpdate(id, {
            $set: {
                status: PERSONNEL_STATUSES.INACTIVE._id
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(20, id, CONTENT_TYPES.PERSONNEL);
            }

            callback(null);
        });
    };

    PersonnelModel.aggregate(getPipeline(query), exec('personnel', 'Inactive', updateEachGenerator(updatePersonnel)));
};

const contractsYearlyExpired = () => {
    const ContractYearlyModel = require('./../types/contractYearly/model');
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date()
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE
        }
    };

    const updateContract = (id, callback) => {
        ContractYearlyModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(20, id, CONTENT_TYPES.CONTRACTSYEARLY);
            }

            callback(null);
        });
    };

    ContractYearlyModel.aggregate(getPipeline(query), exec('contractsYearly', 'Expired', updateEachGenerator(updateContract)));
};

const contractsSecondaryExpired = () => {
    const ContractSecondaryModel = require('./../types/contractSecondary/model');
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date()
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE
        }
    };

    const updateContract = (id, callback) => {
        ContractSecondaryModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(22, id, CONTENT_TYPES.CONTRACTSSECONDARY);
            }

            callback(null);
        });
    };

    ContractSecondaryModel.aggregate(getPipeline(query), exec('contractsSecondary', 'Expired', updateEachGenerator(updateContract)));
};

const promotionExpired = () => {
    const PromotionModel = require('./../types/promotion/model');
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date()
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE
        }

    };
    const updatePromotion = (id, callback) => {
        PromotionModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(33, id, CONTENT_TYPES.PROMOTIONS);
            }

            callback(null);
        });
    };

    PromotionModel.aggregate(getPipeline(query), exec('promotions', 'Expired', updateEachGenerator(updatePromotion)));
};

const promotionItemExpired = () => {
    const PromotionItemModel = require('./../types/promotionItem/model');
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date()
        },

        status: {
            $in: [PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.DRAFT]
        }

    };

    const updatePromotionItems = (id, callback) => {
        PromotionItemModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(35, id, CONTENT_TYPES.PROMOTIONSITEMS);
            }

            callback(null);
        });
    };

    PromotionItemModel.aggregate(getPipeline(query), exec(CONTENT_TYPES.PROMOTIONSITEMS, 'Expired', updateEachGenerator(updatePromotionItems)));
};

const competitorPromotionExpired = () => {
    const CompetitorPromotionModel = require('./../types/competitorPromotion/model');
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date()
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE
        }

    };

    const updateCompetitorPromotion = (id, callback) => {
        CompetitorPromotionModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(32, id, CONTENT_TYPES.COMPETITORPROMOTION);
            }

            callback(null);
        });
    };

    CompetitorPromotionModel.aggregate(getPipeline(query), exec('competitorPromotion', 'Expired', updateEachGenerator(updateCompetitorPromotion)));
};

const brandingActivityExpired = () => {
    const BrandingActivityModel = require('../types/brandingActivity/model');
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date()
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE
        }
    };

    const updateBrandingActivity = (id, callback) => {
        BrandingActivityModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(38, id, CONTENT_TYPES.BRANDING_ACTIVITY);
            }

            callback(null);
        });
    };

    BrandingActivityModel.aggregate(getPipeline(query), exec('brandingActivity', 'Expired', updateEachGenerator(updateBrandingActivity)));
};

const competitorBrandingAndDisplayExpired = () => {
    const CompetitorBrandingModel = require('./../types/competitorBranding/model');
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date()
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE
        }
    };

    const updateCompetitorBrandingAndDisplay = (id, callback) => {
        CompetitorBrandingModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(34, id, CONTENT_TYPES.COMPETITORBRANDING);
            }

            callback(null);
        });
    };

    CompetitorBrandingModel.aggregate(getPipeline(query), exec('competitorBranding', 'Expired', updateEachGenerator(updateCompetitorBrandingAndDisplay)));
};

const questionaryExpired = () => {
    const QuestionnariesModel = require('./../types/questionnaries/model');
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dueDate: {
            $lt: new Date()
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE
        }
    };
    const updateQuestionary = (id, callback) => {
        QuestionnariesModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED
            }
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                triggerEvent(34, id, CONTENT_TYPES.COMPETITORBRANDING);
            }

            callback(null);
        });
    }

    QuestionnariesModel.aggregate(getPipeline(query), exec('questionnary', 'Expired', updateEachGenerator(updateQuestionary)));
};

const objectivesOverDue = () => {
    const ObjectiveModel = require('./../types/objective/model');
    const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
    const query = {
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
    const updateObjective = (id, callback) => {
        ObjectiveModel.findByIdAndUpdate(id, {
            $set: {
                status: OBJECTIVE_STATUSES.OVER_DUE,
            },
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                const type = model.context;
                const modelAsJson = model.toJSON();
                const payload = {
                    accessRoleLevel: modelAsJson.level,
                    userId: modelAsJson.createdBy.user,
                    body: modelAsJson,
                };

                if (type === CONTENT_TYPES.OBJECTIVES) {
                    ActivityLog.emit('objective:overdue', payload)
                }

                if (type === CONTENT_TYPES.INSTORETASKS) {
                    ActivityLog.emit('in-store-task:overdue', payload);
                }
            }

            callback(null);
        });
    };

    ObjectiveModel.aggregate(getPipeline(query), exec({
        domain: 'objective',
        actionType: 'overdue',
        iterator: updateObjective,
    }));
};

const objectivesFail = () => {
    const ObjectiveModel = require('./../types/objective/model');
    const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
    const query = {
        'editedBy.date': {
            $lte: moment().add(-30, 'days')
        },
        status: OBJECTIVE_STATUSES.OVER_DUE,
    };
    const updateObjective = (id, callback) => {
        ObjectiveModel.findByIdAndUpdate(id, {
            $set: {
                status: OBJECTIVE_STATUSES.FAIL,
            },
        }, (err, model) => {
            if (err) {
                return callback(err);
            }

            if (model) {
                const type = model.context;
                const modelAsJson = model.toJSON();
                const payload = {
                    accessRoleLevel: modelAsJson.level,
                    userId: modelAsJson.createdBy.user,
                    body: modelAsJson,
                };

                if (type === CONTENT_TYPES.OBJECTIVES) {
                    ActivityLog.emit('objective:fail', payload)
                }

                if (type === CONTENT_TYPES.INSTORETASKS) {
                    ActivityLog.emit('in-store-task:fail', payload);
                }
            }

            callback(null);
        });
    };

    ObjectiveModel.aggregate(getPipeline(query), exec({
        domain: 'objective',
        actionType: 'fail',
        iterator: updateObjective,
    }));
};

class Scheduler {

    subscribe(jobs, schedule) {
        jobs.forEach((job) => {
            nodeScheduler.scheduleJob(schedule, job);
        });
    };

    start() {
        const jobs = [
            objectivesFail,
            objectivesOverDue,
            // contractsYearlyExpired,
            // contractsSecondaryExpired,
            // promotionExpired,
            // promotionItemExpired,
            // brandingActivityExpired,
            // competitorBrandingAndDisplayExpired,
            // competitorPromotionExpired,
            // personnelInactive,
            // questionaryExpired,
        ];

        this.subscribe(jobs, '0 * * * *'); // every hour

        logger.info('Scheduler started');
    }

}

module.exports = Scheduler;
