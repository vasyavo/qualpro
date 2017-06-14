const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const DistributionFormModel = require('./../../../../types/distributionForm/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');

const ajv = new Ajv();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const timeFilterSchema = {
        type: 'object',
        properties: {
            timeFrames: {
                type: 'array',
                items: {
                    from: {
                        type: 'string',
                    },
                    to: {
                        type: 'string',
                    },
                    required: ['from', 'to'],
                },
            },
        },
    };

    const queryRun = (personnel, callback) => {
        const query = req.query;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT, CONTENT_TYPES.ITEM,
            CONTENT_TYPES.POSITION, 'executorPosition', CONTENT_TYPES.PERSONNEL,
        ];
        const pipeline = [];

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    branches: { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branches',
                foreignField: '_id',
                as: 'branches',
            },
        });

        pipeline.push({
            $addFields: {
                subRegions: {
                    $map: {
                        input: '$branches',
                        as: 'item',
                        in: '$$item.subRegion',
                    },
                },
                retailSegments: {
                    $map: {
                        input: '$branches',
                        as: 'item',
                        in: '$$item.retailSegment',
                    },
                },
                outlets: {
                    $map: {
                        input: '$branches',
                        as: 'item',
                        in: '$$item.outlet',
                    },
                },
                branches: null,
            },
        });

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    subRegions: { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    retailSegments: { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    outlets: { $in: queryFilter[CONTENT_TYPES.OUTLET] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegions',
                foreignField: '_id',
                as: 'subRegions',
            },
        });

        pipeline.push({
            $addFields: {
                subRegions: {
                    $map: {
                        input: '$subRegions',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            name: '$$item.name',
                        },
                    },
                },
                regions: {
                    $map: {
                        input: '$subRegions',
                        as: 'item',
                        in: '$$item.parent',
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    regions: { $in: queryFilter[CONTENT_TYPES.REGION] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'regions',
                foreignField: '_id',
                as: 'regions',
            },
        });

        pipeline.push({
            $addFields: {
                countries: {
                    $map: {
                        input: '$regions',
                        as: 'item',
                        in: '$$item.parent',
                    },
                },
                regions: {
                    $map: {
                        input: '$regions',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            name: '$$item.name',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    countries: { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
                },
            });
        }

        const $timeMatch = {};
        $timeMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$or.push({
                    $and: [
                        {
                            'createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
                        },
                    ],
                });
                return frame;
            });
        }

        if ($timeMatch.$or.length) {
            pipeline.push({
                $match: $timeMatch,
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
                    date: '$createdBy.date',
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
            $lookup: {
                from: 'objectives',
                localField: 'objective',
                foreignField: '_id',
                as: 'objective',
            },
        });

        pipeline.push({
            $addFields: {
                objective: {
                    $let: {
                        vars: {
                            objective: { $arrayElemAt: ['$objective', 0] },
                        },
                        in: '$$objective._id',
                    },
                },
                executors: {
                    $let: {
                        vars: {
                            objective: { $arrayElemAt: ['$objective', 0] },
                        },
                        in: '$$objective.assignedTo',
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    executors: {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'executors',
                foreignField: '_id',
                as: 'executors',
            },
        });

        pipeline.push({
            $addFields: {
                executors: {
                    $map: {
                        input: '$executors',
                        as: 'user',
                        in: {
                            _id: '$$user._id',
                            name: {
                                en: { $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] },
                                ar: { $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] },
                            },
                        },
                    },
                },
                executorPositions: {
                    $map: {
                        input: '$executors',
                        as: 'item',
                        in: '$$item.position',
                    },
                },
            },
        });

        if (queryFilter.executorPosition && queryFilter.executorPosition.length) {
            pipeline.push({
                $match: {
                    executorPositions: {
                        $in: queryFilter.executorPosition,
                    },
                },
            });
        }

        pipeline.push({
            $unwind: '$items',
        });

        if (queryFilter[CONTENT_TYPES.CATEGORY] && queryFilter[CONTENT_TYPES.CATEGORY].length) {
            pipeline.push({
                $match: {
                    'items.category': {
                        $in: queryFilter[CONTENT_TYPES.CATEGORY],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.VARIANT] && queryFilter[CONTENT_TYPES.VARIANT].length) {
            pipeline.push({
                $match: {
                    'items.variant': {
                        $in: queryFilter[CONTENT_TYPES.VARIANT],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.ITEM] && queryFilter[CONTENT_TYPES.ITEM].length) {
            pipeline.push({
                $match: {
                    'items.item': {
                        $in: queryFilter[CONTENT_TYPES.ITEM],
                    },
                },
            });
        }

        pipeline.push({
            $unwind: '$items.branches',
        });

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    'items.branches.branch': { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                countries: { $push: '$countries' },
                regions: { $push: '$regions' },
                subRegions: { $push: '$subRegions' },
                retailSegments: { $push: '$retailSegments' },
                outlets: { $push: '$outlets' },
                branches: { $addToSet: '$items.branches.branch' },
                categories: { $addToSet: '$items.category' },
                variants: { $addToSet: '$items.variant' },
                items: { $addToSet: '$items.item' },
                positions: { $addToSet: '$createdBy.user.position' },
                executorPositions: { $push: '$executorPositions' },
                personnels: { $push: '$executors' },
            },
        });

        pipeline.push({
            $project: {
                countries: {
                    $reduce: {
                        input: '$countries',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                regions: {
                    $reduce: {
                        input: '$regions',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                subRegions: {
                    $reduce: {
                        input: '$subRegions',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                retailSegments: {
                    $reduce: {
                        input: '$retailSegments',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                outlets: {
                    $reduce: {
                        input: '$outlets',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                branches: 1,
                categories: 1,
                variants: 1,
                items: 1,
                positions: 1,
                executorPositions: {
                    $reduce: {
                        input: '$executorPositions',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
                        },
                    },
                },
                personnels: {
                    $reduce: {
                        input: '$personnels',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$value', []],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$this',
                            },
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
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'variants',
                localField: 'variants',
                foreignField: '_id',
                as: 'variants',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'items',
                localField: 'items',
                foreignField: '_id',
                as: 'items',
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
                from: 'positions',
                localField: 'executorPositions',
                foreignField: '_id',
                as: 'executorPositions',
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
                regions: 1,
                subRegions: 1,
                personnels: 1,
                countries: {
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
                categories: {
                    _id: 1,
                    name: 1,
                },
                variants: {
                    _id: 1,
                    name: 1,
                },
                items: {
                    _id: 1,
                    name: 1,
                },
                positions: {
                    _id: 1,
                    name: 1,
                },
                executorPositions: {
                    _id: 1,
                    name: 1,
                },
            },
        });

        DistributionFormModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVES_AND_TASKS_FORM, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const response = result && result[0] ? result[0] : {
            countries: [],
            regions: [],
            subRegions: [],
            retailSegments: [],
            outlets: [],
            branches: [],
            categories: [],
            variants: [],
            items: [],
            positions: [],
            executorPositions: [],
            personnels: [],
        };

        res.status(200).send(response);
    });
};
