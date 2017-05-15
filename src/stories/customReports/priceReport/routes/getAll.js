const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ItemHistoryModel = require('./../../../../types/itemHistory/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
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
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
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
                    'headers.date': { $gt: new Date(timeFilter.from) },
                },
                {
                    'headers.date': { $lt: new Date(timeFilter.to) },
                },
            ];
        }

        pipeline.push({
            $match: $generalMatch,
        });

        pipeline.push({
            $project: {
                payload: 1,
                date: {
                    $dateToString: { format: '%Y-%m-%d', date: '$headers.date' },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: '$date',
                ppt: { $avg: '$payload.ppt' },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $sum: 1 },
                setPrice: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$setPrice',
        });

        pipeline.push({
            $project: {
                _id: 0,
                date: '$setPrice._id',
                price: '$setPrice.ppt',
                total: 1,
            },
        });

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
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

        const response = result.length ?
            result[0] : { data: [], total: 0 };

        response.data.forEach((item) => {
            delete item.total;

            item.date = moment(item.date).format('MMMM, YYYY');
        });

        res.status(200).send(response);
    });
};
