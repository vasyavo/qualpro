const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');
const extractBody = require('./../../../utils/extractBody');
const ObjectiveUtils = require('./../../../stories/test-utils').ObjectiveUtils;
const logger = require('./../../../utils/logger');
const toString = require('./../../../utils/toString');
const mongo = require('./../../../utils/mongo');

const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');

const AccessManager = require('./../../../helpers/access')();
const bodyValidator = require('./../../../helpers/bodyValidator');

const ObjectiveModel = require('./../../../types/objective/model');
const ObjectiveHistoryModel = require('./../../../types/objectiveHistory/model');
const PersonnelModel = require('./../../../types/personnel/model');

const FileHandler = require('./../../../handlers/file');
const DistributionFormHandler = require('./../../../handlers/distributionForm');
const VisibilityFormHandler = require('./../../../handlers/visibilityForm');
const updateParents = require('./../reusable-components/updateParents');
const getByIdAggr = require('./../reusable-components/getByIdAggr');
const updateObjectiveByAssigneeLocation = require('./../reusable-components/updateObjectiveByAssigneeLocation');

const fileHandler = new FileHandler();
const distributionFormHandler = new DistributionFormHandler(mongo);
const visibilityFormHandler = new VisibilityFormHandler(mongo);
const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const store = new ObjectiveUtils({
        actionOriginator: userId,
        accessRoleLevel,
    });
    const files = req.files;
    const body = extractBody(req.body);
    const objectiveId = req.params.id;
    let attachments = body.attachments;

    const queryRun = ($set, callback) => {
        const fullUpdate = {
            $set,
        };

        const updateCover = (objective) => {
            PersonnelModel.findOne({
                $and: [{
                    'vacation.cover': ObjectId(userId),
                }, {
                    $or: [{
                        _id: {
                            $in: objective.assignedTo,
                        },
                        'vacation.onLeave': true,
                    }, {
                        _id: ObjectId(objective.createdBy.user),
                        'vacation.onLeave': true,
                    }],
                }],
            }, (err, personnel) => {
                if (err) {
                    logger.error('Query on objective\'s cover fails', err);
                    return;
                }

                if (!personnel) {
                    logger.error('Cover personnel not found');
                    return;
                }

                const objectiveHistory = new ObjectiveHistoryModel({
                    objective: ObjectId(objective._id),
                    person: ObjectId(userId),
                });

                objectiveHistory.save((err) => {
                    if (err) {
                        logger.error('Objective\'s history doesn\'t saved', err);
                        return;
                    }
                });
            });
        };

        const updateObjective = (setFileId, cb) => {
            if ($set.status && $set.status !== OBJECTIVE_STATUSES.CLOSED) {
                $set.complete = $set.status === OBJECTIVE_STATUSES.COMPLETED ? 100 : 0;
            }

            $set.editedBy = {
                user: ObjectId(userId),
                date: new Date(),
            };

            attachments = attachments && attachments[0] ? attachments.objectID() : [];
            $set.attachments = attachments.concat(setFileId);
         /*   if (attachments && attachments.length) {
                $set.attachments = attachments.concat(setFileId);
            } else {
                delete $set.attachments;

                fullUpdate.$addToSet = {
                    attachments: {
                        $each: setFileId,
                    },
                };
            }*/

            if ($set.title) {
                $set['title.en'] = _.escape(_.get($set, 'title.en') || '');
                $set['title.ar'] = _.escape(_.get($set, 'title.ar') || '');

                delete $set.title;
            }

            if ($set.description) {
                $set['description.en'] = _.escape(_.get($set, 'description.en') || '');
                $set['description.ar'] = _.escape(_.get($set, 'description.ar') || '');

                delete $set.description;
            }

            async.waterfall([

                (cb) => {
                    ObjectiveModel.findOne({ _id: objectiveId })
                        .lean()
                        .exec(cb);
                },

                (objective, cb) => {
                    store.setPreviousState(objective);

                    if (_.includes([
                        OBJECTIVE_STATUSES.FAIL,
                        OBJECTIVE_STATUSES.CLOSED,
                    ], objective.status)) {
                        const error = new Error(`You could not update task with status: "${objective.status}"`);
                        error.status = 400;

                        return cb(error);
                    }

                 /*   if (objective.status === OBJECTIVE_STATUSES.OVER_DUE && toString(objective, 'createdBy.user') !== userId) {
                        const error = new Error(`You could not update task with status: "${objective.status}"`);

                        error.status = 400;
                        return cb(error);
                    }*/

                    cb(null);
                },

                (cb) => {
                    const opts = {
                        new: true,
                        runValidators: true,
                    };

                    ObjectiveModel.findOneAndUpdate({ _id: objectiveId }, fullUpdate, opts, cb);
                },

                (objective, cb) => {
                    if ($set.cover) {
                        updateCover(objective);
                    }

                    if (objective.status === OBJECTIVE_STATUSES.CLOSED
                        && objective.objectiveType !== 'individual'
                        && objective.level === ACL_CONSTANTS.MASTER_ADMIN) {
                        ObjectiveModel.update({
                            'parent.1': objective._id,
                        }, {
                            $set: {
                                archived: true,
                            },
                        }, {
                            multi: true,
                            runValidators: true,
                        }, (err, result) => {
                            if (err) {
                                logger.error(err);
                                return;
                            }

                            logger.info(result);
                        });
                    }

                    cb(null, objective);
                },

            ], cb);
        };

        const uploadFiles = (cb) => {
            if (!files) {
                return cb(null, []);
            }

            fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                if (err) {
                    return cb(err);
                }

                cb(null, setFileId);
            });
        };

        const waterfall = [
            uploadFiles,
            updateObjective,
        ];

        if ($set.formType) {
            const createForms = (objective, cb) => {
                if ($set.formType === 'distribution') {
                    /* TODO fill description from task if AM or AincM will link forms */
                    const data = {
                        objective: objective.get('_id'),
                        description: '',
                    };

                    return distributionFormHandler.createForm(userId, data, (err, formModel) => {
                        if (err) {
                            return cb(err);
                        }

                        objective.form = {
                            _id: formModel.get('_id'),
                            contentType: $set.formType,
                        };

                        cb(null, objective);
                    });
                }

                if ($set.formType === 'visibility') {
                    const data = {
                        objective: objective.get('_id'),
                        createdBy: {
                            user: userId,
                            date: objective.createdBy.date,
                        },
                    };

                    return visibilityFormHandler.createForm(userId, data, (err, formModel) => {
                        if (err) {
                            return cb(err);
                        }

                        objective.form = {
                            _id: formModel.get('_id'),
                            contentType: $set.formType,
                        };

                        cb(null, objective);
                    });
                }

                cb(null, objective);
            };

            const updateObjectiveWithForm = (objective, cb) => {
                if (!$set.formType) {
                    return cb(null, objective);
                }

                objective.save((err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, objective);
                });
            };

            waterfall.push(createForms);
            waterfall.push(updateObjectiveWithForm);
        }

        if ($set.formType === null) {
            const updateObjectiveWithForm = (objective, cb) => {
                objective.form = null;

                objective.save((err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, objective);
                });
            };

            waterfall.push(updateObjectiveWithForm);
        }

        if ($set.status && $set.status !== OBJECTIVE_STATUSES.CLOSED) {
            waterfall.push(updateParents);
        }

        if ($set.assignedTo && $set.assignedTo[0]) {
            waterfall.push(updateObjectiveByAssigneeLocation);
        }

        const getResultAndSend = (objective, cb) => {
            store.setNextState(objective.toJSON());
            store.difference();
            store.publish();

            const id = objective.get('_id');

            getByIdAggr({
                id,
                isMobile: req.isMobile,
            }, cb);
        };

        waterfall.push(getResultAndSend);

        async.waterfall(waterfall, callback);
    };

    async.waterfall([

        (cb) => {
            AccessManager.getEditAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (personnel, allowed, cb) => {
            bodyValidator.validateBody(body.changed, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'update', cb);
        },

        queryRun,

    ], (err, model) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(model);
    });
};
