const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.waterfall([
        (cb) => {
            db.collection('personnels').findOne({ email: 'qualpro.admin@foxtrapp.com' }, cb);
        },
        (personnel, cb) => {
            db.collection('items').aggregate([
                {
                    $match: {
                        ppt: {
                            $gt: 0,
                        },
                    },
                },
                {
                    $project: {
                        headers: {
                            itemId: '$_id',
                            contentType: 'item',
                            actionType: 'itemChanged',
                            user: personnel._id,
                            date: '$createdBy.date',
                        },
                        payload: '$$ROOT',
                    },
                }
            ], cb);
        },
        (items, cb) => {
            db.collection('itemHistory').insert(items, cb);
        },
    ], next);
};

exports.down = function(db, next) {
    async.waterfall([
        (cb) => {
            db.collection('personnels').findOne({ email: 'qualpro.admin@foxtrapp.com' }, cb);
        },
        (personnel, cb) => {
            db.collection('itemHistory').remove({ 'headers.user': personnel._id }, cb);
        },
    ], next);
};
