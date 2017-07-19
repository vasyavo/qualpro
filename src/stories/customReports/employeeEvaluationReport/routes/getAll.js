const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PersonnelModel = require('./../../../../types/personnel/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const CONSTANTS = require('./../../../../constants/mainConstants');
const locationFiler = require('./../../utils/locationFilter');
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
        const query = req.body;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION, 'publisher',
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

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    _id: {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    position: {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        locationFiler(pipeline, personnel, queryFilter);

        pipeline.push({
            $lookup: {
                from: 'monthlies',
                localField: '_id',
                foreignField: 'personnel',
                as: 'evaluations',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                name: {
                    en: {
                        $concat: ['$firstName.en', ' ', '$lastName.en'],
                    },
                    ar: {
                        $concat: ['$firstName.ar', ' ', '$lastName.ar'],
                    },
                },
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: '$branch.retailSegment',
                outlet: '$branch.outlet',
                branch: {
                    _id: 1,
                    name: 1,
                    retailSegment: 1,
                    outlet: 1,
                    subRegion: 1,
                },
                personnel: 1,
                position: 1,
                evaluations: {
                    _id: 1,
                    rating: 1,
                    target: 1,
                    achiev: 1,
                    age: 1,
                    createdBy: 1,
                },
            },
        });

        pipeline.push({
            $unwind: '$evaluations',
        });

        const $timeMatch = {};
        $timeMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$or.push({
                    $and: [
                        {
                            'evaluations.createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'evaluations.createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
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
            $addFields: {
                publisher: '$evaluations.createdBy.user',
                rating: '$evaluations.rating',
                target: '$evaluations.target',
                achiev: '$evaluations.achiev',
                age: '$evaluations.age',
            },
        });

        if (queryFilter.publisher && queryFilter.publisher.length) {
            pipeline.push({
                $match: {
                    publisher: {
                        $in: queryFilter.publisher,
                    },
                },
            });
        }

        if (queryFilter.rate && queryFilter.rate.length) {
            pipeline.push({
                $match: {
                    rating: {
                        $gte: queryFilter.rate,
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    retailSegment: {
                        $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    outlet: {
                        $in: queryFilter[CONTENT_TYPES.OUTLET],
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: '$_id',
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                branch: { $first: '$branch' },
                location: { $first: '$location' },
                name: { $first: '$name' },
                position: { $first: '$position' },
                target: { $sum: '$target' },
                achiev: { $sum: '$achiev' },
                percentage: { $sum: '$age' },
                avgRating: { $avg: '$rating' },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeline.push({
            $addFields: {
                location: {
                    en: {
                        $concat: [
                            {
                                $reduce: {
                                    input: { $setDifference: ['$country', [{ $arrayElemAt: ['$country', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                country: { $arrayElemAt: ['$country', 0] },
                                            },
                                            in: '$$country.name.en',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$region', [{ $arrayElemAt: ['$region', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                region: { $arrayElemAt: ['$region', 0] },
                                            },
                                            in: '$$region.name.en',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$subRegion', [{ $arrayElemAt: ['$subRegion', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                subRegion: { $arrayElemAt: ['$subRegion', 0] },
                                            },
                                            in: '$$subRegion.name.en',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$retailSegment', [{ $arrayElemAt: ['$retailSegment', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                                            },
                                            in: '$$retailSegment.name.en',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$outlet', [{ $arrayElemAt: ['$outlet', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                outlet: { $arrayElemAt: ['$outlet', 0] },
                                            },
                                            in: '$$outlet.name.en',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$branch', [{ $arrayElemAt: ['$branch', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                branch: { $arrayElemAt: ['$branch', 0] },
                                            },
                                            in: '$$branch.name.en',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.en'],
                                    },
                                },
                            },
                        ],
                    },
                    ar: {
                        $concat: [
                            {
                                $reduce: {
                                    input: { $setDifference: ['$country', [{ $arrayElemAt: ['$country', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                country: { $arrayElemAt: ['$country', 0] },
                                            },
                                            in: '$$country.name.ar',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$region', [{ $arrayElemAt: ['$region', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                region: { $arrayElemAt: ['$region', 0] },
                                            },
                                            in: '$$region.name.ar',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$subRegion', [{ $arrayElemAt: ['$subRegion', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                subRegion: { $arrayElemAt: ['$subRegion', 0] },
                                            },
                                            in: '$$subRegion.name.ar',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$retailSegment', [{ $arrayElemAt: ['$retailSegment', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                                            },
                                            in: '$$retailSegment.name.ar',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$outlet', [{ $arrayElemAt: ['$outlet', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                outlet: { $arrayElemAt: ['$outlet', 0] },
                                            },
                                            in: '$$outlet.name.ar',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                    },
                                },
                            },
                            ' -> ',
                            {
                                $reduce: {
                                    input: { $setDifference: ['$branch', [{ $arrayElemAt: ['$branch', 0] }]] },
                                    initialValue: {
                                        $let: {
                                            vars: {
                                                branch: { $arrayElemAt: ['$branch', 0] },
                                            },
                                            in: '$$branch.name.ar',
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', '$$this.name.ar'],
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
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
            $project: {
                total: 1,
                _id: '$setItems._id',
                location: '$setItems.location',
                name: '$setItems.name',
                position: '$setItems.position',
                target: '$setItems.target',
                achiev: '$setItems.achiev',
                percentage: '$setItems.percentage',
                avgRating: '$setItems.avgRating',
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: {
                    $push: '$$ROOT',
                },
            },
        });

        PersonnelModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.PERSONNEL, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const response = result.length ?
            result[0] : { data: [], total: 0 };

        res.status(200).send(response);
    });
};
