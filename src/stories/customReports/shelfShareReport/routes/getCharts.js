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

    const queryRun = (personnel, callback) => {
        const query = req.query;
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.BRAND, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];
        const pipeline = [];
        const facetAggregation = { $facet: {} };

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        const getPipeline = (timeFrameStage) => {
            const pipeline = [];

            filters.forEach((filterName) => {
                if (queryFilter[filterName] && queryFilter[filterName][0]) {
                    queryFilter[filterName] = queryFilter[filterName].map((item) => {
                        return ObjectId(item);
                    });
                }
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

            pipeline.push(timeFrameStage);

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

        pipeline.push({
            $lookup: {
                from: 'brands',
                localField: 'brands.brand',
                foreignField: '_id',
                as: 'brand',
            },
        });

            pipeline.push({
                $project: {
                    _id: 1,
                    brands: {
                        _id: '$brands.brand',
                        percent: 1,
                        name: {
                            $let: {
                                vars: {
                                    brand: { $arrayElemAt: ['$brand', 0] },
                                },
                                in: '$$brand.name',
                            },
                        },
                    },
                },
            });

            pipeline.push({
                $group: {
                    _id: '$brands._id',
                    percent: { $avg: '$brands.percent' },
                    name: { $first: '$brands.name' },
                },
            });

            pipeline.push({
                $group: {
                    _id: null,
                    data: {
                        $addToSet: '$percent',
                    },
                    labels: { $addToSet: '$name' },
                },
            });

            pipeline.push({
                $project: {
                    barChart: {
                        data: '$data',
                        labels: '$labels',
                    },
                },
            });

            return pipeline;
        };

        timeFilter.forEach((timeFrame) => {
            const fromToTimeFrame = `${timeFrame.from} - ${timeFrame.to}`;
            const match = {
                $match: {
                    $and: [
                        {
                            'createdBy.date': { $gt: moment(timeFrame.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'createdBy.date': { $lt: moment(timeFrame.to, 'MM/DD/YYYY')._d },
                        },
                    ],
                },
            };
            facetAggregation.$facet[fromToTimeFrame] = getPipeline(match);
        });

        const $timeMatch = { $match: {} };

        $timeMatch.$match.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$match.$or.push({
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

        if ($timeMatch.$match.$or) {
            facetAggregation.$facet.timePeriod = getPipeline($timeMatch);
        }

        pipeline.push(facetAggregation);

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

        if (resultSet) {
            const timeFrame = Object.keys(resultSet);

            const response = {
                barChart: {
                    labels: [],
                    datasets: [],
                },
                pieChart: {
                    labels: [],
                    datasets: [],
                },
            };

            timeFrame.forEach((timePeriod) => {
                const chartData = resultSet[timePeriod][0];

                if (resultSet[timePeriod] && chartData) {
                    if (timePeriod === 'timePeriod') {
                        response.pieChart = {
                            labels: chartData.barChart.labels,
                            datasets: [{
                                data: chartData.barChart.data.map(percent => parseFloat(percent).toFixed(2)),
                            }],
                        };
                    } else {
                        response.barChart.datasets.push({
                            data: chartData.barChart.data.map(percent => parseFloat(percent).toFixed(2)),
                        });
                        response.barChart.labels = chartData.barChart.labels;
                    }
                }
            });

            return res.status(200).send(response);
        }

        res.status(200).send({
            barChart: {
                datasets: [],
            },
            pieChart: {
                datasets: [],
            },
        });
    });
};
