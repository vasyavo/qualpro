const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const _ = require('lodash');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const ObjectiveModel = require('./../../../../types/objective/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
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
        const queryFilter = query.filter || {};
        const analyzeByParam = query.analyzeBy;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION, 'createdByPersonnel', 'assignedToPersonnel',
        ];
        const pipeline = [];

        pipeline.push({
            $match: {
                archived: false,
            },
        });

        pipeline.push({
            $match: {
                status: { $ne: 'draft' },
            },
        });

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

        pipeline.push({
            $match: {
                context: CONTENT_TYPES.OBJECTIVES,
            },
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, 'status', 'priority', 'objectiveType'], queryFilter, personnel);

        if (queryFilter.formType && queryFilter.formType.length) {
            $generalMatch.$and.push({
                'form.contentType': {
                    $in: queryFilter.formType,
                },
            });
        }

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
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

        if (queryFilter.assignedToPersonnel && queryFilter.assignedToPersonnel.length) {
            pipeline.push({
                $match: {
                    assignedTo: {
                        $in: _.union(queryFilter.assignedToPersonnel, personnel._id),
                    },
                },
            });
        }

        if (queryFilter.createdByPersonnel && queryFilter.createdByPersonnel.length) {
            pipeline.push({
                $match: {
                    'createdBy.user': {
                        $in: queryFilter.createdByPersonnel,
                    },
                },
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

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $addFields: {
                    subRegion: {
                        $let: {
                            vars: {
                                filters: {
                                    subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$subRegion',
                                            as: 'subRegion',
                                            cond: {
                                                $and: [
                                                    { $setIsSubset: [['$$subRegion'], '$$filters.subRegion'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'subRegion',
                                    in: '$$subRegion',
                                },
                            },
                        },
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $addFields: {
                    region: {
                        $let: {
                            vars: {
                                filters: {
                                    region: queryFilter[CONTENT_TYPES.REGION],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$region',
                                            as: 'region',
                                            cond: {
                                                $and: [
                                                    { $setIsSubset: [['$$region'], '$$filters.region'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'region',
                                    in: '$$region',
                                },
                            },
                        },
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    branch: queryFilter[CONTENT_TYPES.BRANCH],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $and: [
                                                    { $setIsSubset: [['$$branch'], '$$filters.branch'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: '$$branch',
                                },
                            },
                        },
                    },
                },
            });
        }

        applyAnalyzeBy(pipeline, analyzeByParam);

        ObjectiveModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, cb);
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
                    datasets: response.datasets.map(dataset => {
                        return {
                            data: dataset.data.map(items => {
                                const thisItem = {};
                                let total = 0;
                                items.forEach(item => {
                                    total += item.count;
                                    thisItem[item.status] = thisItem[item.status] || 0;
                                    thisItem[item.status] += item.count;
                                });
                                thisItem.total = total;
                                return thisItem;
                            }),
                        };
                    }),
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
