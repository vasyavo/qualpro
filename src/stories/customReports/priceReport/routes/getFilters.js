const mongoose = require('mongoose');
const async = require('async');
const moment = require('moment');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const generalFiler = require('./../../utils/generalFilter');
const ItemHistoryModel = require('./../../../../types/itemHistory/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');

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
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const filters = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT, CONTENT_TYPES.ITEM];
        const pipeline = [];

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
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
        const $generalMatch = generalFiler([CONTENT_TYPES.COUNTRY, CONTENT_TYPES.VARIANT], queryFilter, personnel);

        const $timeMatch = {};
        $timeMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$or.push({
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

        if ($timeMatch.$or.length) {
            pipeline.push({
                $match: $timeMatch,
            });
        }

        pipeline.push({
            $lookup: {
                from: 'items',
                localField: 'headers.itemId',
                foreignField: '_id',
                as: 'itemsList',
            },
        });

        pipeline.push({
            $unwind: '$itemsList',
        });

        pipeline.push({
            $replaceRoot: { newRoot: '$itemsList' },
        });

        if (queryFilter[CONTENT_TYPES.ITEM] && queryFilter[CONTENT_TYPES.ITEM][0]) {
            $generalMatch.$and.push({
                _id: { $in: queryFilter[CONTENT_TYPES.ITEM] },
            });
        }

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        pipeline.push({
            $lookup: {
                from: 'variants',
                localField: 'variant',
                foreignField: '_id',
                as: 'variant',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                country: 1,
                name: 1,
                variant: { $arrayElemAt: ['$variant', 0] },
            },
        });

        if (queryFilter[CONTENT_TYPES.CATEGORY] && queryFilter[CONTENT_TYPES.CATEGORY][0]) {
            pipeline.push({
                $match: {
                    'variant.category': { $in: queryFilter[CONTENT_TYPES.CATEGORY] },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                countries: { $addToSet: '$country' },
                variants: { $addToSet: '$variant._id' },
                categories: { $addToSet: '$variant.category' },
                items: {
                    $push: {
                        _id: '$_id',
                        name: '$name',
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'variants',
                localField: 'variants',
                foreignField: '_id',
                as: 'variants',
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
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
            },
        });

        pipeline.push({
            $project: {
                countries: {
                    _id: 1,
                    name: 1,
                },
                variants: {
                    _id: 1,
                    name: 1,
                },
                categories: {
                    _id: 1,
                    name: 1,
                },
                items: 1,
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

        res.status(200).send(result[0]);
    });
};
