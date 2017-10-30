const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const MarketingCampaignModel = require('./../../../../types/marketingCampaign/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const moment = require('moment');
const _ = require('lodash');

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
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, 'displayType',
            'status', 'publisher', CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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
            if (queryFilter[filterName] && queryFilter[filterName][0] && filterName !== 'status') {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

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

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.CATEGORY, 'displayType', 'status'], queryFilter, personnel);

        if (queryFilter.publisher && queryFilter.publisher.length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter.publisher,
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
                status: 1,
                country: 1,
                description: 1,
                dateStart: 1,
                dateEnd: 1,
                publisher: { $arrayElemAt: ['$createdBy.user._id', 0] },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'marketingCampaignItem',
                localField: '_id',
                foreignField: 'brandingAndDisplay',
                as: 'items',
            },
        });

        pipeline.push({
            $unwind: '$items',
        });

        const timeFrames = timeFilter.map((item) => {
            item.from = moment(item.from, 'MM/DD/YYYY')._d;
            item.to = moment(item.to, 'MM/DD/YYYY')._d;

            return item;
        });

        pipeline.push({
            $addFields: {
                timeFrames: {
                    $filter: {
                        input: timeFrames,
                        as: 'timeFrameItem',
                        cond: {
                            $and: [
                                { $gt: ['$items.createdBy.date', '$$timeFrameItem.from'] },
                                { $lt: ['$items.createdBy.date', '$$timeFrameItem.to'] },
                            ],
                        },
                    },
                },
            },
        });

        pipeline.push({
            $unwind: '$country',
        });

        pipeline.push({
            $unwind: '$timeFrames',
        });

        pipeline.push({
            $group: {
                _id: {

                    country: '$country',
                    _id: '$_id',
                    description: '$description',
                    timeFrames: '$timeFrames',
                },
                respondents: { $sum: 1 },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: '_id.country',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeline.push({
            $addFields: {
                country: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                        },
                        in: {
                            _id: '$$country._id',
                            name: '$$country.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $project: {
                description: '$_id.description',
                marketingCampaignId: '$_id._id',
                country: 1,
                respondents: 1,
                _id: 1,
            },
        });

        pipeline.push({
            $sort: {
                'country.name': 1,
                description: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: '$country._id',
                country: { $first: '$country' },
                labels: { $push: {
                    _id: '$marketingCampaignId',
                    name: '$description',
                } },
                timeFrames: {
                    $push: {
                        timeFrame: '$_id.timeFrames',
                        data: '$respondents',
                        _id: '$marketingCampaignId',
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                charts: {
                    $push: {
                        country: '$country',
                        timeFrames: '$timeFrames',
                        labels: '$labels',
                    },
                },
            },
        });


        MarketingCampaignModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_MARKETING, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        let response = result[0];

        if (!response || !response.charts) {
            response = {
                charts: [],
            };
        }

        response.charts.forEach(element => {
            const dataset = [];

            element.labels = _.map(_.groupBy(element.labels, (doc) => {
                return doc._id;
            }), (grouped) => {
                return grouped[0];
            });

            timeFilter.forEach((timePeriod, index) => {
                const timeFrames = element.timeFrames.filter((timeFrame) => {
                    return moment(timePeriod.from).isSame(timeFrame.timeFrame.from) && moment(timePeriod.to).isSame(timeFrame.timeFrame.to);
                });
                dataset.push({
                    data: [],
                });

                element.labels.forEach(label => {
                    const _idTimeFrame = timeFrames.find((timeFrameEldment) => {
                        return timeFrameEldment._id.toString() === label._id.toString();
                    });

                    dataset[index].data.push(_idTimeFrame && _idTimeFrame.data || 0);
                    dataset[index].label = `${moment(timePeriod.from).format('MM/DD/YYYY')} - ${moment(timePeriod.to).format('MM/DD/YYYY')}`;
                });
            });


            element.datasets = dataset;
        });

        res.status(200).send(response);
    });
};
