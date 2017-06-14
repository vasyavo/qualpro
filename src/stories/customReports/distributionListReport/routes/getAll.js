const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const DistributionFormModel = require('./../../../../types/distributionForm/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
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
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
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
                subRegions: null,
                retailSegments: null,
                outlets: null,
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
                regions: null,
                countries: {
                    $map: {
                        input: '$regions',
                        as: 'item',
                        in: '$$item.parent',
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
                countries: null,
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
                executors: null,
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
            $sort: {
                'createdBy.date': 1,
            },
        });

        pipeline.push({
            $group: {
                _id: {
                    variant: '$items.variant',
                    branch: '$items.branches.branch',
                },
                indicator: { $last: '$items.branches.indicator' },
                category: { $first: '$items.category' },
                objective: { $first: '$objective' },
            },
        });

        pipeline.push({
            $group: {
                _id: '$_id.variant',
                items: {
                    $push: {
                        branch: '$_id.branch',
                        indicator: '$indicator',
                    },
                },
                category: { $first: '$category' },
                objective: { $first: '$objective' },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                setItems: { $push: '$$ROOT' },
                total: { $sum: 1 },
            },
        });

        pipeline.push({
            $unwind: '$setItems',
        });

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
        });

        pipeline.push({
            $lookup: {
                from: 'variants',
                localField: 'setItems._id',
                foreignField: '_id',
                as: 'variant',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'setItems.category',
                foreignField: '_id',
                as: 'category',
            },
        });

        pipeline.push({
            $project: {
                _id: '$setItems._id',
                total: 1,
                objective: '$setItems.objective',
                items: '$setItems.items',
                branches: '$setItems.items.branch',
                category: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0] },
                        },
                        in: {
                            _id: '$$category._id',
                            name: '$$category.name',
                        },
                    },
                },
                variant: {
                    $let: {
                        vars: {
                            variant: { $arrayElemAt: ['$variant', 0] },
                        },
                        in: {
                            _id: '$$variant._id',
                            name: '$$variant.name',
                        },
                    },
                },
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
            $project: {
                total: 1,
                objective: 1,
                category: 1,
                variant: 1,
                items: {
                    $map: {
                        input: '$items',
                        as: 'item',
                        in: {
                            indicator: '$$item.indicator',
                            branch: {
                                $let: {
                                    vars: {
                                        branchModel: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$branches',
                                                        as: 'branch',
                                                        cond: {
                                                            $eq: ['$$branch._id', '$$item.branch'],
                                                        },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        _id: '$$branchModel._id',
                                        name: '$$branchModel.name',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: {
                    $push: '$$ROOT',
                },
                branches: { $push: '$items.branch' },
            },
        });

        pipeline.push({
            $addFields: {
                branches: {
                    $reduce: {
                        input: '$branches',
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

        const response = result.length ?
            result[0] : { data: [], total: 0, branches: [] };

        res.status(200).send(response);
    });
};
