const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    let taskIds = [];
    let needRemoveIds = [];

    async.waterfall([
        (cb) => {
            db.collection('comments').aggregate([
                {
                    $group: {
                        _id: '$taskId',
                        items: { $addToSet: '$_id' },
                    },
                },
                {
                    $addFields: {
                        sizeItems: {
                            $size: '$items',
                        },
                    },
                },
                {
                    $match: {
                        sizeItems: { $gt: 70 },
                    },
                },
                {
                    $group: {
                        _id: null,
                        taskIds: { $addToSet: '$_id' },
                        needRemoveIds: { $addToSet: '$items' },
                    },
                },
                {
                    $project: {
                        taskIds: 1,
                        needRemoveIds: {
                            $reduce: {
                                input: '$needRemoveIds',
                                initialValue: [],
                                in: { $setUnion: ['$$value', '$$this'] },
                            },
                        },
                    },
                },
            ], cb);
        },
        (result, cb) => {
            if (result && result[0]) {
                needRemoveIds = result[0].needRemoveIds;
                taskIds = result[0].taskIds;
                db.collection('comments').remove({ _id: { $in: needRemoveIds } }, cb);
            } else {
                next();
            }
        },
        (result, cb) => {
            db.collection('objectives').update(
                {
                    _id: { $in: taskIds },
                },
                {
                    $set: {
                        comments: [],
                    },
                },
                {
                    multi: true,
                }, cb);
        },
    ], next);
};

exports.down = function(db, next) {
    next();
};
