/*
 * Wednesday, 01 March, 2017
 * Feature "Files"
 * */
const async = require('async');
const mime = require('mime');
const logger = require('./../src/utils/logger');

require('mongodb');


exports.up = function(db, next) {
    async.waterfall([

        (cb) => {
            db.collection('files')
                .find({
                    contentType: null,
                })
                .project({
                    _id: 1,
                    contentType: 1,
                    extension: 1,
                    originalName: 1,
                })
                .toArray(cb);
        },

        (files, cb) => {
            logger.info('Files already existing in database: ', files);

            async.eachLimit(files, 10, (file, eachCb) => {
                const contentType = mime.lookup(file.originalName);
                const extension = mime.extension(contentType);
                const fileId = file._id.toString();

                logger.info('Iteration:', Object.assign({}, file, {
                    _id: fileId,
                    newContentType: contentType,
                    newExtension: extension,
                }));

                if (contentType && extension) {
                    return db.collection('files')
                        .update({
                            _id: file._id,
                        }, {
                            $set: {
                                contentType,
                                extension,
                            },
                        }, eachCb);
                }

                logger.info('Skip:', fileId);

                eachCb(null);
            }, cb);
        },

    ], next);
};

exports.down = function(db, next) {
    next();
};
