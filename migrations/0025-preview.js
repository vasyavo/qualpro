const async = require('async');
const contentTypes = require('./../src/public/js/constants/contentType');
const logger = require('./../src/utils/logger');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        // perform file migration
        (cb) => {
            const collectionName = `${contentTypes.FILES}`;
            const query = {
                $and: [{
                    preview: { $exists: true },
                }, {
                    preview: { $ne: null },
                }],
            };
            const cursor = db.collection(collectionName).find(query)
                .project({
                    _id: 1,
                    preview: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                async.waterfall([

                    // create preview
                    (cb) => {
                        db.collection('preview').insertOne({
                            base64: doc.preview,
                            itemId: doc._id,
                            contentType: contentTypes.FILES,
                        }, cb);
                    },

                    // set files ID into brand
                    (result, cb) => {
                        const previewId = result.ops[0]._id;

                        db.collection(collectionName).updateOne({
                            _id: doc._id,
                        }, {
                            $set: {
                                preview: previewId,
                            },
                        }, cb);
                    },

                ], queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (err) {
                    logger.error('File pick fails', err);
                    return;
                }

                queue.push(doc);
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    return cb();
                }
            };
        },

    ], next);
};

exports.down = function(db, next) {
    async.series([

        // perform file rollback
        (cb) => {
            const collectionName = `${contentTypes.FILES}`;
            const cursor = db.collection('preview').find({
                contentType: contentTypes.FILES,
            });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                async.series([

                    // put base64 back to file
                    (cb) => {
                        db.collection(collectionName).updateOne({
                            _id: doc.itemId,
                        }, {
                            $set: {
                                preview: doc.base64,
                            },
                        }, cb);
                    },

                    // cleanup from preview
                    (cb) => {
                        db.collection('preview').removeOne({
                            _id: doc._id,
                        }, cb);
                    },

                ], queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (err) {
                    logger.error('File restore fails', err);
                    return;
                }

                queue.push(doc);
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    cb();
                }
            };
        },

    ], next);
};
