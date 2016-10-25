var Files = function (db) {
    var async = require('async');
    var fs = require('fs');
    var path = require('path');
    var config = require('../config');
    var ffmpeg = require('fluent-ffmpeg');
    var im = require('imagemagick');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var modelAndSchemaName = CONTENT_TYPES.FILES;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);
    var ObjectId = mongoose.Types.ObjectId;
    var amazonS3conf;
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
        Model.find({_id: {$in: array}, 'createdBy.user': userId}, projection, function (err, fileModels) {
            if (err) {
                return callback(err);
            }
            return callback(null, fileModels);
        });
    };

    this.deleteFew = function (array, callback) {
        Model.remove({
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

        Model.findById(id, projection, function (err, fileModel) {
            var error;
            var jsonModel;

            if (err) {
                return next(err);
            }

            if (!fileModel) {
                error = new Error('File model not found');
                error.status = 400;
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

        callback(null);
    };

    this.computeUrl = function (fileName, bucket) {
        return fileUploader.getImageUrl(fileName, bucket);
    };

    this.uploadFile = function (userId, files, bucket, callback) {
        var model;
        var array = [];
        var filesIds = [];
        var error;

        if (!userId || !files || !bucket) {
            error = new Error('Not enough params');
            error.status = 400;

            return callback(error);
        }

        for (var key in files) {
            array = array.concat(files[key]);
        }

        async.eachSeries(array,
            function (file, eachCb) {
                var fileOptions = {
                    type            : file.type,
                    extension       : file.originalFilename.substr(file.originalFilename.lastIndexOf('.') + 1),
                    originalFilename: file.originalFilename,
                    tempPath        : file.path
                };

                fileOptions.fileNameWithoutExtension = fileOptions.originalFilename.substr(0, fileOptions.originalFilename.length - fileOptions.extension.length - 1);

                async.waterfall([
                    function (waterfallCb) {
                        fs.readFile(fileOptions.tempPath, function (err, buffer) {
                            if (err) {
                                return eachCb(err);
                            }

                            fileOptions.data = buffer;
                            fileOptions.name = createFileName();
                            waterfallCb(null);
                        });
                    },

                    function (waterfallCb) {
                        if (OTHER_CONSTANTS.VIDEO_CONTENT_TYPES.indexOf(fileOptions.type) === -1) {
                            return waterfallCb(null);
                        }

                        var videoFormat = 'mp4';
                        var fileName = fileOptions.name;

                        var thumbnailPath = '/tmp/' + fileName + '.png';
                        var videoDecPatch = '/tmp/' + fileName + 'dec.mp4';

                        function deleteFiles(cb) {
                            fs.unlink(thumbnailPath, function (err) {
                                if (err && cb) {
                                    cb(err);
                                }
                            });

                            fs.unlink(videoDecPatch, function (err) {
                                if (err && cb) {
                                    cb(err);
                                }
                            });
                        }

                        function getFiles(cb) {
                            function readFile(path, parCb) {
                                fs.readFile(path, function (err, result) {
                                    if (err) {
                                        return parCb(err);
                                    }

                                    parCb(null, result);
                                });
                            }

                            async.parallel({
                                bitmap: async.apply(readFile, thumbnailPath),
                                video : async.apply(readFile, videoDecPatch)
                            }, function (err, results) {
                                if (err) {
                                    return cb(err);
                                }

                                deleteFiles(cb);

                                var result = {
                                    bitmapBase64: new Buffer(results.bitmap).toString('base64'),
                                    videoBuffer : new Buffer(results.video)
                                };

                                cb(null, result);
                            });
                        }

                        ffmpeg(fileOptions.tempPath)
                            .screenshot({
                                timestamps: ['1%'],
                                size      : '150x?',
                                folder    : '/tmp',
                                filename  : fileName + '.png'
                            })
                            //.size('320x240')
                            .videoCodec('libx264')
                            .renice(10)
                            .duration(45)
                            .toFormat(videoFormat)
                            .outputOptions('-s 640x480')
                            .outputOptions('-movflags frag_keyframe+empty_moov')
                            .output('/tmp/' + fileName + 'dec.mp4')
                            .on('start', function (command) {
                                console.log(command);
                            })
                            .on('end', function () {
                                getFiles(function (err, results) {
                                    if (err) {
                                        return waterfallCb(err);
                                    }

                                    fileOptions.extension = videoFormat;
                                    fileOptions.originalFilename = fileName + '.' + videoFormat;

                                    fileOptions.data = results.videoBuffer;
                                    fileOptions.type = 'video/mp4';
                                    fileOptions.preview = 'data:image/png;base64,' + results.bitmapBase64;

                                    waterfallCb(null);
                                });

                            })
                            .on('error', function (err, stdout, stderr) {
                                deleteFiles();
                                err.status = 415;
                                waterfallCb(err);
                            });
                    },

                    function (waterfallCb) {
                        var convertOptions;

                        if (OTHER_CONSTANTS.IMAGE_CONTENT_TYPES.indexOf(fileOptions.type) === -1) {
                            return waterfallCb(null);
                        }

                        convertOptions = {
                            srcData: fileOptions.data,
                            width  : 150,
                            quality: 1,
                            format : fileOptions.extension
                        };

                        im.resize(convertOptions, function (err, stdout) {
                            var base64Image;
                            var prefix = "data:" + fileOptions.type + ";base64,";

                            if (err) {
                                return waterfallCb(err);
                            }

                            base64Image = new Buffer(stdout, 'binary').toString('base64');
                            fileOptions.preview = prefix + base64Image;
                            waterfallCb(null);
                        });
                    },

                    function (waterfallCb) {
                        var inputFileName;
                        var outputFile;

                        if (OTHER_CONSTANTS.OTHER_FORMATS.indexOf(fileOptions.type) === -1) {
                            return waterfallCb(null);
                        }

                        inputFileName = fileOptions.tempPath  + '[0]';
                        outputFile = '/tmp/' + fileOptions.name + '.png';

                        im.convert([inputFileName, '-resize', '150x150', outputFile],
                            function (err, stdout) {
                                var base64Image;
                                // var prefix = 'data:' + fileOptions.type + ';base64,';
                                var prefix = 'data:image/png;base64,';
                                var convertedFile;

                                if (err) {
                                    return waterfallCb(err);
                                }

                                convertedFile = fs.readFileSync(outputFile, 'binary');
                                base64Image = new Buffer(convertedFile, 'binary').toString('base64');
                                fileOptions.preview = prefix + base64Image;
                                waterfallCb(null);
                            });
                    },

                    function (waterfallCb) {
                        fileUploader.uploadFile(fileOptions, bucket, function (err) {
                            if (err) {
                                return waterfallCb(err);
                            }

                            waterfallCb(null);
                        });
                    },

                    function (waterfallCb) {
                        var saveData = {
                            name        : fileOptions.name + '.' + fileOptions.extension,
                            originalName: fileOptions.originalFilename,
                            extension   : fileOptions.extension,
                            contentType : fileOptions.type,
                            createdBy   : {
                                user: userId
                            },
                            preview     : fileOptions.preview
                        };

                        model = new Model(saveData);
                        model.save(function (err) {
                            if (err) {
                                return waterfallCb(err);
                            }

                            filesIds.push(model.get('_id'));

                            fs.unlink(fileOptions.tempPath, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });

                            waterfallCb(null);
                        });
                    }
                ], function (err) {
                    if (err) {
                        return eachCb(err);
                    }

                    eachCb(null);
                });
            }, function (err) {
                if (err) {
                    return callback(err);
                }

                callback(null, filesIds);
            });
    };
};

module.exports = Files;
