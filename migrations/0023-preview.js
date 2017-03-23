const async = require('async');
const contentTypes = require('./../src/public/js/constants/contentType');
const defaultImageSrc = require('./../src/constants/defaultImageSrc');
const logger = require('./../src/utils/logger');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        // perform personnel migration
        (cb) => {
            const collectionName = `${contentTypes.PERSONNEL}s`;
            const cursor = db.collection(collectionName).find({})
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                // if it default then set null
                if (doc.imageSrc === defaultImageSrc[contentTypes.PERSONNEL]) {
                    return db.collection(collectionName).updateOne({
                        _id: doc._id,
                    }, {
                        $set: {
                            imageSrc: null,
                        },
                    }, queueCb);
                }

                async.waterfall([

                    // create preview
                    (cb) => {
                        db.collection('preview').insertOne({
                            base64: doc.imageSrc,
                            itemId: doc._id,
                            contentType: contentTypes.PERSONNEL,
                        }, cb);
                    },

                    // set preview ID into personnel
                    (result, cb) => {
                        const previewId = result.ops[0]._id;

                        db.collection(collectionName).updateOne({
                            _id: doc._id,
                        }, {
                            $set: {
                                imageSrc: previewId,
                            },
                        }, cb);
                    },

                ], queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Personnel pick fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    return cb();
                }
            };
        },

        // perform domain migration
        (cb) => {
            const collectionName = `${contentTypes.DOMAIN}s`;
            const cursor = db.collection(collectionName).find({})
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                // if it default then set null
                if (doc.imageSrc === defaultImageSrc[contentTypes.DOMAIN]) {
                    return db.collection(collectionName).updateOne({
                        _id: doc._id,
                    }, {
                        $set: {
                            imageSrc: null,
                        },
                    }, queueCb);
                }

                async.waterfall([

                    // create preview
                    (cb) => {
                        db.collection('preview').insertOne({
                            base64: doc.imageSrc,
                            itemId: doc._id,
                            contentType: contentTypes.DOMAIN,
                        }, cb);
                    },

                    // set preview ID into domain
                    (result, cb) => {
                        const previewId = result.ops[0]._id;

                        db.collection(collectionName).updateOne({
                            _id: doc._id,
                        }, {
                            $set: {
                                imageSrc: previewId,
                            },
                        }, cb);
                    },

                ], queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Domain pick fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    return cb();
                }
            };
        },

        // perform outlet migration
        (cb) => {
            const collectionName = `${contentTypes.OUTLET}s`;
            const cursor = db.collection(collectionName).find({})
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                // if it default then set null
                if (doc.imageSrc === defaultImageSrc[contentTypes.OUTLET]) {
                    return db.collection(collectionName).updateOne({
                        _id: doc._id,
                    }, {
                        $set: {
                            imageSrc: null,
                        },
                    }, queueCb);
                }

                async.waterfall([

                    // create preview
                    (cb) => {
                        db.collection('preview').insertOne({
                            base64: doc.imageSrc,
                            itemId: doc._id,
                            contentType: contentTypes.OUTLET,
                        }, cb);
                    },

                    // set preview ID into outlet
                    (result, cb) => {
                        const previewId = result.ops[0]._id;

                        db.collection(collectionName).updateOne({
                            _id: doc._id,
                        }, {
                            $set: {
                                imageSrc: previewId,
                            },
                        }, cb);
                    },

                ], queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Outlet pick fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    return cb();
                }
            };
        },

        // perform retail segment migration
        (cb) => {
            const collectionName = `${contentTypes.RETAILSEGMENT}s`;
            const cursor = db.collection(collectionName).find({})
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                // if it default then set null
                if (doc.imageSrc === defaultImageSrc[contentTypes.RETAILSEGMENT]) {
                    return db.collection(collectionName).updateOne({
                        _id: doc._id,
                    }, {
                        $set: {
                            imageSrc: null,
                        },
                    }, queueCb);
                }

                async.waterfall([

                    // create preview
                    (cb) => {
                        db.collection('preview').insertOne({
                            base64: doc.imageSrc,
                            itemId: doc._id,
                            contentType: contentTypes.RETAILSEGMENT,
                        }, cb);
                    },

                    // set preview ID into retail segment
                    (result, cb) => {
                        const previewId = result.ops[0]._id;

                        db.collection(collectionName).updateOne({
                            _id: doc._id,
                        }, {
                            $set: {
                                imageSrc: previewId,
                            },
                        }, cb);
                    },

                ], queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Retail Segment pick fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    return cb();
                }
            };
        },

        // perform branch migration
        (cb) => {
            const collectionName = `${contentTypes.BRANCH}es`;
            const cursor = db.collection(collectionName).find({})
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                // if it default then set null
                if (doc.imageSrc === defaultImageSrc[contentTypes.BRANCH]) {
                    return db.collection(collectionName).updateOne({
                        _id: doc._id,
                    }, {
                        $set: {
                            imageSrc: null,
                        },
                    }, queueCb);
                }

                async.waterfall([

                    // create preview
                    (cb) => {
                        db.collection('preview').insertOne({
                            base64: doc.imageSrc,
                            itemId: doc._id,
                            contentType: contentTypes.BRANCH,
                        }, cb);
                    },

                    // set preview ID into branch
                    (result, cb) => {
                        const previewId = result.ops[0]._id;

                        db.collection(collectionName).updateOne({
                            _id: doc._id,
                        }, {
                            $set: {
                                imageSrc: previewId,
                            },
                        }, cb);
                    },

                ], queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Branch pick fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    return cb();
                }
            };
        },

        // perform brand migration
        (cb) => {
            const collectionName = `${contentTypes.BRAND}s`;
            const cursor = db.collection(collectionName).find({})
                .project({
                    _id: 1,
                    imageSrc: 1,
                });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                // if it default then set null
                if (doc.imageSrc === defaultImageSrc[contentTypes.BRAND]) {
                    return db.collection(collectionName).updateOne({
                        _id: doc._id,
                    }, {
                        $set: {
                            imageSrc: null,
                        },
                    }, queueCb);
                }

                async.waterfall([

                    // create preview
                    (cb) => {
                        db.collection('preview').insertOne({
                            base64: doc.imageSrc,
                            itemId: doc._id,
                            contentType: contentTypes.BRAND,
                        }, cb);
                    },

                    // set preview ID into brand
                    (result, cb) => {
                        const previewId = result.ops[0]._id;

                        db.collection(collectionName).updateOne({
                            _id: doc._id,
                        }, {
                            $set: {
                                imageSrc: previewId,
                            },
                        }, cb);
                    },

                ], queueCb);
            }, Infinity);

            cursor.each((err, doc) => {
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Brand pick fails', err);
                }
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

        // perform personnel rollback
        (cb) => {
            const collectionName = `${contentTypes.PERSONNEL}s`;
            // read in stream personnel preview
            const cursor = db.collection('preview').find({
                contentType: contentTypes.PERSONNEL,
            });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                async.series([

                    // put base64 back to personnel
                    (cb) => {
                        db.collection(collectionName).updateOne({
                            _id: doc.itemId,
                        }, {
                            $set: {
                                imageSrc: doc.base64,
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
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Personnel restore fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    // put default base64 back
                    return db.collection(collectionName).updateMany({
                        imageSrc: null,
                    }, {
                        $set: {
                            imageSrc: defaultImageSrc[contentTypes.PERSONNEL],
                        },
                    }, cb);
                }
            };
        },

        // perform domain rollback
        (cb) => {
            const collectionName = `${contentTypes.DOMAIN}s`;
            // read in stream domain preview
            const cursor = db.collection('preview').find({
                contentType: contentTypes.DOMAIN,
            });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                async.series([

                    // put base64 back to domain
                    (cb) => {
                        db.collection(collectionName).updateOne({
                            _id: doc.itemId,
                        }, {
                            $set: {
                                imageSrc: doc.base64,
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
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Domain restore fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    // put default base64 back
                    return db.collection(collectionName).updateMany({
                        imageSrc: null,
                    }, {
                        $set: {
                            imageSrc: defaultImageSrc[contentTypes.DOMAIN],
                        },
                    }, cb);
                }
            };
        },

        // perform outlet rollback
        (cb) => {
            const collectionName = `${contentTypes.OUTLET}s`;
            // read in stream outlet preview
            const cursor = db.collection('preview').find({
                contentType: contentTypes.OUTLET,
            });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                async.series([

                    // put base64 back to outlet
                    (cb) => {
                        db.collection(collectionName).updateOne({
                            _id: doc.itemId,
                        }, {
                            $set: {
                                imageSrc: doc.base64,
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
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Outlet restore fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    // put default base64 back
                    return db.collection(collectionName).updateMany({
                        imageSrc: null,
                    }, {
                        $set: {
                            imageSrc: defaultImageSrc[contentTypes.OUTLET],
                        },
                    }, cb);
                }
            };
        },

        // perform retail segment rollback
        (cb) => {
            const collectionName = `${contentTypes.RETAILSEGMENT}s`;
            // read in stream retail segment preview
            const cursor = db.collection('preview').find({
                contentType: contentTypes.RETAILSEGMENT,
            });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                async.series([

                    // put base64 back to retail segment
                    (cb) => {
                        db.collection(collectionName).updateOne({
                            _id: doc.itemId,
                        }, {
                            $set: {
                                imageSrc: doc.base64,
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
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Retail Segment restore fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    // put default base64 back
                    return db.collection(collectionName).updateMany({
                        imageSrc: null,
                    }, {
                        $set: {
                            imageSrc: defaultImageSrc[contentTypes.RETAILSEGMENT],
                        },
                    }, cb);
                }
            };
        },

        // perform branch rollback
        (cb) => {
            const collectionName = `${contentTypes.BRANCH}es`;
            // read in stream branch preview
            const cursor = db.collection('preview').find({
                contentType: contentTypes.BRANCH,
            });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                async.series([

                    // put base64 back to branch
                    (cb) => {
                        db.collection(collectionName).updateOne({
                            _id: doc.itemId,
                        }, {
                            $set: {
                                imageSrc: doc.base64,
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
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Branch restore fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    // put default base64 back
                    return db.collection(collectionName).updateMany({
                        imageSrc: null,
                    }, {
                        $set: {
                            imageSrc: defaultImageSrc[contentTypes.BRANCH],
                        },
                    }, cb);
                }
            };
        },

        // perform brand rollback
        (cb) => {
            const collectionName = `${contentTypes.BRAND}s`;
            // read in stream brand preview
            const cursor = db.collection('preview').find({
                contentType: contentTypes.BRAND,
            });

            const queue = async.queue((doc, queueCb) => {
                if (!doc) {
                    cursor.close();

                    return queueCb();
                }

                async.series([

                    // put base64 back to brand
                    (cb) => {
                        db.collection(collectionName).updateOne({
                            _id: doc.itemId,
                        }, {
                            $set: {
                                imageSrc: doc.base64,
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
                if (doc) {
                    return queue.push(doc);
                }

                if (err) {
                    logger.error('Brand restore fails', err);
                }
            });

            queue.drain = () => {
                if (cursor.isClosed()) {
                    // put default base64 back
                    return db.collection(collectionName).updateMany({
                        imageSrc: null,
                    }, {
                        $set: {
                            imageSrc: defaultImageSrc[contentTypes.BRAND],
                        },
                    }, cb);
                }
            };
        },

    ], next);
};
