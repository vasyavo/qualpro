const async = require('async');
const mongoose = require('mongoose');

require('mongodb');

const ObjectId = mongoose.Types.ObjectId;

exports.up = function(db, next) {
    async.waterfall([
        (cb) => {
            db.collection('newProductLaunches').aggregate([
                {
                    $match: {
                        'brand._id': null,
                    },
                },
                {
                    $group: {
                        _id: null,
                        ids: { $push: '$_id' },
                    },
                },
            ], cb);
        },
        (result, cb) => {
            if (!result || !result[0]) {
                return cb(null);
            }

            const productIds = result[0].ids;

            async.eachLimit(productIds, 10, (productId, cb) => {
                db.collection('newProductLaunches').update(
                    {
                        _id: productId,
                    },
                    {
                        $set: {
                            'brand._id': ObjectId(),
                            'brand.custom': 1,
                        },
                    },
                    {
                        multi: true,
                    }, cb);
            }, cb);
        },
    ], next);
};

exports.down = function(db, next) {
    next();
};
