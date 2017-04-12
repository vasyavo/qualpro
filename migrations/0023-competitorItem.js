const async = require('async');
const CompetitorItemCollection = require('./../src/types/competitorItem/collection');
const MigrationMapCollection = require('./../src/stories/migration/collection');

require('mongodb');

exports.up = (db, next) => {
    async.waterfall([

        (cb) => {
            CompetitorItemCollection.aggregate([
                {
                    $group: {
                        _id: {
                            name: { en: '$name.en' },
                            brand: '$brand',
                            variant: '$variant',
                            country: '$country',
                            packing: '$packing',
                            origin: '$origin',
                            archived: '$archived',
                        },
                        items: { $push: '$_id' },
                    },
                },
                {
                    $redact: {
                        $cond: {
                            if: {
                                $gt: [{ $size: '$items' }, 1],
                            },
                            then: '$$KEEP',
                            else: '$$PRUNE',
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'competitorItems',
                        localField: 'items',
                        foreignField: '_id',
                        as: 'items',
                    },
                },
                {
                    $project: {
                        'items._id': 1,
                        'items.createdBy.date': 1,
                    },
                },
                {
                    $sort: {
                        'items.createdBy.date': -1,
                    },
                },
                {
                    $project: {
                        items: '$items._id',
                    },
                },
                {
                    $project: {
                        items: 1,
                        sample: {
                            $arrayElemAt: ['$items', 0],
                        },
                    },
                },
                {
                    $project: {
                        sample: 1,
                        items: {
                            $filter: {
                                input: '$items',
                                as: 'item',
                                cond: {
                                    $ne: ['$$item', '$sample'],
                                },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'competitorItems',
                        localField: 'items',
                        foreignField: '_id',
                        as: 'items',
                    },
                },
                {
                    $unwind: '$items',
                },
                {
                    $project: {
                        _id: 0,
                        headers: {
                            contentType: 'CompetitorItem',
                            actionType: 'Deleted',
                            migration: '0023-competitorItem',
                            redirectTo: '$sample',
                        },
                        payload: '$items',
                    },
                },
            ], cb);
        },

        (result, cb) => {
            async.series([

                (cb) => {
                    MigrationMapCollection.insertMany(result, cb);
                },

                (cb) => {
                    const setId = result.map(event => event.payload._id);

                    CompetitorItemCollection.deleteMany({
                        _id: {
                            $in: setId,
                        },
                    }, cb);
                },

            ], cb);
        },

    ], next);
};

exports.down = (db, next) => {
    async.waterfall([

        (cb) => {
            MigrationMapCollection.find({
                'headers.migration': '0023-competitorItem',
            }, cb);
        },

        (result, cb) => {
            if (!result.length) {
                return cb(null);
            }

            async.series([

                (cb) => {
                    const documents = result.map(event => event.payload);

                    CompetitorItemCollection.insertMany(documents, cb);
                },

                (cb) => {
                    const setId = result.map(event => event._id);

                    MigrationMapCollection.deleteMany({
                        _id: {
                            $in: setId,
                        },
                    }, cb);
                },

            ], cb);
        },

    ], next);
};
