/*
 * Wednesday, 28 February, 2017
 * */
const async = require('async');
const CONTENT_TYPES = require('../src/public/js/constants/contentType');
const logger = require('../src/utils/logger');

require('mongodb');

exports.up = function(db, next) {
    async.waterfall([
        (cb) => {
            db.collection(CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY).aggregate([
                {
                    $lookup: {
                        from: 'branches',
                        localField: 'branch',
                        foreignField: '_id',
                        as: 'branch',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        outlet: 1,
                        retailSegment: { $arrayElemAt: ['$branch.retailSegment', 0] },
                        subRegion: { $arrayElemAt: ['$branch.subRegion', 0] },
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
                    $addFields: {
                        subRegion: { $arrayElemAt: ['$subRegion._id', 0] },
                        region: { $arrayElemAt: ['$subRegion.parent', 0] },
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
                    $addFields: {
                        region: { $arrayElemAt: ['$region._id', 0] },
                        country: { $arrayElemAt: ['$region.parent', 0] },
                    },
                },
            ], cb);
        },
        (result, cb) => {
            async.eachLimit(result, 10, (item, eachCb) => {
                db.collection(CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY).update({ _id: item._id }, {$set: item}, eachCb);
            }, cb);
        },
    ], next);
};

exports.down = function(db, next) {
    next();
};
