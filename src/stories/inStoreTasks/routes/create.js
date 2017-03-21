const async = require('async');
const _ = require('underscore');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');
const mongo = require('./../../../utils/mongo');
const ObjectiveModel = require('././../../../types/objective/model');
const FileHandler = require('./../../../handlers/file');
const VisibilityFormHandler = require('./../../../handlers/visibilityForm');
const access = require('./../../../helpers/access')();
const bodyValidator = require('./../../../helpers/bodyValidator');
const extractBody = require('./../../../utils/extractBody');
const ActivityLog = require('./../../../stories/push-notifications/activityLog');
const TestUtils = require('./../../../stories/push-notifications/utils/TestUtils');

const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
const fileHandler = new FileHandler(mongo.db);
const visibilityFormHandler = new VisibilityFormHandler(mongo.db);

module.exports = (req, res, next) => {
    const accessRoleLevel = req.session.level;
    const queryRun = (body, callback) => {
        const files = req.files;
        const session = req.session;
        const userId = session.uId;
        const isMobile = req.isMobile;

        const saveObjective = body.saveObjective;

        if (!body.formType || body.formType !== 'visibility') {
            const error = new Error('Please link visibility form');

            error.status = 400;
            return callback(error);
        }

        if (!body.assignedTo || !body.assignedTo.length) {
            const error = new Error('You must assign person to task');

            error.status = 400;
            return callback(error);
        }

        if (body.assignedTo.length !== 1) {
            const error = new Error('In store task can be assigned only to one person');

            error.status = 400;
            return callback(error);
        }

        async.waterfall([

            (cb) => {
                if (!files) {
                    return cb(null, []);
                }

                fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, cb);
            },

            (filesIds, cb) => {
                const createdBy = {
                    user: userId,
                    date: new Date(),
                };
                const status = saveObjective ?
                    OBJECTIVE_STATUSES.DRAFT : OBJECTIVE_STATUSES.IN_PROGRESS;

                body.title = {
                    en: body.title.en ? _.escape(body.title.en) : '',
                    ar: body.title.ar ? _.escape(body.title.ar) : '',
                };
                body.description = {
                    en: body.description.en ? _.escape(body.description.en) : '',
                    ar: body.description.ar ? _.escape(body.description.ar) : '',
                };

                const inStoreTasks = {
                    title: body.title,
                    description: body.description,
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
                    attachments: filesIds,
                    context: CONTENT_TYPES.INSTORETASKS,
                    createdBy,
                    editedBy: createdBy,
                    history: {
                        assignedTo: body.assignedTo[0],
                        index: 1,
                    },
                };

                const model = new ObjectiveModel();

                model.set(inStoreTasks);
                model.save((err, model) => {
                    cb(err, model);
                });
            },

            (inStoreTaskModel, cb) => {
                if (TestUtils.isInStoreTaskDraft(inStoreTaskModel)) {
                    ActivityLog.emit('in-store-task:draft-created', {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body: inStoreTaskModel.toJSON(),
                    });
                }

                if (TestUtils.isInStoreTaskPublished(inStoreTaskModel)) {
                    ActivityLog.emit('in-store-task:published', {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body: inStoreTaskModel.toJSON(),
                    });
                }

                const data = {
                    objective: inStoreTaskModel.get('_id'),
                    description: '',
                };

                async.waterfall([

                    (cb) => {
                        visibilityFormHandler.createForm(userId, data, cb);
                    },

                    (formModel, cb) => {
                        inStoreTaskModel.form = {
                            _id: formModel.get('_id'),
                            contentType: body.formType,
                        };

                        inStoreTaskModel.save((err, model) => {
                            cb(err, model);
                        });
                    },

                ], cb);
            },

            (inStoreTaskModel, cb) => {
                const id = inStoreTaskModel.get('_id');

                self.getByIdAggr({ id, isMobile }, cb);
            },

        ], callback);
    };

    async.waterfall([

        (cb) => {
            access.getWriteAccess(req, ACL_MODULES.IN_STORE_REPORTING, cb);
        },

        (allowed, personnel, cb) => {
            const body = extractBody(req.body);

            bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.INSTORETASKS, 'create', cb);
        },

        queryRun,

    ], (err, body) => {
        if (err) {
            return next(err);
        }

        res.status(201).send(body);
    });
};
