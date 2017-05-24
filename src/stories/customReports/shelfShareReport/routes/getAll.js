const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ShelfShareModel = require('./../../../../types/shelfShare/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
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

    const queryRun = (personnel, callback) => {
        const query = req.query;
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.BRAND, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];
        const pipeline = [];

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate(timeFilter);

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

        if (timeFilter) {
            pipeline.push({
                $match: {
                    $and: [
                        {
                            'createdBy.date': { $gt: moment(timeFilter.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'createdBy.date': { $lt: moment(timeFilter.to, 'MM/DD/YYYY')._d },
                        },
                    ],
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

        pipeline.push({
            $group: {
                _id: {
                    category: '$category',
                    brand: '$brands.brand',
                },
                maxLength: { $max: '$brands.length' },
                minLength: { $min: '$brands.length' },
                avgLength: { $avg: '$brands.length' },
                maxPercent: { $max: '$brands.percent' },
                minPercent: { $min: '$brands.percent' },
                avgPercent: { $avg: '$brands.percent' },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'brands',
                localField: '_id.brand',
                foreignField: '_id',
                as: 'brand',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                maxLength: 1,
                minLength: 1,
                avgLength: 1,
                maxPercent: 1,
                minPercent: 1,
                avgPercent: 1,
                name: {
                    $let: {
                        vars: {
                            brand: { $arrayElemAt: ['$brand', 0] },
                        },
                        in: '$$brand.name',
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: '$_id.category',
                brands: {
                    $push: {
                        _id: '$_id.brand',
                        name: '$name',
                        maxLength: '$maxLength',
                        minLength: '$minLength',
                        avgLength: '$avgLength',
                        maxPercent: '$maxPercent',
                        minPercent: '$minPercent',
                        avgPercent: '$avgPercent',
                    },
                },
                totalMinLength: { $min: '$minLength' },
                totalMaxLength: { $max: '$maxLength' },
                totalAvgLength: { $avg: '$avgLength' },
                totalMinPercent: { $min: '$minPercent' },
                totalMaxPercent: { $max: '$maxPercent' },
                totalAvgPercent: { $avg: '$avgPercent' },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                setShelfShare: { $push: '$$ROOT' },
                total: { $sum: 1 },
            },
        });

        pipeline.push({
            $unwind: {
                path: '$setShelfShare',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline.push({
            $project: {
                _id: '$setShelfShare._id',
                brands: '$setShelfShare.brands',
                totalMinLength: '$setShelfShare.totalMinLength',
                totalMaxLength: '$setShelfShare.totalMaxLength',
                totalAvgLength: '$setShelfShare.totalAvgLength',
                totalMinPercent: '$setShelfShare.totalMinPercent',
                totalMaxPercent: '$setShelfShare.totalMaxPercent',
                totalAvgPercent: '$setShelfShare.totalAvgPercent',
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
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                brands: 1,
                totalMinLength: 1,
                totalMaxLength: 1,
                totalAvgLength: 1,
                totalMinPercent: 1,
                totalMaxPercent: 1,
                totalAvgPercent: 1,
                total: 1,
                name: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0] },
                        },
                        in: '$$category.name',
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: { $push: '$$ROOT' },
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

        const response = result.length ?
            result[0] : { data: [], total: 0 };

        response.data.forEach(item => {
            item.brands.forEach(brand => {
                brand.minLength = parseFloat(brand.minLength).toFixed(2);
                brand.minPercent = parseFloat(brand.minPercent).toFixed(2);
                brand.avgLength = parseFloat(brand.avgLength).toFixed(2);
                brand.avgPercent = parseFloat(brand.avgPercent).toFixed(2);
                brand.maxLength = parseFloat(brand.maxLength).toFixed(2);
                brand.maxPercent = parseFloat(brand.maxPercent).toFixed(2);
            });

            item.totalMinLength = parseFloat(item.totalMinLength).toFixed(2);
            item.totalMinPercent = parseFloat(item.totalMinPercent).toFixed(2);
            item.totalAvgLength = parseFloat(item.totalAvgLength).toFixed(2);
            item.totalAvgPercent = parseFloat(item.totalAvgPercent).toFixed(2);
            item.totalMaxLength = parseFloat(item.totalMaxLength).toFixed(2);
            item.totalMaxPercent = parseFloat(item.totalMaxPercent).toFixed(2);
        });

        res.status(200).send(response);
    });
};
