const async = require('async');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const mongo = require('./../../../utils/mongo');
const ObjectiveModel = require('./../../../types/objective/model');
const FileHandler = require('./../../../handlers/file');
const FileModel = require('./../../../types/file/model');
const access = require('./../../../helpers/access')();

const ObjectId = mongoose.Types.ObjectId;
const fileHandler = new FileHandler(mongo.db);

module.exports = function (req, res, next) {
    function queryRun() {
        const body = req.body;
        const session = req.session;
        const userId = session.uId;
        const fileId = body.fileId;
        const inStoreTaskId = body.inStoreTaskId;
        let error;
        let fileName;

        if (!inStoreTaskId || !fileId) {
            error = new Error('Not enough params');
            error.status = 400;
            return next(error);
        }

        async.waterfall([

            function (cb) {
                FileModel.findById(fileId, (err, fileModel) => {
                    if (err) {
                        return cb(err, null);
                    }

                    if (!fileModel) {
                        error = new Error('File not found');
                        error.status = 400;
                        return cb(err, null);
                    }

                    fileName = fileModel.get('name');

                    if (userId === fileModel.get('createdBy.user').toString()) {
                        return cb(null, true);
                    }

                    cb(null, false);
                });
            },

            function (removeFile, cb) {
                ObjectiveModel.update(inStoreTaskId, { $pull: { attachments: ObjectId(fileId) } }, (err) => {
                    if (err) {
                        return cb(err);
                    }

                    if (removeFile) {
                        fileHandler.deleteFile(fileName, 'objectives', (err) => {
                            if (err) {
                                return cb(err);
                            }
                        });
                    }

                    cb();
                });
            },

        ], (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send();
        });
    }

    access.getEditAccess(req, ACL_MODULES.IN_STORE_REPORTING, (err, allowed) => {
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
