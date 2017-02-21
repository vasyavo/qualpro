/*
 * Wednesday, 21 February, 2017
 * */
const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            async.waterfall([

                (cb) => {
                    db.collection('variants').findOne({
                        'name.en': 'BASBOUSAH',
                    }, cb);
                },

                (variant, cb) => {
                    if (!variant) {
                        return cb(null);
                    }

                    db.collection('items').update({
                        variant: null,
                        'name.en': 'BASBOUSAH MIX',
                    }, {
                        $set: {
                            variant: variant._id,
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

        (cb) => {
            async.waterfall([

                (cb) => {
                    db.collection('variants').findOne({
                        'name.en': 'CAKE',
                    }, cb);
                },

                (variant, cb) => {
                    if (!variant) {
                        return cb(null);
                    }

                    db.collection('items').update({
                        variant: null,
                        'name.en': 'PANCAKE MIX',
                    }, {
                        $set: {
                            variant: variant._id,
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

        (cb) => {
            async.waterfall([

                (cb) => {
                    db.collection('variants').findOne({
                        'name.en': 'DUMPLING',
                    }, cb);
                },

                (variant, cb) => {
                    if (!variant) {
                        return cb(null);
                    }

                    db.collection('items').update({
                        variant: null,
                        'name.en': 'DUMPLING MIX',
                    }, {
                        $set: {
                            variant: variant._id,
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

    ], next);
};

exports.down = function(db, next) {
    async.series([

        (cb) => {
            async.waterfall([

                (cb) => {
                    db.collection('variants').findOne({
                        'name.en': 'BASBOUSAH',
                    }, cb);
                },

                (variant, cb) => {
                    if (!variant) {
                        return cb(null);
                    }

                    db.collection('items').update({
                        variant: variant._id,
                        'name.en': 'BASBOUSAH MIX',
                    }, {
                        $set: {
                            variant: null,
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

        (cb) => {
            async.waterfall([

                (cb) => {
                    db.collection('variants').findOne({
                        'name.en': 'CAKE',
                    }, cb);
                },

                (variant, cb) => {
                    if (!variant) {
                        return cb(null);
                    }

                    db.collection('items').update({
                        variant: variant._id,
                        'name.en': 'PANCAKE MIX',
                    }, {
                        $set: {
                            variant: null,
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

        (cb) => {
            async.waterfall([

                (cb) => {
                    db.collection('variants').findOne({
                        'name.en': 'DUMPLING',
                    }, cb);
                },

                (variant, cb) => {
                    if (!variant) {
                        return cb(null);
                    }

                    db.collection('items').update({
                        variant: variant._id,
                        'name.en': 'DUMPLING MIX',
                    }, {
                        $set: {
                            variant: null,
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

    ], next);
};
