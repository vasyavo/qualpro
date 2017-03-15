const async = require('async');
const _ = require('underscore');

require('mongodb');

exports.up = (db, next) => {
    async.waterfall([
        (waterfallCb) => {
            db.collection('activityLists').aggregate([
                {
                    $match: {
                        module: 35,
                    },
                },
                {
                    $project: {
                        module: 1,
                        branch: {
                            $arrayElemAt: ['$branch', 0],
                        },
                    },
                },
            ], waterfallCb);
        },
        (activities, waterfallCb) => {
            db.collection('branches').aggregate([
                {
                    $match: {
                        _id: {
                            $in: _.pluck(activities, 'branch'),
                        },
                    },
                },
                {
                    $project: {
                        subRegion: 1,
                        retailSegment: 1,
                        outlet: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'domains',
                        localField: 'subRegion',
                        foreignField: '_id',
                        as: 'subRegion',
                    },
                },
                {
                    $project: {
                        subRegion: {
                            $let: {
                                vars: {
                                    item: { $arrayElemAt: ['$subRegion', 0] },
                                },
                                in: '$$item._id',
                            },
                        },
                        region: {
                            $let: {
                                vars: {
                                    item: { $arrayElemAt: ['$subRegion', 0] },
                                },
                                in: '$$item.parent',
                            },
                        },
                        retailSegment: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'domains',
                        localField: 'region',
                        foreignField: '_id',
                        as: 'region',
                    },
                },
                {
                    $project: {
                        region: {
                            $let: {
                                vars: {
                                    item: { $arrayElemAt: ['$region', 0] },
                                },
                                in: '$$item._id',
                            },
                        },
                        country: {
                            $let: {
                                vars: {
                                    item: { $arrayElemAt: ['$region', 0] },
                                },
                                in: '$$item.parent',
                            },
                        },
                        subRegion: 1,
                        retailSegment: 1,
                    },
                },
            ], (err, domains) => {
                waterfallCb(err, activities, domains);
            });
        },
        (activities, domains, waterfallCb) => {
            async.eachLimit(activities, 10, (activity, eachCb) => {
                const location = _.findWhere(domains, (item) => item._id === activity.branch);

                db.collection('activityLists').updateOne({
                    _id: activity._id,
                }, {
                    $set: {
                        country: [location.country],
                        region: [location.region],
                        subRegion: [location.subRegion],
                        retailSegment: [location.retailSegment],
                    },
                }, eachCb);
            }, waterfallCb);
        },
    ], next);
};

exports.down = (db, next) => {
    db.collection('activityLists').update({
        module: 35,
    }, {
        $set: {
            country: [],
            region: [],
            subRegion: [],
            retailSegment: [],
        },
    }, {
        multi: true,
    }, next);
};
