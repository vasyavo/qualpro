const async = require('async');
const contentTypes = require('./../src/public/js/constants/contentType');
const logger = require('./../src/utils/logger');
const autoload = require('./../src/stories/preview/autoload');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            autoload.insertDefaults(cb);
        },

        // perform migration
        (cb) => {
            const collectionName = `${contentTypes.PERSONNEL}s`;
            const query = {
                $or: [{
                    imageSrc: { $exists: false },
                }, {
                    imageSrc: { $eq: null },
                }],
            };
            const cursor = db.collection(collectionName).find(query)
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                const previewId = autoload.defaults[contentTypes.PERSONNEL];

                db.collection(collectionName).updateOne({
                    _id: doc._id,
                }, {
                    $set: {
                        imageSrc: previewId,
                    },
                }, queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (err) {
                    logger.error('Personnel pick fails', err);
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

        // perform migration
        (cb) => {
            const collectionName = `${contentTypes.DOMAIN}s`;
            const query = {
                $or: [{
                    imageSrc: { $exists: false },
                }, {
                    imageSrc: { $eq: null },
                }],
            };
            const cursor = db.collection(collectionName).find(query)
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                const previewId = autoload.defaults[contentTypes.DOMAIN];

                db.collection(collectionName).updateOne({
                    _id: doc._id,
                }, {
                    $set: {
                        imageSrc: previewId,
                    },
                }, queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (err) {
                    logger.error('Domain pick fails', err);
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

        // perform migration
        (cb) => {
            const collectionName = `${contentTypes.OUTLET}s`;
            const query = {
                $or: [{
                    imageSrc: { $exists: false },
                }, {
                    imageSrc: { $eq: null },
                }],
            };
            const cursor = db.collection(collectionName).find(query)
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                const previewId = autoload.defaults[contentTypes.OUTLET];

                db.collection(collectionName).updateOne({
                    _id: doc._id,
                }, {
                    $set: {
                        imageSrc: previewId,
                    },
                }, queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (err) {
                    logger.error('Outlet pick fails', err);
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

        // perform migration
        (cb) => {
            const collectionName = `${contentTypes.RETAILSEGMENT}s`;
            const query = {
                $or: [{
                    imageSrc: { $exists: false },
                }, {
                    imageSrc: { $eq: null },
                }],
            };
            const cursor = db.collection(collectionName).find(query)
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                const previewId = autoload.defaults[contentTypes.RETAILSEGMENT];

                db.collection(collectionName).updateOne({
                    _id: doc._id,
                }, {
                    $set: {
                        imageSrc: previewId,
                    },
                }, queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (err) {
                    logger.error('Retail Segment pick fails', err);
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

        // perform migration
        (cb) => {
            const collectionName = `${contentTypes.BRAND}s`;
            const query = {
                $or: [{
                    imageSrc: { $exists: false },
                }, {
                    imageSrc: { $eq: null },
                }],
            };
            const cursor = db.collection(collectionName).find(query)
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                const previewId = autoload.defaults[contentTypes.BRAND];

                db.collection(collectionName).updateOne({
                    _id: doc._id,
                }, {
                    $set: {
                        imageSrc: previewId,
                    },
                }, queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (err) {
                    logger.error('Brand pick fails', err);
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

        // perform migration
        (cb) => {
            const collectionName = `${contentTypes.BRANCH}es`;
            const query = {
                $or: [{
                    imageSrc: { $exists: false },
                }, {
                    imageSrc: { $eq: null },
                }],
            };
            const cursor = db.collection(collectionName).find(query)
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                const previewId = autoload.defaults[contentTypes.BRANCH];

                db.collection(collectionName).updateOne({
                    _id: doc._id,
                }, {
                    $set: {
                        imageSrc: previewId,
                    },
                }, queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (err) {
                    logger.error('Branch pick fails', err);
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

        (cb) => {
            autoload.insertDefaults(cb);
        },

        // perform rollback
        (cb) => {
            const collectionName = `${contentTypes.PERSONNEL}s`;

            db.collection(collectionName).updateOne({
                imageSrc: autoload.defaults[contentTypes.PERSONNEL],
            }, {
                $set: {
                    imageSrc: null,
                },
            }, cb);
        },

        // perform rollback
        (cb) => {
            const collectionName = `${contentTypes.DOMAIN}s`;

            db.collection(collectionName).updateOne({
                imageSrc: autoload.defaults[contentTypes.DOMAIN],
            }, {
                $set: {
                    imageSrc: null,
                },
            }, cb);
        },

        // perform rollback
        (cb) => {
            const collectionName = `${contentTypes.OUTLET}s`;

            db.collection(collectionName).updateOne({
                imageSrc: autoload.defaults[contentTypes.OUTLET],
            }, {
                $set: {
                    imageSrc: null,
                },
            }, cb);
        },

        // perform rollback
        (cb) => {
            const collectionName = `${contentTypes.RETAILSEGMENT}s`;

            db.collection(collectionName).updateOne({
                imageSrc: autoload.defaults[contentTypes.RETAILSEGMENT],
            }, {
                $set: {
                    imageSrc: null,
                },
            }, cb);
        },

        // perform rollback
        (cb) => {
            const collectionName = `${contentTypes.BRAND}s`;

            db.collection(collectionName).updateOne({
                imageSrc: autoload.defaults[contentTypes.BRAND],
            }, {
                $set: {
                    imageSrc: null,
                },
            }, cb);
        },

        // perform rollback
        (cb) => {
            const collectionName = `${contentTypes.BRANCH}es`;

            db.collection(collectionName).updateOne({
                imageSrc: autoload.defaults[contentTypes.BRANCH],
            }, {
                $set: {
                    imageSrc: null,
                },
            }, cb);
        },

    ], next);
};
