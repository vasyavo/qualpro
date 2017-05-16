const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const _ = require('lodash');
const AccessManager = require('./../../../../helpers/access')();
const ItemHistoryModel = require('./../../../../types/itemHistory/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');

const ajv = new Ajv();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const timeFilterSchema = {
        type: 'object',
        properties: {
            from: {
                type: 'string',
            },
            to: {
                type: 'string',
            },
        },
        required: [
            'from',
            'to',
        ],
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
        const query = req.query;
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
            const timeFilterValid = timeFilterValidate(timeFilter);

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

        if (timeFilter) {
            $generalMatch.$and = [
                {
                    'headers.date': { $gt: moment(timeFilter.from, 'DD/MM/YYYY')._d },
                },
                {
                    'headers.date': { $lt: moment(timeFilter.to, 'DD/MM/YYYY')._d },
                },
            ];
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
            $group: {
                _id: '$date',
                ppt: { $avg: '$payload.ppt' },
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
            $group: {
                _id: null,
                label: { $first: '$item.name' },
                data: {
                    $push: '$ppt',
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
                            label: '$label',
                            data: '$data',
                        },
                    ],
                    labels: '$labels',
                },
                pieChart: {
                    dataSets: [
                        {
                            label: '$label',
                            data: '$data',
                        },
                    ],
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
                pieChart: {
                    dataSets: [],
                },
            };
        }

        if (response.lineChart.labels.length === 1) {
            response.lineChart.labels.unshift(response.lineChart.labels[0]);
            response.lineChart.dataSets[0].data.unshift(0);
        }

        response.lineChart.labels = response.lineChart.labels.map((item) => {
            return moment(item).format('MMMM, YYYY');
        });

        res.status(200).send(response);
    });
};
