const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PersonnelModel = require('./../../../../types/personnel/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const applyAnalyzeBy = require('./../components/analyzeBy/index');
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
        const analyzeByParam = query.analyzeBy;
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
                    rating: 1,
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
                rating: '$evaluations.rating',
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

        applyAnalyzeBy(pipeline, analyzeByParam);

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

        let response = result[0];

        if (response) {
            response = {
                barChart: {
                    labels: response.labels,
                    datasets: response.datasets,
                },
            };
        } else {
            response = {
                barChart: {
                    labels: [],
                    datasets: [],
                },
            };
        }

        res.status(200).send(response);
    });
};
