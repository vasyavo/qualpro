const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ItemHistoryModel = require('./../../../../types/itemHistory/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const currency = require('./../../utils/currency');

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

    const filterSchema = {
        type: 'object',
        properties: {
            [CONTENT_TYPES.ITEM]: {
                type: 'array',
                items: {
                    type: 'string',
                },
                minItems: 1,
                maxItems: 1,
            },
        },
        required: [
            CONTENT_TYPES.ITEM,
        ],
    };

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const pipeline = [];

        const queryFilterValidate = ajv.compile(filterSchema);
        const queryFilterValid = queryFilterValidate(queryFilter);

        if (!queryFilterValid) {
            const err = new Error(queryFilterValidate.errors[0].message);

            err.status = 400;

            return next(err);
        }

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        queryFilter[CONTENT_TYPES.ITEM] = queryFilter[CONTENT_TYPES.ITEM].map((item) => ObjectId(item));

        const $generalMatch = {
            'headers.itemId': { $in: queryFilter[CONTENT_TYPES.ITEM] },
            'headers.contentType': 'item',
            'headers.actionType': 'itemChanged',
        };

        $generalMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $generalMatch.$or.push({
                    $and: [
                        {
                            'headers.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'headers.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
                        },
                    ],
                });
                return frame;
            });
        }

        pipeline.push({
            $match: $generalMatch,
        });

        pipeline.push({
            $project: {
                payload: 1,
                itemId: '$headers.itemId',
                date: '$headers.date',
            },
        });

        pipeline.push({
            $addFields: {
                'payload.ppt': { $divide: ['$payload.ppt', 1000] },
            },
        });

        pipeline.push({
            $group: {
                _id: '$date',
                ppt: { $avg: '$payload.ppt' },
                country: { $first: '$payload.country' },
                itemId: { $first: '$itemId' },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'items',
                localField: 'itemId',
                foreignField: '_id',
                as: 'item',
            },
        });

        pipeline.push({
            $addFields: {
                item: {
                    $let: {
                        vars: {
                            item: { $arrayElemAt: ['$item', 0] },
                        },
                        in: {
                            _id: '$$item._id',
                            name: '$$item.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $sort: {
                _id: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                label: { $first: '$item.name' },
                data: {
                    $push: '$ppt',
                },
                country: {
                    $first: '$country',
                },
                labels: {
                    $push: {
                        $dateToString: { format: '%Y-%m-%d', date: '$_id' },
                    },
                },
            },
        });

        pipeline.push({
            $project: {
                lineChart: {
                    dataSets: [
                        {
                            country: '$country',
                            label: '$label',
                            data: '$data',
                        },
                    ],
                    labels: '$labels',
                },
            },
        });

        ItemHistoryModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.ITEMS_AND_PRICES, cb);
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
            response.lineChart.labels.sort();
        } else {
            response = {
                lineChart: {
                    labels: [],
                    dataSets: [],
                },
            };
        }

        if (response.lineChart.labels.length === 1) {
            response.lineChart.labels.push(moment(new Date()).format('MMMM, YYYY'));
            response.lineChart.dataSets[0].data.push(response.lineChart.dataSets[0].data[0]);
        }

        response.lineChart.labels = response.lineChart.labels.map(item => {
            return {
                en: moment(new Date(item)).format('MMMM, YYYY'),
                ar: moment(new Date(item)).lang('ar').format('MMMM, YYYY'),
            };
        });

        if (response.lineChart.dataSets.length) {
            response.lineChart.dataSets[0].data = response.lineChart.dataSets[0].data.map(item => {
                const currentCountry = currency.defaultData.find((country) => {
                    return country._id.toString() === response.lineChart.dataSets[0].country.toString();
                });

                return parseFloat(item * currentCountry.currencyInUsd).toFixed(2);
            });
        }

        res.status(200).send(response);
    });
};
