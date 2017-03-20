const async = require('async');
const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');
const mongo = require('./../../../utils/mongo');
const ObjectiveModel = require('././../../../types/objective/model');
const FileHandler = require('./../../../handlers/file');
const access = require('./../../../helpers/access')();
const bodyValidator = require('./../../../helpers/bodyValidator');
const InStoreTaskUtils = require('./../../../stories/test-utils').InStoreTaskUtils;

const ObjectId = mongoose.Types.ObjectId;
const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
const fileHandler = new FileHandler(mongo.db);

module.exports = function (req, res, next) {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const store = new InStoreTaskUtils({
        actionOriginator: userId,
        accessRoleLevel,
    });

    function queryRun(updateObject, body) {
        const files = req.files;
        let attachments;
        const inStoreTaskId = req.params.id;
        let index;
        const fullUpdate = {
            $set: updateObject,
        };

        attachments = body.attachments;

        async.waterfall([

            function (cb) {
                if (!files) {
                    return cb(null, []);
                }

                // TODO: change bucket from constants
                fileHandler.uploadFile(userId, files, CONTENT_TYPES.OBJECTIVES, (err, filesIds) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, filesIds);
                });
            },

            function (filesIds, cb) {
                updateObject.editedBy = {
                    user: ObjectId(userId),
                    date: new Date(),
                };

                if (attachments && attachments.length) {
                    attachments = attachments.objectID();

                    updateObject.attachments = attachments.concat(filesIds);
                } else {
                    delete updateObject.attachments;

                    fullUpdate.$addToSet = {};
                    fullUpdate.$addToSet.attachments = { $each: filesIds };
                }

                ObjectiveModel.findOne({ _id: inStoreTaskId }, (err, inStoreTaskModel) => {
                    let error;
                    let history;

                    if (err) {
                        return cb(err);
                    }

                    if (!inStoreTaskModel) {
                        error = new Error('In store task not found');
                        error.status = 400;
                        return cb(error);
                    }

                    store.setPreviousState(inStoreTaskModel.toJSON());

                    if (lodash.includes([
                        OBJECTIVE_STATUSES.FAIL,
                        OBJECTIVE_STATUSES.CLOSED,
                    ], inStoreTaskModel.status)) {
                        error = new Error(`You could not update task with status: "${inStoreTaskModel.status}"`);
                        error.status = 400;

                        return cb(error);
                    }

                    if (inStoreTaskModel.status === OBJECTIVE_STATUSES.OVER_DUE
                        && inStoreTaskModel.createdBy.user.toString() !== userId) {
                        error = new Error(`You could not update task with status: "${inStoreTaskModel.status}"`);
                        error.status = 400;

                        return cb(error);
                    }

                    if (updateObject.assignedTo && updateObject.assignedTo.length) {
                        history = inStoreTaskModel.get('history');

                        if (!history.length) {
                            index = 1;
                        } else {
                            index = history.length + 1;
                        }

                        history.push({
                            assignedTo: updateObject.assignedTo[0],
                            index,
                        });

                        updateObject.history = history;
                    }
                    if (updateObject.title) {
                        updateObject.title = {
                            en: updateObject.title.en ? _.escape(updateObject.title.en) : '',
                            ar: updateObject.title.ar ? _.escape(updateObject.title.ar) : '',
                        };
                    }
                    if (updateObject.description) {
                        updateObject.description = {
                            en: updateObject.description.en ? _.escape(updateObject.description.en) : '',
                            ar: updateObject.description.ar ? _.escape(updateObject.description.ar) : '',
                        };
                    }

                    ObjectiveModel.findOneAndUpdate({
                        _id: inStoreTaskId,
                    }, fullUpdate, {
                        new: true,
                        runValidators: true,
                    }, (err, updatedModel) => {
                        if (err) {
                            return cb(err);
                        }

                        store.setNextState(updatedModel.toJSON());
                        store.difference();
                        store.publish();

                        cb(null, inStoreTaskModel.get('_id'));
                    });
                });
            },

            function (id, cb) {
                self.getByIdAggr({ id, isMobile: req.isMobile }, cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    }

    access.getEditAccess(req, ACL_MODULES.IN_STORE_REPORTING, () => {
        let body = {};
        let updateObject;

        try {
            if (req.body.data) {
                body = JSON.parse(req.body.data);
            } else {
                body = req.body;
            }

            updateObject = body.changed;

            if (typeof updateObject === 'string') {
                updateObject = JSON.parse(updateObject);
            }

            if (typeof body.attachments === 'string') {
                body.attachments = JSON.parse(body.attachments);
            }
        } catch (err) {
            return next(err);
        }

        bodyValidator.validateBody(updateObject, req.session.level, CONTENT_TYPES.INSTORETASKS, 'update', (err, saveData) => {
            if (err) {
                return next(err);
            }

            queryRun(saveData, body);
        });
    });
};
