const async = require('async');
const _ = require('lodash');
const extractBody = require('./../../../utils/extractBody');
const TestUtils = require('./../../../stories/push-notifications/utils/TestUtils');
const ActivityLog = require('./../../../stories/push-notifications/activityLog');
const mongo = require('./../../../utils/mongo');

const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');

const AccessManager = require('./../../../helpers/access')();
const bodyValidator = require('./../../../helpers/bodyValidator');

const ObjectiveModel = require('./../../../types/objective/model');

const FileHandler = require('./../../../handlers/file');
const DistributionFormHandler = require('./../../../handlers/distributionForm');
const VisibilityFormHandler = require('./../../../handlers/visibilityForm');
const getByIdAggr = require('./../reusable-components/getByIdAggr');

const fileHandler = new FileHandler();
const distributionFormHandler = new DistributionFormHandler(mongo);
const visibilityFormHandler = new VisibilityFormHandler(mongo);
const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const isMobile = req.isMobile;

    const queryRun = (body, callback) => {
        const files = req.files;
        const createdBy = {
            user: userId,
            date: new Date(),
        };

        const saveObjective = body.saveObjective;

        if (!body.assignedTo || !body.assignedTo.length) {
            const error = new Error('You must assign person to task');

            error.status = 400;
            return next(error);
        }

        async.waterfall([

            (cb) => {
                if (!files) {
                    return cb(null, []);
                }

                fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, (err, setFileId) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, setFileId);
                });
            },

            (setFileId, cb) => {
                const status = saveObjective ?
                    OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS;

                body.title = {
                    en: _.escape(_.get(body, 'title.en') || ''),
                    ar: _.escape(_.get(body, 'title.ar') || ''),
                };
                body.description = {
                    en: _.escape(_.get(body, 'description.en') || ''),
                    ar: _.escape(_.get(body, 'description.ar') || ''),
                };

                const data = {
                    objectiveType: body.objectiveType,
                    priority: body.priority,
                    status,
                    assignedTo: body.assignedTo,
                    level: session.level,
                    dateStart: body.dateStart,
                    dateEnd: body.dateEnd,
                    country: body.country,
                    region: body.region,
                    subRegion: body.subRegion,
                    retailSegment: body.retailSegment,
                    outlet: body.outlet,
                    branch: body.branch,
                    location: body.location,
                    attachments: setFileId,
                    createdBy,
                    editedBy: createdBy,
                    title: body.title,
                    description: body.description,
                };

                const objective = new ObjectiveModel();

                objective.set(data);
                objective.save((err, model) => {
                    cb(err, model);
                });
            },

            (objective, cb) => {
                if (body.formType === 'distribution') {
                    const data = {
                        objective: objective.get('_id'),
                    };

                    return distributionFormHandler.createForm(userId, data, (err, formModel) => {
                        if (err) {
                            return cb(err);
                        }

                        objective.form = {
                            _id: formModel.get('_id'),
                            contentType: body.formType,
                        };

                        cb(null, objective);
                    });
                }

                if (body.formType === 'visibility') {
                    const data = {
                        objective: objective.get('_id'),
                        createdBy,
                    };

                    return visibilityFormHandler.createForm(userId, data, (err, formModel) => {
                        if (err) {
                            return cb(err);
                        }

                        objective.form = {
                            _id: formModel.get('_id'),
                            contentType: body.formType,
                        };

                        cb(null, objective);
                    });
                }

                cb(null, objective);
            },

            (objective, cb) => {
                if (!body.formType) {
                    return cb(null, objective);
                }

                objective.save((err) => {
                    cb(err, objective);
                });
            },

            (objective, cb) => {
                const hasForm = _.has(body, 'formType');
                const isDistribution = hasForm && body.formType === 'distribution';

                // skip in case with visibility form
                if (!hasForm || isDistribution) {
                    if (TestUtils.isObjectiveDraft(objective)) {
                        ActivityLog.emit('objective:draft-created', {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: objective.toJSON(),
                        });
                    }

                    if (TestUtils.isObjectivePublished(objective)) {
                        ActivityLog.emit('objective:published', {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: objective.toJSON(),
                        });
                    }
                }

                const id = objective.get('_id');

                getByIdAggr({
                    id,
                    isMobile,
                }, cb);
            },

        ], callback);
    };

    async.waterfall([

        (cb) => {
            AccessManager.getWriteAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (personnel, allowed, cb) => {
            const body = extractBody(req.body);

            bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'create', cb);
        },

        queryRun,

    ], (err, result) => {
        if (err) {
            return next(err);
        }

        res.status(201).send(result);
    });
};
