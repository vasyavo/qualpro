const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PersonnelModel = require('./../../../../types/personnel/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFilter = require('./../../utils/locationFilter');
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

        locationFilter(pipeline, personnel, queryFilter, true);

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

        if (queryFilter.skillsRate) {
            pipeline.push({
                $match: {
                    skillsRate: {
                        $gte: parseInt(queryFilter.skillsRate, 10),
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
                _id: null,
                countries: { $push: '$country' },
                regions: { $push: '$region' },
                subRegions: { $push: '$subRegion' },
                branches: { $push: '$branch' },
                positions: { $addToSet: '$position' },
                retailSegments: { $push: '$retailSegment' },
                outlets: { $push: '$outlet' },
                personnels: {
                    $addToSet: {
                        _id: '$_id',
                        name: '$name',
                    },
                },
                publishers: { $addToSet: '$publisher' },
                skillsRate: { $addToSet: '$skillsRate' },
                overallPerformance: { $addToSet: '$overallPerformance' },
            },
        });

        pipeline.push({
            $project: {
                publishers: 1,
                positions: 1,
                overallPerformance: 1,
                skillsRate: 1,
                personnels: 1,
                countries: {
                    $reduce: {
                        input: '$countries',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: { $eq: ['$$value', []] },
                                then: '$$this',
                                else: { $setUnion: ['$$this', '$$value'] },
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
                                if: { $eq: ['$$value', []] },
                                then: '$$this',
                                else: { $setUnion: ['$$this', '$$value'] },
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
                                if: { $eq: ['$$value', []] },
                                then: '$$this',
                                else: { $setUnion: ['$$this', '$$value'] },
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
                                if: { $eq: ['$$value', []] },
                                then: '$$this',
                                else: { $setUnion: ['$$this', '$$value'] },
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
                                if: { $eq: ['$$value', []] },
                                then: '$$this',
                                else: { $setUnion: ['$$this', '$$value'] },
                            },
                        },
                    },
                },
                branches: {
                    $reduce: {
                        input: '$branches',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: { $eq: ['$$value', []] },
                                then: '$$this',
                                else: { $setUnion: ['$$this', '$$value'] },
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
                from: 'personnels',
                localField: 'publishers',
                foreignField: '_id',
                as: 'publishers',
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
                publishers: {
                    $map: {
                        input: '$publishers',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            name: {
                                en: { $concat: ['$$item.firstName.en', ' ', '$$item.lastName.en'] },
                                ar: { $concat: ['$$item.firstName.ar', ' ', '$$item.lastName.ar'] },
                            },
                        },
                    },
                },
                positions: {
                    _id: 1,
                    name: 1,
                },
                overallPerformance: 1,
                skillsRate: 1,
                personnels: 1,
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

        const response = result && result[0] ? result[0] : {
            publishers: [],
            positions: [],
            overallPerformance: [],
            skillsRate: [],
            personnels: [],
            countries: [],
            regions: [],
            subRegions: [],
            retailSegments: [],
            outlets: [],
            branches: [],
        };

        const overallPerformance = [{
            _id: '1',
            name: {
                en: 'New',
                ar: '',
            },
        }, {
            _id: '2',
            name: {
                en: 'Below Standard',
                ar: '',
            },
        }, {
            _id: '3',
            name: {
                en: 'Standard',
                ar: '',
            },
        }, {
            _id: '4',
            name: {
                en: 'Superior',
                ar: '',
            },
        }, {
            _id: '5',
            name: {
                en: 'Exceptional',
                ar: '',
            },
        }];
        response.overallPerformance = response.overallPerformance.map((item) => {
            return `${item}`;
        });
        response.overallPerformance = overallPerformance.filter((item) => {
            return response.overallPerformance.indexOf(item._id) > -1;
        });

        response.analyzeBy = [
            {
                name: {
                    en: 'Country',
                    ar: '',
                },
                value: 'country',
            },
            {
                name: {
                    en: 'Region',
                    ar: '',
                },
                value: 'region',
            },
            {
                name: {
                    en: 'Sub Region',
                    ar: '',
                },
                value: 'subRegion',
            },
            {
                name: {
                    en: 'Branch',
                    ar: '',
                },
                value: 'branch',
            },
            {
                name: {
                    en: 'Position',
                    ar: '',
                },
                value: 'position',
            },
            {
                name: {
                    en: 'Employee',
                    ar: '',
                },
                value: 'employee',
            },
            {
                name: {
                    en: 'Publisher',
                    ar: '',
                },
                value: 'publisher',
            },
        ];

        res.status(200).send(response);
    });
};
