const mongoose = require('mongoose');
const async = require('async');
const AccessManager = require('./../../../../helpers/access')();
const PersonnelModel = require('./../../../../types/personnel/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const query = req.body;
        const queryFilter = query.filter || {};
        const filters = [CONTENT_TYPES.POSITION];
        const pipeline = [];

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    position: { $in: queryFilter[CONTENT_TYPES.POSITION] },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                personnels: {
                    $push: {
                        _id: '$_id',
                        name: {
                            en: { $concat: ['$firstName.en', ' ', '$lastName.en'] },
                            ar: { $concat: ['$firstName.ar', ' ', '$lastName.ar'] },
                        },
                    },
                },
                positions: {
                    $push: {
                        _id: '$position',
                        personnelId: '$_id',
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                positions: {
                    $reduce: {
                        input: '$positions',
                        initialValue: [],
                        in: {
                            $filter: {
                                input: { $setUnion: ['$positions._id', []] },
                                as: 'item',
                                cond: {
                                    $ne: ['$$item', null],
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'positions',
                foreignField: '_id',
                as: 'positions',
            },
        });

        pipeline.push({
            $project: {
                personnels: 1,
                positions: {
                    _id: 1,
                    name: 1,
                },
            },
        });

        PersonnelModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.LOCATIONS, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const response = result && result[0] ? result[0] : {
            personnels: [],
            positions: [],
        };

        res.status(200).send(response);
    });
};
