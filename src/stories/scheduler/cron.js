const async = require('async');
const nodeScheduler = require('node-schedule');
const moment = require('moment');
const CONTENT_TYPES = require('../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('../../public/js/constants/otherConstants');
const logger = require('./../../utils/logger');
const ActivityLog = require('./../push-notifications/activityLog');
const PERSONNEL_STATUSES = require('./../../public/js/constants/personnelStatuses');
const PersonnelModel = require('./../../types/personnel/model');
const ContractYearlyModel = require('./../../types/contractYearly/model');
const ContractSecondaryModel = require('./../../types/contractSecondary/model');
const ObjectiveModel = require('./../../types/objective/model');
const PromotionModel = require('./../../types/promotion/model');
const PromotionItemModel = require('./../../types/promotionItem/model');
const CompetitorPromotionModel = require('./../../types/competitorPromotion/model');
const MarketingCampaignModel = require('./../../types/brandingActivity/model');
const CompetitorBrandingAndDisplayModel = require('./../../types/competitorBranding/model');
const QuestionnaireModel = require('./../../types/questionnaries/model');

const getPipeline = (query) => {
    return [{
        $match: query,
    }, {
        $group: {
            _id: null,
            setId: {
                $addToSet: '$_id',
            },
        },
    }];
};

const createAction = (model) => {
    const json = model.toJSON();

    return {
        actionOriginator: json.createdBy.user,
        accessRoleLevel: json.level,
        body: json,
    };
};

const exec = (options) => {
    const {
        domain,
        actionType,
        iterator,
    } = options;
    const infoMessage = `scheduler:${domain}:${actionType}`;

    return (err, result) => {
        const setId = result.length ? result.slice().pop().setId : [];

        if (err) {
            logger.error(`[${infoMessage}/*]:`, err);
        }

        if (!setId.length) {
            logger.info(`[${infoMessage}/*]: Skipping...`);
            return;
        }

        async.each(setId, (id, eachCb) => {
            iterator(id, (err) => {
                if (err) {
                    logger.error(`[${infoMessage}/${id}]:`, err);
                    return eachCb(null);
                }

                logger.info(`[${infoMessage}/${id}]: Done.`);
                eachCb(null);
            });
        });
    };
};

const personnelInactive = () => {
    const contentType = CONTENT_TYPES.PERSONNEL;
    const startDate = new Date();
    const endDate = new Date(startDate.getMonth() - 2);
    const query = {
        lastAccess: {
            $lte: endDate,
        },
        temp: false,
        status: {
            $nin: [PERSONNEL_STATUSES.ONLEAVE._id, PERSONNEL_STATUSES.INACTIVE._id],
        },
    };
    const iterator = (id, callback) => {
        PersonnelModel.findByIdAndUpdate(id, {
            $set: {
                status: PERSONNEL_STATUSES.INACTIVE._id,
            },
        }, (err, personnel) => {
            if (err) {
                return callback(err);
            }

            if (personnel) {
                const payload = createAction(personnel);

                ActivityLog.emit('personnel:updated', payload);
            }

            callback(null);
        });
    };


    PersonnelModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'inactive',
        iterator,
    }));
};

const contractsYearlyExpired = () => {
    const contentType = CONTENT_TYPES.CONTRACTSYEARLY;
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date(),
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE,
        },
    };

    const iterator = (id, callback) => {
        ContractYearlyModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED,
            },
        }, (err, contract) => {
            if (err) {
                return callback(err);
            }

            if (contract) {
                const payload = createAction(contract);

                ActivityLog.emit('contracts:yearly:expired', payload);
            }

            callback(null);
        });
    };

    ContractYearlyModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'expired',
        iterator,
    }));
};

const contractSecondaryExpired = () => {
    const contentType = CONTENT_TYPES.CONTRACTSSECONDARY;
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date(),
        },

        status: {
            $eq: PROMOTION_STATUSES.ACTIVE,
        },
    };

    const iterator = (id, callback) => {
        ContractSecondaryModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED,
            },
        }, (err, contract) => {
            if (err) {
                return callback(err);
            }

            if (contract) {
                const payload = createAction(contract);

                ActivityLog.emit('contracts:secondary:expired', payload);
            }

            callback(null);
        });
    };

    ContractSecondaryModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'expired',
        iterator,
    }));
};

const promotionExpired = () => {
    const contentType = CONTENT_TYPES.PROMOTIONS;
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date(),
        },
        status: {
            $eq: PROMOTION_STATUSES.ACTIVE,
        },
    };
    const iterator = (id, callback) => {
        PromotionModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED,
            },
        }, (err, report) => {
            if (err) {
                return callback(err);
            }

            if (report) {
                const payload = createAction(report);

                ActivityLog.emit('reporting:al-alali-promo-evaluation:expired', payload);
            }

            callback(null);
        });
    };

    PromotionModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'expired',
        iterator,
    }));
};

const promotionItemExpired = () => {
    const contentType = CONTENT_TYPES.PROMOTIONSITEMS;
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date(),
        },
        status: {
            $in: [PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.DRAFT],
        },
    };
    const iterator = (id, callback) => {
        PromotionItemModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED,
            },
        }, (err, report) => {
            if (err) {
                return callback(err);
            }

            if (report) {
                const payload = createAction(report);

                ActivityLog.emit('reporting:al-alali-promo-evaluation:item-expired', payload);
            }

            callback(null);
        });
    };

    PromotionItemModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'expired',
        iterator,
    }));
};

