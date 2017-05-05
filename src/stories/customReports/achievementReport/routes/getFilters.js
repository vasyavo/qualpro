const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const AchievementFormModel = require('./../../../../types/achievementForm/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const query = req.query;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];
        const pipeline = [];

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: _.union(queryFilter[CONTENT_TYPES.PERSONNEL], personnel._id),
                },
            });
        }

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeline.push({
            $addFields: {
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ['$createdBy.user', 0] },
                            },
                            in: {
                                _id: '$$user._id',
                                name: {
                                    en: { $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] },
                                    ar: { $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] },
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    date: 'createdBy.date',
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'createdBy.user.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                countries: { $addToSet: '$country' },
                regions: { $addToSet: '$region' },
                subRegions: { $addToSet: '$subRegion' },
                retailSegments: { $addToSet: '$retailSegment' },
                outlets: { $addToSet: '$outlet' },
                branches: { $addToSet: '$branch' },
                personnels: { $addToSet: '$createdBy.user' },
                positions: { $addToSet: '$createdBy.user.position' },
            },
        });

        pipeline.push({
            $project: {
                countries: {
                    $filter: {
                        input: '$countries',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                regions: {
                    $filter: {
                        input: '$regions',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                subRegions: {
                    $filter: {
                        input: '$subRegions',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                retailSegments: {
                    $filter: {
                        input: '$retailSegments',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                outlets: {
                    $filter: {
                        input: '$outlets',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                branches: {
                    $filter: {
                        input: '$branches',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                personnels: {
                    $filter: {
                        input: '$personnels',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                positions: {
                    $filter: {
                        input: '$positions',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'countries',
                foreignField: '_id',
                as: 'countries',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'regions',
                foreignField: '_id',
                as: 'regions',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegions',
                foreignField: '_id',
                as: 'subRegions',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegments',
                foreignField: '_id',
                as: 'retailSegments',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlets',
                foreignField: '_id',
                as: 'outlets',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branches',
                foreignField: '_id',
                as: 'branches',
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
                countries: {
                    _id: 1,
                    name: 1,
                },
                regions: {
                    _id: 1,
                    name: 1,
                },
                subRegions: {
                    _id: 1,
                    name: 1,
                },
                retailSegments: {
                    _id: 1,
                    name: 1,
                },
                outlets: {
                    _id: 1,
                    name: 1,
                },
                branches: {
                    _id: 1,
                    name: 1,
                },
                positions: {
                    _id: 1,
                    name: 1,
                },
                personnels: 1,
            },
        });

        AchievementFormModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.ACHIEVEMENT_FORM, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(result[0]);
    });
};
