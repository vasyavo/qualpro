const async = require('async');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const im = require('imagemagick');
const mongoose = require('mongoose');
const config = require('./../config');
const OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
const FileModel = require('./../types/file/model');

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
        const series = [];
        const filesId = [];

        if (!userId || !files || !bucket) {
            const error = new Error('Not enough params');

            error.status = 400;
            return callback(error);
        }

        for (let key in files) {
            series.push(files[key]);
        }

        async.eachSeries(series, (file, eachCb) => {
            const fileOptions = {
                type: file.type,
                extension: file.originalFilename.substr(file.originalFilename.lastIndexOf('.') + 1),
                originalFilename: file.originalFilename,
                tempPath: file.path
            };

            fileOptions.fileNameWithoutExtension = fileOptions.originalFilename.substr(0, fileOptions.originalFilename.length - fileOptions.extension.length - 1);

            async.waterfall([
                (cb) => {
                    fs.readFile(fileOptions.tempPath, (err, buffer) => {
                        if (err) {
                            return eachCb(err);
                        }

                        fileOptions.data = buffer;
                        fileOptions.name = createFileName();
                        cb(null);
                    });
                },

                (cb) => {
                    if (!_.includes(OTHER_CONSTANTS.VIDEO_CONTENT_TYPES, fileOptions.type)) {
                        return cb(null);
                    }

                    const videoFormat = 'mp4';
                    const fileName = fileOptions.name;
                    const thumbnailPath = `/tmp/${fileName}.png`;
                    const videoDecPatch = `/tmp/${fileName}dec.mp4`;

                    function deleteFiles(cb) {
                        fs.unlink(thumbnailPath, (err) => {
                            if (err && cb) {
                                cb(err);
                            }
                        });

                        fs.unlink(videoDecPatch, (err) => {
                            if (err && cb) {
                                cb(err);
                            }
                        });
                    }

                    const getFiles = (cb) => {
                        const readFile = (path, parallelCb) => {
                            fs.readFile(path, (err, result) => {
                                if (err) {
                                    return parallelCb(err);
                                }

                                parallelCb(null, result);
                            });
                        };

                        async.parallel({
                            bitmap: async.apply(readFile, thumbnailPath),
                            video: async.apply(readFile, videoDecPatch)
                        }, (err, results) => {
                            if (err) {
                                return cb(err);
                            }

                            deleteFiles(cb);

                            const result = {
                                bitmapBase64: new Buffer(results.bitmap).toString('base64'),
                                videoBuffer: new Buffer(results.video)
                            };

                            cb(null, result);
                        });
                    };

                    ffmpeg(fileOptions.tempPath)
                        .screenshot({
                            timestamps: ['1%'],
                            size: '150x?',
                            folder: '/tmp',
                            filename  : `${fileName}.png`
                        })
                        .videoCodec('libx264')
                        .renice(10)
                        .duration(45)
                        .toFormat(videoFormat)
                        .outputOptions('-s 640x480')
                        .outputOptions('-movflags frag_keyframe+empty_moov')
                        .output(`/tmp/${fileName}dec.mp4`)
                        .on('start', (command) => {
                            console.log(command);
                        })
                        .on('end', () => {
                            getFiles((err, results) => {
                                if (err) {
                                    return cb(err);
                                }

                                fileOptions.extension = videoFormat;
                                fileOptions.originalFilename = `${fileName}.${videoFormat}`;

                                fileOptions.data = results.videoBuffer;
                                fileOptions.type = 'video/mp4';
                                fileOptions.preview = `data:image/png;base64,${results.bitmapBase64}`;

                                cb(null);
                            });

                        })
                        .on('error', (err) => {
                            deleteFiles();

                            err.status = 415;
                            cb(err);
                        });
                },

                (cb) => {
                    if (OTHER_CONSTANTS.IMAGE_CONTENT_TYPES.indexOf(fileOptions.type) === -1) {
                        return cb(null);
                    }

                    const convertOptions = {
                        srcData: fileOptions.data,
                        width  : 150,
                        quality: 1,
                        format : fileOptions.extension
                    };

                    im.resize(convertOptions, (err, stdout) => {
                        if (err) {
                            return cb(err);
                        }

                        const prefix = `data:${fileOptions.type};base64,`;
                        const base64Image = new Buffer(stdout, 'binary').toString('base64');
                        fileOptions.preview = prefix + base64Image;

                        cb(null);
                    });
                },

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

                        const prefix = 'data:image/png;base64,';
                        const convertedFile = fs.readFileSync(outputFile, 'binary');
                        const base64Image = new Buffer(convertedFile, 'binary').toString('base64');
                        fileOptions.preview = prefix + base64Image;
                        cb(null);
                    });
                },

                (cb) => {
                    fileUploader.uploadFile(fileOptions, bucket, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null);
                    });
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

                    const model = new FileModel(saveData);

                    model.set(saveData);
                    model.save((err) => {
                        if (err) {
                            return cb(err);
                        }

                        filesId.push(model.get('_id'));

                        // todo: release execution
                        fs.unlink(fileOptions.tempPath, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });

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
};
