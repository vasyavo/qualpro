const async = require('async');
const mongoose = require('mongoose');

require('mongodb');

exports.up = function(db, next) {
    async.waterfall([
        (cb) => {
            db.collection('competitorItems').aggregate([{
                $match: {
                    origin: { $type: 'array' },
                },
            }], cb);
        },
        (result, cb) => {
            async.eachLimit(result, 10, (item, cb) => {
                if (Array.isArray(item.origin[0])) {
                    db.collection('competitorItems').update(
                        {
                            _id: item._id,
                        },
                        {
                            $set: {
                                origin: item.origin[0],
                            },
                        },
                        {
                            multi: true,
                        }, cb);
                } else {
                    cb();
                }
            }, cb);
        },
    ], next);
};

exports.down = function(db, next) {
    next();
};
