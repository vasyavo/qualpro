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
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                category: 1,
                shelfShare: '$brands',
                createdBy: {
                    user: {
                        $let: {
                            vars: { user: { $arrayElemAt: ['$createdBy.user', 0] } },
                            in: { _id: '$$user._id', position: '$$user.position' },
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
            $unwind: '$shelfShare',
        });

        if (queryFilter.brand && queryFilter.brand.length) {
            pipeline.push({
                $match: {
                    'shelfShare.brand': {
                        $in: queryFilter.brand,
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: {
                    country: '$country',
                    region: '$region',
                    subRegion: '$subRegion',
                    branch: '$branch',
                    category: '$category',
                    brand: '$shelfShare.brand',
                },
                shelfShares: {
                    $push: {
                        percent: '$shelfShare.percent',
                        length: '$shelfShare.length',
                    },
                },
            },
        });

        pipeline.push({
            $project: {
                _id: false,
                group: '$_id',
                shelfShares: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'group.country',
                foreignField: '_id',
                as: 'group.country',
            },
        });

        pipeline.push({
            $project: {
                group: {
                    country: {
                        $let: {
                            vars: {
                                country: { $arrayElemAt: ['$group.country', 0] },
                            },
                            in: {
                                _id: '$$country._id',
                                name: '$$country.name',
                            },
                        },
                    },
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    category: 1,
                    brand: 1,
                },
                shelfShares: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'group.region',
                foreignField: '_id',
                as: 'group.region',
            },
        });

        pipeline.push({
            $project: {
                group: {
                    country: 1,
                    region: {
                        $let: {
                            vars: {
                                region: { $arrayElemAt: ['$group.region', 0] },
                            },
                            in: {
                                _id: '$$region._id',
                                name: '$$region.name',
                            },
                        },
                    },
                    subRegion: 1,
                    branch: 1,
                    category: 1,
                    brand: 1,
                },
                shelfShares: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'group.subRegion',
                foreignField: '_id',
                as: 'group.subRegion',
            },
        });

        pipeline.push({
            $project: {
                group: {
                    country: 1,
                    region: 1,
                    subRegion: {
                        $let: {
                            vars: {
                                subRegion: { $arrayElemAt: ['$group.subRegion', 0] },
                            },
                            in: {
                                _id: '$$subRegion._id',
                                name: '$$subRegion.name',
                            },
                        },
                    },
                    branch: 1,
                    category: 1,
                    brand: 1,
                },
                shelfShares: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'group.branch',
                foreignField: '_id',
                as: 'group.branch',
            },
        });

        pipeline.push({
            $project: {
                group: {
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: {
                        $let: {
                            vars: {
                                branch: { $arrayElemAt: ['$group.branch', 0] },
                            },
                            in: {
                                _id: '$$branch._id',
                                name: '$$branch.name',
                            },
                        },
                    },
                    category: 1,
                    brand: 1,
                },
                shelfShares: 1,
                total: 1,
            },
        });

        pipeline.push({
            $project: {
                country: '$group.country',
                region: '$group.region',
                subRegion: '$group.subRegion',
                branch: '$group.branch',
                category: '$group.category',
                brand: '$group.brand',
                location: {
                    en: { $concat: ['$group.country.name.en', ' -> ', '$group.region.name.en', ' -> ', '$group.subRegion.name.en', ' -> ', '$group.branch.name.en'] },
                    ar: { $concat: ['$group.country.name.ar', ' -> ', '$group.region.name.ar', ' -> ', '$group.subRegion.name.ar', ' -> ', '$group.branch.name.ar'] },
                },
                shelfShares: 1,
                total: 1,
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
            },
        });

        pipeline.push({
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                category: 1,
                brand: 1,
                location: 1,
                maxLength: { $max: '$shelfShares.length' },
                minLength: { $min: '$shelfShares.length' },
                avgLength: { $avg: '$shelfShares.length' },
                maxPercent: { $max: '$shelfShares.percent' },
                minPercent: { $min: '$shelfShares.percent' },
                avgPercent: { $avg: '$shelfShares.percent' },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        });

        pipeline.push({
            $addFields: {
                category: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0] },
                        },
                        in: {
                            _id: '$$category._id',
                            name: '$$category.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
            },
        });
        pipeline.push({
            $addFields: {
                brand: {
                    $let: {
                        vars: {
                            brand: { $arrayElemAt: ['$brand', 0] },
                        },
                        in: {
                            _id: '$$brand._id',
                            name: '$$brand.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                label: {
                    $concat: ['$category.name.en', ' -> ', '$brand.name.en'],
                },
            },
        });

        pipeline.push({
            $sort: {
                label: 1,
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
                country: '$setShelfShare.country',
                region: '$setShelfShare.region',
                subRegion: '$setShelfShare.subRegion',
                branch: '$setShelfShare.branch',
                category: '$setShelfShare.category',
                brand: '$setShelfShare.brand',
                location: '$setShelfShare.location',
                maxLength: '$setShelfShare.maxLength',
                minLength: '$setShelfShare.minLength',
                avgLength: '$setShelfShare.avgLength',
                maxPercent: '$setShelfShare.maxPercent',
                minPercent: '$setShelfShare.minPercent',
                avgPercent: '$setShelfShare.avgPercent',
                label: '$setShelfShare.label',
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
            item.avgLength = parseFloat(item.avgLength).toFixed(2);
            item.avgPercent = parseFloat(item.avgPercent).toFixed(2);
            item.minLength = parseFloat(item.minLength).toFixed(2);
            item.minPercent = parseFloat(item.minPercent).toFixed(2);
            item.maxLength = parseFloat(item.maxLength).toFixed(2);
            item.maxPercent = parseFloat(item.maxPercent).toFixed(2);
        });

        res.status(200).send(response);
    });
};