const competitorPromotionExpired = () => {
    const contentType = CONTENT_TYPES.COMPETITORPROMOTION;
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date(),
        },
        status: {
            $eq: PROMOTION_STATUSES.ACTIVE,
        },
    };

    const iterator = (id, callback) => {
        CompetitorPromotionModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED,
            },
        }, (err, report) => {
            if (err) {
                return callback(err);
            }

            if (report) {
                const payload = createAction(report);

                ActivityLog.emit('reporting:competitor-promotion-activities:expired', payload);
            }

            callback(null);
        });
    };

    CompetitorPromotionModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'expired',
        iterator,
    }));
};

const marketingCampaignExpired = () => {
    const contentType = CONTENT_TYPES.BRANDING_ACTIVITY;
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date(),
        },
        status: {
            $eq: PROMOTION_STATUSES.ACTIVE,
        },
    };

    const iterator = (id, callback) => {
        MarketingCampaignModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED,
            },
        }, (err, report) => {
            if (err) {
                return callback(err);
            }

            if (report) {
                const payload = createAction(report);

                ActivityLog.emit('marketing:al-alali-marketing-campaigns:expired', payload);
            }

            callback(null);
        });
    };

    MarketingCampaignModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'expired',
        iterator,
    }));
};

const competitorBrandingAndDisplayExpired = () => {
    const contentType = CONTENT_TYPES.COMPETITORBRANDING;
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date(),
        },
        status: {
            $eq: PROMOTION_STATUSES.ACTIVE,
        },
    };

    const iterator = (id, callback) => {
        CompetitorBrandingAndDisplayModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED,
            },
        }, (err, report) => {
            if (err) {
                return callback(err);
            }

            if (report) {
                const payload = createAction(report);

                ActivityLog.emit('reporting:competitor-branding-and-display-report:expired', payload);
            }

            callback(null);
        });
    };

    CompetitorBrandingAndDisplayModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'expired',
        iterator,
    }));
};

const questionnaireExpired = () => {
    const contentType = CONTENT_TYPES.QUESTIONNARIES;
    const PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;
    const query = {
        dueDate: {
            $lt: new Date(),
        },
        status: {
            $eq: PROMOTION_STATUSES.ACTIVE,
        },
    };
    const iterator = (id, callback) => {
        QuestionnaireModel.findByIdAndUpdate(id, {
            $set: {
                status: PROMOTION_STATUSES.EXPIRED,
            },
        }, (err, questionnaire) => {
            if (err) {
                return callback(err);
            }

            if (questionnaire) {
                const payload = createAction(questionnaire);

                ActivityLog.emit('marketing:al-alali-questionnaire:expired', payload);
            }

            callback(null);
        });
    };

    QuestionnaireModel.aggregate(getPipeline(query), exec({
        domain: contentType,
        actionType: 'expired',
        iterator,
    }));
};

const objectiveOverdue = () => {
    const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
    const query = {
        dateEnd: {
            $lt: new Date(),
        },
        status: {
            $in: [
                OBJECTIVE_STATUSES.IN_PROGRESS,
                OBJECTIVE_STATUSES.RE_OPENED,
                OBJECTIVE_STATUSES.TO_BE_DISCUSSED,
            ],
        },
    };
    const iterator = (id, callback) => {
        ObjectiveModel.findByIdAndUpdate(id, {
            $set: {
                status: OBJECTIVE_STATUSES.OVER_DUE,
            },
        }, (err, objective) => {
            if (err) {
                return callback(err);
            }

            if (objective) {
                const type = objective.context;
                const payload = createAction(objective);

                if (type === CONTENT_TYPES.OBJECTIVES) {
                    ActivityLog.emit('objective:overdue', payload);
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
        iterator,
    }));
};

const objectiveFail = () => {
    const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
    const query = {
        'editedBy.date': {
            $lte: moment().add(-30, 'days'),
        },
        status: OBJECTIVE_STATUSES.OVER_DUE,
    };
    const iterator = (id, callback) => {
        ObjectiveModel.findByIdAndUpdate(id, {
            $set: {
                status: OBJECTIVE_STATUSES.FAIL,
            },
        }, (err, objective) => {
            if (err) {
                return callback(err);
            }

            if (objective) {
                const type = objective.context;
                const payload = createAction(objective);

                if (type === CONTENT_TYPES.OBJECTIVES) {
                    ActivityLog.emit('objective:fail', payload);
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
        iterator,
    }));
};

class Scheduler {

    subscribe(jobs, schedule) {
        jobs.forEach((job) => {
            nodeScheduler.scheduleJob(schedule, job);
        });
    }

    start() {
        const jobs = [
            objectiveFail,
            objectiveOverdue,
            contractsYearlyExpired,
            contractSecondaryExpired,
            promotionExpired,
            promotionItemExpired,
            marketingCampaignExpired,
            competitorBrandingAndDisplayExpired,
            competitorPromotionExpired,
            personnelInactive,
            questionnaireExpired,
        ];

        this.subscribe(jobs, '0 0 * * *'); // every midnight

        logger.info('Scheduler started');
    }

}

module.exports = Scheduler;
