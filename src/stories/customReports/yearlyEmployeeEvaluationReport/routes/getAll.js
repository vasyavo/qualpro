const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PersonnelModel = require('./../../../../types/personnel/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const CONSTANTS = require('./../../../../constants/mainConstants');
const OTHER_CONSTANTS = require('./../../../../public/js/constants/otherConstants');
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
                from: 'biYearlies',
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
                    personalSkills: 1,
                    sellingSkills: 1,
                    reporting: 1,
                    planningAndOrganizationSkills: 1,
                    overallPerformance: 1,
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
                overallPerformance: '$evaluations.overallPerformance',
                skillsRate: {
                    $divide: [
                        {
                            $add: ['$evaluations.personalSkills.result', '$evaluations.sellingSkills.result', '$evaluations.reporting.result', '$evaluations.planningAndOrganizationSkills.result'],
                        },
                        4,
                    ],
                },
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

        if (queryFilter.overallPerformance && queryFilter.overallPerformance.length) {
            pipeline.push({
                $match: {
                    overallPerformance: {
                        $in: queryFilter.overallPerformance,
                    },
                },
            });
        }

        if (queryFilter.skillsRate && queryFilter.skillsRate.length) {
            pipeline.push({
                $match: {
                    skillsRate: {
                        $gte: queryFilter.skillsRate,
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
                publisher: { $first: '$publisher' },
                skillsRate: { $avg: '$skillsRate' },
                overallPerformance: { $last: '$overallPerformance' },
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
            $lookup: {
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'publisher',
                foreignField: '_id',
                as: 'publisher',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                position: {
                    $let: {
                        vars: {
                            position: { $arrayElemAt: ['$position', 0] },
                        },
                        in: {
                            _id: '$$position._id',
                            name: '$$position.name',
                        },
                    },
                },
                publisher: {
                    $let: {
                        vars: {
                            publisher: { $arrayElemAt: ['$publisher', 0] },
                        },
                        in: {
                            _id: '$$publisher._id',
                            name: {
                                en: {
                                    $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'],
                                },
                                ar: {
                                    $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'],
                                },
                            },
                        },
                    },
                },
                skillsRate: 1,
                overallPerformance: 1,
                country: {
                    _id: 1,
                    name: 1,
                },
                region: {
                    _id: 1,
                    name: 1,
                },
                subRegion: {
                    _id: 1,
                    name: 1,
                },
                retailSegment: {
                    _id: 1,
                    name: 1,
                },
                outlet: {
                    _id: 1,
                    name: 1,
                },
                branch: {
                    _id: 1,
                    name: 1,
                },
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
                                            in: {
                                                $ifNull: ['$$country.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$region.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$subRegion.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$retailSegment.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$outlet.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$branch.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$country.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$region.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$subRegion.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$retailSegment.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$outlet.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                                            in: {
                                                $ifNull: ['$$branch.name.en', 'null'],
                                            },
                                        },
                                    },
                                    in: {
                                        $concat: ['$$value', ', ', { $ifNull: ['$$this.name.en', 'null'] }],
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
                country: '$setItems.country',
                region: '$setItems.region',
                subRegion: '$setItems.subRegion',
                retailSegment: '$setItems.retailSegment',
                outlet: '$setItems.outlet',
                branch: '$setItems.branch',
                location: '$setItems.location',
                name: '$setItems.name',
                position: '$setItems.position',
                publisher: '$setItems.publisher',
                skillsRate: '$setItems.skillsRate',
                overallPerformance: '$setItems.overallPerformance',
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

        response.data.forEach((item) => {
            item.overallPerformance = OTHER_CONSTANTS.RATING_BIYEARLY.find((rating) => rating._id === item.overallPerformance).name;
        });

        res.status(200).send(response);
    });
};
