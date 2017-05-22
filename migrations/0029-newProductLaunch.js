const async = require('async');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

require('mongodb');

exports.up = function(db, next) {
    async.waterfall([
        (cb) => {
            db.collection('newProductLaunches').aggregate([
                {
                    $match: {
                        'variant._id': null,
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
            const productIds = result[0].ids;

            async.eachLimit(productIds, 10, (productId, cb) => {
                db.collection('newProductLaunches').update(
                    {
                        _id: productId,
                    },
                    {
                        $set: {
                            'variant._id': ObjectId(),
                            'variant.custom': 1,
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
