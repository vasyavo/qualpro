const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ShelfShareModel = require('./../../../../types/shelfShare/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
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
    const query = req.body;
    const timeFilter = query.timeFilter;

    const queryRun = (personnel, callback) => {
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.BRAND, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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

        pipeline.push({
            $match: {
                $or: timeFilter.map(timePeriod => ({
                    $and: [{ 'createdBy.date': { $gt: new Date(timePeriod.from) } }, { 'createdBy.date': { $lt: new Date(timePeriod.to) } }],
                })),
            },
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.CATEGORY], queryFilter, personnel);

        if (queryFilter.brand && queryFilter.brand.length) {
            $generalMatch.$and.push({
                'brands.brand': {
                    $in: queryFilter.brand,
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
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
            $project: {
                _id: 1,
                category: 1,
                brands: 1,
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ['$createdBy.user', 0] },
                            },
                            in: {
                                _id: '$$user._id',
                                position: '$$user.position',
                            },
                        },
                    },
                    date: 1,
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
            $unwind: '$brands',
        });

        if (queryFilter.brand && queryFilter.brand.length) {
            pipeline.push({
                $match: {
                    'brands.brand': {
                        $in: queryFilter.brand,
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $group: {
                    _id: null,
                    brands: {
                        $addToSet: '$brands.brand',
                    },
                    reports: {
                        $addToSet: {
                            brand: '$brands.brand',
                            percent: '$brands.percent',
                            createdAt: '$createdBy.date',
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brands',
                    foreignField: '_id',
                    as: 'brands',
                },
            },
            {
                $addFields: {
                    brands: {
                        $map: {
                            input: '$brands',
                            as: 'brand',
                            in: {
                                _id: '$$brand._id',
                                name: '$$brand.name',
                            },
                        },
                    },
                },
            },
            {
                $sort: {
                    'brands.name.en': 1,
                },
            },
        ]);

        const generateStagesByTimePeriod = (timeFrame) => {
            return [
                {
                    $project: {
                        brands: 1,
                        reports: 1,
                        timeFrame: Object.assign(...[
                            {},
                            ...timeFrame.map(timePeriod => ({
                                [`${timePeriod.from} - ${timePeriod.to}`]: {
                                    $filter: {
                                        input: '$reports',
                                        as: 'report',
                                        cond: {
                                            $and: [
                                                { $gt: ['$$report.createdAt', new Date(timePeriod.from)] },
                                                { $lt: ['$$report.createdAt', new Date(timePeriod.to)] },
                                            ],
                                        },
                                    },
                                },
                            })),
                        ]),
                    },
                },
                {
                    $addFields: {
                        reports: {
                            $map: {
                                input: '$brands',
                                as: 'brand',
                                in: {
                                    reports: {
                                        $filter: {
                                            input: '$reports',
                                            as: 'report',
                                            cond: {
                                                $eq: ['$$report.brand', '$$brand._id'],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        timeFrame: Object.assign(...[
                            {},
                            ...timeFrame.map(timePeriod => ({
                                [`${timePeriod.from} - ${timePeriod.to}`]: {
                                    $map: {
                                        input: '$brands',
                                        as: 'brand',
                                        in: {
                                            reports: {
                                                $filter: {
                                                    input: `$timeFrame.${timePeriod.from} - ${timePeriod.to}`,
                                                    as: 'report',
                                                    cond: {
                                                        $eq: ['$$report.brand', '$$brand._id'],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            })),
                        ]),
                    },
                },
                {
                    $addFields: {
                        reports: {
                            $map: {
                                input: '$reports',
                                as: 'brand',
                                in: {
                                    $let: {
                                        vars: {
                                            percent: {
                                                $avg: '$$brand.reports.percent',
                                            },
                                        },
                                        in: {
                                            $cond: {
                                                if: {
                                                    $ne: ['$$percent', null],
                                                },
                                                then: '$$percent',
                                                else: 0,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        timeFrame: Object.assign(...[
                            {},
                            ...timeFrame.map(timePeriod => ({
                                [`${timePeriod.from} - ${timePeriod.to}`]: {
                                    $map: {
                                        input: `$timeFrame.${timePeriod.from} - ${timePeriod.to}`,
                                        as: 'brand',
                                        in: {
                                            $let: {
                                                vars: {
                                                    percent: {
                                                        $avg: '$$brand.reports.percent',
                                                    },
                                                },
                                                in: {
                                                    $cond: {
                                                        if: {
                                                            $ne: ['$$percent', null],
                                                        },
                                                        then: '$$percent',
                                                        else: 0,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            })),
                        ]),
                    },
                },
            ];
        };

        pipeline.push(...generateStagesByTimePeriod(timeFilter));

        pipeline.push({
            $project: {
                brands: 1,
                reports: 1,
                timeFrame: 1,
            },
        });

        ShelfShareModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([

        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.SHELF_SHARES, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },

    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const resultSet = result[0];

        if (!resultSet) {
            return res.status(200).send({
                barChart: {
                    labels: [],
                    datasets: [],
                },
                pieChart: {
                    labels: [],
                    datasets: [],
                },
            });
        }

        const response = {
            barChart: {
                labels: resultSet.brands,
                datasets: [],
            },
            pieChart: {
                labels: resultSet.brands,
                datasets: [{
                    data: resultSet.reports.map(percent => parseFloat(percent).toFixed(2)),
                }],
            },
        };

        timeFilter.forEach(timePeriod => {
            const dataset = resultSet.timeFrame[`${timePeriod.from} - ${timePeriod.to}`];

            if (dataset) {
                const data = dataset.map(percent => parseFloat(percent).toFixed(2));

                response.barChart.datasets.push({ data });
            }
        });

        res.status(200).send(response);
    });
};
