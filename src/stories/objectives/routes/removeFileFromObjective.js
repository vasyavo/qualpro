const async = require('async');
const mongoose = require('mongoose');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const ObjectiveModel = require('./../../../types/objective/model');
const FileModel = require('./../../../types/file/model');
const FileHandler = require('./../../../handlers/file');

const fileHandler = new FileHandler();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const body = req.body;
    const session = req.session;
    const userId = session.uId;
    const fileId = body.fileId;
    const objectiveId = body.objectiveId;

    if (!objectiveId || !fileId) {
        const error = new Error('Not enough params');

        error.status = 400;
        return next(error);
    }

    async.waterfall([

        (cb) => {
            FileModel.findById(fileId, (err, fileModel) => {
                if (err) {
                    return cb(err, null);
                }

                if (!fileModel) {
                    const error = new Error('File not found');

                    error.status = 400;
                    return cb(err, null);
                }

                const fileName = fileModel.get('name');

                if (userId === fileModel.get('createdBy.user').toString()) {
                    return cb(null, {
                        removeFile: true,
                        fileName,
                    });
                }

                cb(null, {
                    removeFile: false,
                });
            });
        },

        (options, cb) => {
            const {
                removeFile,
                fileName,
            } = options;

            ObjectiveModel.update(objectiveId, {
                $pull: {
                    attachments: ObjectId(fileId),
                },
            }, (err) => {
                if (err) {
                    return cb(err);
                }

                if (removeFile) {
                    return fileHandler.deleteFile(fileName, CONTENT_TYPES.OBJECTIVES, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb();
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
};
