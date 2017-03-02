const async = require('async');
const _ = require('lodash');
const mongoose = require('mongoose');
const PersonnelModel = require('../../../types/personnel/model');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (userId, cb) => {
    async.waterfall([
        (waterfallCb) => {
            const aggregation = PersonnelModel.aggregate([
                {
                    $match: { _id: ObjectId(userId) },
                },
                {
                    $project: {
                        country: 1,
                        region: 1,
                        subRegion: 1,
                        branch: 1,
                        accessRole: 1,
                        beforeAccess: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'accessRoles',
                        localField: 'accessRole',
                        foreignField: '_id',
                        as: 'accessRole',
                    },
                },
                {
                    $project: {
                        country: 1,
                        region: 1,
                        subRegion: 1,
                        branch: 1,
                        beforeAccess: 1,
                        accessRoleLevel: { $arrayElemAt: ['$accessRole.level', 0] },
                    },
                },
            ]);

            aggregation.exec((err, result) => {
                if (err) {
                    return waterfallCb(err);
                }

                if (!result[0]) {
                    const error = new Error();
                    error.message = 'user not found';
                    return waterfallCb(error);
                }

                waterfallCb(null, result[0]);
            });
        },
        (userObject, waterfallCb) => {
            PersonnelModel
                .find({ 'vacation.cover': userObject._id }, { _id: 1 })
                .lean()
                .exec((err, result) => {
                    if (err) {
                        return waterfallCb(err);
                    }

                    userObject.cover = _.map(result, (el) => {
                        return el._id;
                    });

                    waterfallCb(null, userObject);
                });
        },
    ], (err, result) => {
        if (err) {
            return cb(err);
        }

        cb(null, result);
    });
};
