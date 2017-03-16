const async = require('async');
const _ = require('lodash');
const TestUtils = require('./../../../stories/push-notifications/utils/TestUtils');
const ActivityLog = require('./../../../stories/push-notifications/activityLog');
const mongo = require('./../../../utils/mongo');

const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');

const ObjectiveModel = require('./../../../types/objective/model');
const FileHandler = require('./../../../handlers/file');
const DistributionFormHandler = require('./../../../handlers/distributionForm');
const VisibilityFormHandler = require('./../../../handlers/visibilityForm');
const updateParents = require('./updateParents');
const getByIdAggr = require('./getByIdAggr');

const fileHandler = new FileHandler();
const distributionFormHandler = new DistributionFormHandler(mongo);
const visibilityFormHandler = new VisibilityFormHandler(mongo);
const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

module.exports = (options, callback) => {
    const {
        parentId,
        files,
        createdBy,
        isMobile,
    } = options;
    const saveObjective = options.saveObjective;
    const accessRoleLevel = options.level;
    const actionOriginator = options.createdBy.user;

    async.waterfall([

        (cb) => {
            ObjectiveModel.findById(parentId)
                .lean()
                .exec((err, parentObjective) => {
                    if (err) {
                        return cb(err);
                    }

                    if (!parentObjective) {
                        const error = new Error('Parent objective not found.');

                        error.status = 400;
                        return cb(error);
                    }

                    cb(null, parentObjective);
                });
        },

        (parentObjective, cb) => {
            const attachments = [...options.attachments];
            const objectivePayload = {
                title: options.title,
                description: options.description,
                parent: parentObjective.parent,
                priority: options.priority || parentObjective.priority,
                objectiveType: parentObjective.objectiveType,
                companyObjective: options.companyObjective || parentObjective.companyObjective,
                status: saveObjective ?
                    OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS,
                assignedTo: options.assignedTo,
                level: accessRoleLevel,
                createdBy,
                editedBy: createdBy,
                attachments,
                location: options.location,
                country: options.country,
                region: options.region,
                subRegion: options.subRegion,
                retailSegment: options.retailSegment,
                outlet: options.outlet,
                branch: options.branch,
                dateStart: options.dateStart || parentObjective.dateStart,
                dateEnd: options.dateEnd || parentObjective.dateEnd,
            };

            // attach form like in parent objective to sub objective
            // if it not defined
            if (!options.formType && parentObjective.form) {
                objectivePayload.form = parentObjective.form;
            }

            if (options.title) {
                objectivePayload.title = {
                    en: _.escape(_.get(options, 'title.en') || ''),
                    ar: _.escape(_.get(options, 'title.ar') || ''),
                };
            }

            if (options.description) {
                objectivePayload.description = {
                    en: _.escape(_.get(options, 'description.en') || ''),
                    ar: _.escape(_.get(options, 'description.ar') || ''),
                };
            }

            if (parentObjective.parent) {
                objectivePayload.parent = {
                    1: parentObjective.parent['1'] || null,
                    2: parentObjective.parent['2'] || null,
                    3: parentObjective.parent['3'] || null,
                    4: parentObjective.parent['4'] || null,
                };
                /*
                 * less then or equals to Area in Charge manager without Trade Marketer
                 * */
                const everyAdmin = [
                    ACL_CONSTANTS.MASTER_ADMIN,
                    ACL_CONSTANTS.COUNTRY_ADMIN,
                    ACL_CONSTANTS.AREA_MANAGER,
                    ACL_CONSTANTS.AREA_IN_CHARGE,
                    ACL_CONSTANTS.SALES_MAN,
                ];

                if (parentObjective.level && everyAdmin.indexOf(parentObjective.level) > -1) {
                    objectivePayload.parent[parentObjective.level] = parentObjective._id;
                }
            }

            if (parentObjective.companyObjective) {
                objectivePayload.companyObjective = parentObjective.companyObjective;
            }

            if (options.companyObjective) {
                objectivePayload.companyObjective = {
                    en: _.escape(_.get(options, 'companyObjective.en') || ''),
                    ar: _.escape(_.get(options, 'companyObjective.ar') || ''),
                };
            }

            async.waterfall([

                (cb) => {
                    if (!files) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(actionOriginator, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                        if (err) {
                            return cb(err, null);
                        }

                        attachments.push(
                            ...setFileId
                        );

                        cb(null);
                    });
                },

                (cb) => {
                    const objective = new ObjectiveModel();

                    objective.set(objectivePayload);
                    objective.save((err, objective) => {
                        cb(err, objective);
                    });
                },

                (objective, cb) => {
                    if (options.formType === 'distribution') {
                        const data = {
                            objective: objective.get('_id'),
                        };

                        return distributionFormHandler.createForm(actionOriginator, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: options.formType,
                            };

                            cb(null, objective);
                        });
                    }

                    if (options.formType === 'visibility') {
                        const data = {
                            objective: objective.get('_id'),
                            createdBy,
                        };

                        return visibilityFormHandler.createForm(actionOriginator, data, (err, formModel) => {
                            if (err) {
                                return cb(err);
                            }

                            objective.form = {
                                _id: formModel.get('_id'),
                                contentType: options.formType,
                            };

                            cb(null, objective);
                        });
                    }
                },

                (objective, cb) => {
                    if (!options.formType) {
                        return cb(null, objective);
                    }

                    objective.save((err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, objective);
                    });
                },

                updateParents,

                (objective, cb) => {
                    const isNotVisibility = options.formType !== 'visibility';

                    if (isNotVisibility) {
                        const eventPayload = {
                            actionOriginator,
                            accessRoleLevel,
                            body: objective.toJSON(),
                        };

                        if (TestUtils.isObjectiveDraft(objective)) {
                            ActivityLog.emit('sub-objective:draft-created', eventPayload);
                        }

                        if (TestUtils.isObjectivePublished(objective)) {
                            ActivityLog.emit('sub-objective:published', eventPayload);
                        }
                    }

                    const id = objective.get('_id');

                    getByIdAggr({
                        id,
                        isMobile,
                    }, cb);
                },

            ], cb);
        },

    ], callback);
};
