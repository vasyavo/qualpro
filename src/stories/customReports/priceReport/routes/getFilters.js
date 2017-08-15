const mongoose = require('mongoose');
const async = require('async');
const moment = require('moment');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ItemHistoryModel = require('./../../../../types/itemHistory/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFilter = require('./../../utils/locationFilter');
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

        locationFilter(pipeline, personnel, queryFilter, true);

        pipeline.push({
            $group: {
                _id: null,
                countries: { $addToSet: '$country' },
                items: {
                    $push: '$$ROOT'
                },
            },
        });


        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $addFields: {
                    items: {
                        $filter: {
                            input: '$items',
                            as   : 'item',
                            cond : {
                                $setIsSubset: [['$$item.country'], queryFilter[CONTENT_TYPES.COUNTRY]],
                            },
                        },
                    }
                }
            });
        }

        pipeline.push({
            $unwind: {
                path: '$items',
                preserveNullAndEmptyArrays: true,
            }
        });

        pipeline.push({
            $project: {
                countries  : 1,
                _id      : '$items._id',
                name     : '$items.name',
                variant  : '$items.variant',
                category : '$items.category',
            }
        });

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
                countries : 1,
                name: 1,
                variant: { $arrayElemAt: ['$variant', 0] },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                countries: { $first: '$countries' },
                variants: { $addToSet: '$variant' },
                categories: { $addToSet: '$variant.category' },
                items: {
                    $push: {
                        _id    : '$_id',
                        name   : '$name',
                        variant: '$variant._id',
                        category : '$variant.category'
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.CATEGORY] && queryFilter[CONTENT_TYPES.CATEGORY].length) {
            pipeline.push({
                $addFields: {
                    variants: {
                        $filter: {
                            input: '$variants',
                            as   : 'variant',
                            cond : {
                                $eq: ['$$variant.category', queryFilter[CONTENT_TYPES.CATEGORY][0]],
                            },
                        },
                    },
                },
            });
            pipeline.push({
                $addFields: {
                    items: {
                        $filter: {
                            input: '$items',
                            as   : 'item',
                            cond : {
                                $eq: ['$$item.category', queryFilter[CONTENT_TYPES.CATEGORY][0]],
                            },
                        },
                    }
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.VARIANT] && queryFilter[CONTENT_TYPES.VARIANT].length) {
            pipeline.push({
                $addFields: {
                    items: {
                        $filter: {
                            input: '$items',
                            as   : 'item',
                            cond : {
                                $eq: ['$$item.variant', queryFilter[CONTENT_TYPES.VARIANT][0]],
                            },
                        },
                    }
                },
            });
        }

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
