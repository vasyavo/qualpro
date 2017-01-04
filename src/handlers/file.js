const async = require('async');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const logger = require('../utils/logger');
const ffmpeg = require('fluent-ffmpeg');
const im = require('imagemagick');
const mongoose = require('mongoose');
const config = require('./../config');
const OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
const FileModel = require('./../types/file/model');
const NEED_PROCESSING_TYPES = _.union(OTHER_CONSTANTS.IMAGE_CONTENT_TYPES, OTHER_CONSTANTS.VIDEO_CONTENT_TYPES, OTHER_CONSTANTS.OTHER_FORMATS);
const ObjectId = mongoose.Types.ObjectId;

module.exports = function() {
    var fileUploaderConfig;
    var fileUploader;
    var self = this;

    if (config.uploaderType && config.uploaderType === 'AmazonS3') {
        fileUploaderConfig = {
            type     : config.uploaderType,
            awsConfig: config.aws.s3
        };
    }

    fileUploader = require('../helpers/imageUploader/imageUploader.js')(fileUploaderConfig);

    function createFileName() {
        return (new ObjectId()).toString();
    }

    function deleteFile(path) {
        try {
            fs.unlink(path, (err) => {
                if (err) {
                    logger.error(err);
                }
            });
        } catch (e) {
            logger.error(e);
        }
    }

    this.getByIds = function (array, userId, callback) {
        if (!array.length) {
            var err = new Error();

            return callback(err);
        }
        var projection = {
            _id         : 1,
            preview     : 1,
            contentType : 1,
            type        : 1,
            originalName: 1,
            name        : 1

        };
        FileModel.find({_id: {$in: array}, 'createdBy.user': userId}, projection, function (err, fileModels) {
            if (err) {
                return callback(err);
            }
            return callback(null, fileModels);
        });
    };

    this.deleteFew = function (array, callback) {
        FileModel.remove({
            _id: {
                $in: array
            }
        }, function (err, fileModels) {
            if (err) {
                return callback(err);
            }
            return callback(null, null);
        });


    };

    this.getById = function (req, res, next) {
        var id = req.params.id;
        var bucket = req.params.bucket;
        var projection = {
            _id         : 1,
            name        : 1,
            originalName: 1,
            extension   : 1,
            contentType : 1,
            preview     : 1
        };

        FileModel.findById(id, projection, function (err, fileModel) {
            var error;
            var jsonModel;

            if (err) {
                return next(err);
            }

            if (!fileModel) {
                error = new Error('File model not found');
                error.status = 404;
                return next(error);
            }

            jsonModel = fileModel.toJSON();
            jsonModel.url = self.computeUrl(jsonModel.name, bucket);

            res.status(200).send(jsonModel);
        });
    };

    this.deleteFile = function (fileName, bucket, callback) {
        fileUploader.removeImage(fileName, bucket, function (err) {
            if (err && process.env.NODE_ENV !== 'production') {
                console.log(err);
            }
        });

        if (callback) {
            callback(null);
        }
    };

    this.computeUrl = function (fileName, bucket) {
        return fileUploader.getImageUrl(fileName, bucket);
    };

    this.uploadFile = function (userId, files, bucket, callback) {
        const filesId = [];
        let series = [];

        if (!userId || !files || !bucket) {
            const error = new Error('Not enough params');

            error.status = 400;
            return callback(error);
        }

        function uploadFile(fileOptions) {
            fileUploader.uploadFromFile(fileOptions, bucket, (err) => {
                if (err) {
                    logger.error(err);
                }

                fs.unlink(fileOptions.tempPath, (err) => {
                    if (err) {
                        logger.error(err);
                    }
                });
            });
        }

        function processVideo(fileOptions) {
            const fileName = fileOptions.name;
            const inputPath = fileOptions.tempPath;
            const outputPath = `/tmp/${fileName}dec.mp4`;

            ffmpeg(inputPath)
                .videoCodec('libx264')
                .renice(10)
                .duration(45)
                .toFormat('mp4')
                .outputOptions('-s 640x480')
                .outputOptions('-movflags frag_keyframe+empty_moov')
                .output(outputPath)
                .on('start', (command) => {
                    logger.info(command);
                })
                .on('end', () => {
                    fileOptions.tempPath = outputPath;

                    uploadFile(fileOptions);
                    deleteFile(inputPath);
                })
                .on('error', (err) => {
                    deleteFile(inputPath);
                    deleteFile(outputPath);

                    logger.error(err);
                }).exec();
        }


        // if files contains 1 file it will be an object
        // if files contains 2 files it will be an array of object which are files
        if (Array.isArray(files.files)) {
            files.files.forEach((item) => {
                series.push(item);
            });
        } else if (files.attachments) {
            series = files.attachments;
        } else {
            for (let key in files) {
                series.push(files[key]);
            }
        }

        async.each(series, (file, eachCb) => {
            const fileOptions = {
                type            : file.type,
                extension       : file.originalFilename.substr(file.originalFilename.lastIndexOf('.') + 1),
                originalFilename: file.originalFilename,
                tempPath        : file.path,
                name            : createFileName()
            };

            fileOptions.fileNameWithoutExtension = fileOptions.originalFilename.substr(0, fileOptions.originalFilename.length - fileOptions.extension.length - 1);

            async.waterfall([
                // if video file
                (cb) => {
                    if (!_.includes(OTHER_CONSTANTS.VIDEO_CONTENT_TYPES, fileOptions.type)) {
                        return cb(null);
                    }

                    const fileName = fileOptions.name;
                    const thumbnailPath = `/tmp/${fileName}.png`;

                    ffmpeg(fileOptions.tempPath)
                        .screenshot({
                            timestamps: ['1%'],
                            size: '150x?',
                            folder: '/tmp',
                            filename  : `${fileName}.png`
                        })
                        .on('start', (command) => {
                            logger.info(command);
                        })
                        .on('end', () => {
                            const convertedFile = fs.readFileSync(thumbnailPath, 'binary');
                            const base64Image = new Buffer(convertedFile, 'binary').toString('base64');
                            fileOptions.preview = `data:image/png;base64,${base64Image}`;
                            deleteFile(thumbnailPath);

                            // update file options
                            fileOptions.extension = 'mp4';
                            fileOptions.originalFilename = `${fileName}.mp4`;
                            fileOptions.type = 'video/mp4';

                            // async video processing
                            processVideo(fileOptions);

                            cb(null);
                        }).on('error', (err) => {

                        deleteFile(thumbnailPath);
                            err.status = 415;
                            cb(err);
                        });
                },

                // if image file
                (cb) => {
                    if (OTHER_CONSTANTS.IMAGE_CONTENT_TYPES.indexOf(fileOptions.type) === -1) {
                        return cb(null);
                    }

                    const convertOptions = {
                        srcData: fs.readFileSync(fileOptions.tempPath, 'binary'),
                        width  : 150,
                        quality: 1,
                        format : fileOptions.extension
                    };

                    im.resize(convertOptions, (err, stdout) => {
                        if (err) {
                            return cb(err);
                        }

                        const base64Image = new Buffer(stdout, 'binary').toString('base64');
                        fileOptions.preview = `data:${fileOptions.type};base64,${base64Image}`;

                        uploadFile(fileOptions);

                        cb(null);
                    });
                },

                // if pdf type
                (cb) => {
                    if (!_.includes(OTHER_CONSTANTS.OTHER_FORMATS, fileOptions.type)) {
                        return cb(null);
                    }

                    const inputFileName = `${fileOptions.tempPath}[0]`;
                    const outputFile = `/tmp/${fileOptions.name}.png`;

                    im.convert([inputFileName, '-resize', '150x150', outputFile], (err, stdout) => {
                        if (err) {
                            return cb(err);
                        }

                        const convertedFile = fs.readFileSync(outputFile, 'binary');
                        const base64Image = new Buffer(convertedFile, 'binary').toString('base64');
                        fileOptions.preview = `data:image/png;base64,${base64Image}`;

                        uploadFile(fileOptions);

                        cb(null);
                    });
                },

                // if other type
                (cb) => {
                // ToDo: check is file type is valid (doc|docx|oxt|odp|ods|xls|xlsx|pptx|ppt)
                    if (_.includes(NEED_PROCESSING_TYPES, fileOptions.type)) {
                        return cb(null);
                    }

                    uploadFile(fileOptions);

                    cb(null);
                },

                (cb) => {
                    const saveData = {
                        name: `${fileOptions.name}.${fileOptions.extension}`,
                        originalName: fileOptions.originalFilename,
                        extension: fileOptions.extension,
                        contentType: fileOptions.type,
                        createdBy: {
                            user: userId
                        },
                        preview: fileOptions.preview
                    };

                    FileModel.create(saveData, (err, model) => {
                        if (err) {
                            return cb(err);
                        }

                        filesId.push(model.get('_id'));
                        cb(null);
                    });
                }
            ], eachCb);

        }, (err) => {
            if (err) {
                return callback(err);
            }

            callback(null, filesId);
        });
    };

    this.uploadFileFromBase64 = function(userId, base64, folder, callback) {
        let error;

        if (!userId || !base64 || !folder) {
            error = new Error('Not enough params');
            error.status = 400;

            return callback(error);
        }

        const name = createFileName();

        function uploadFromBase64(cb) {
            fileUploader.uploadFromBase64(base64, `${folder}-${name}`, function (err, imageNameWithExt) {
                if (err) {
                    return cb(err);
                }

                cb(null, imageNameWithExt);
            });
        }
        function saveFileToDB(imageName, cb) {
            const saveData = {
                name        : imageName,
                originalName: imageName.split('.')[0],
                extension   : imageName.split('.')[1],
                createdBy   : {
                    user: userId
                }
            };

            new FileModel(saveData).save(function (err, model) {
                if (err) {
                    return cb(err);
                }

                cb(null, model.id);
            });
        }

        async.waterfall([
            uploadFromBase64,
            saveFileToDB
        ], function(err, result) {
            if (err) {
                return callback(err);
            }

            callback(null, result);
        })
    };
};