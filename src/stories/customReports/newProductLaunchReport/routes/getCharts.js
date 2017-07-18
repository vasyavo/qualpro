const ObjectId = require('bson-objectid');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const generalFiler = require('./../../utils/generalFilter');
const NewProductLaunch = require('./../../../../types/newProductLaunch/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const applyAnalyzeBy = require('./../components/analyzeBy/index');
const moment = require('moment');

const ajv = new Ajv();

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
        const timeFilter = query.timeFilter;
        const analyzeByParam = query.analyzeBy;
        const queryFilter = query.filter || {};

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        // map set String ID to set ObjectID
        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION,
            CONTENT_TYPES.PERSONNEL,
        ].forEach(filterName => {
            if (queryFilter[filterName] && queryFilter[filterName].length) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        const pipeline = [];

        const $locationMatch = generalFiler([
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
        ], queryFilter);

        if ($locationMatch.$and.length) {
            pipeline.push({ $match: $locationMatch });
        }

        const $generalMatch = generalFiler([
            CONTENT_TYPES.DISPLAY_TYPE,
            'packing',
        ], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.CATEGORY] && queryFilter[CONTENT_TYPES.CATEGORY].length) {
            const setObjectId = [];
            const setString = [];

            queryFilter[CONTENT_TYPES.CATEGORY].forEach(id => {
                if (ObjectId.isValid(id)) {
                    setObjectId.push(ObjectId(id));
                } else {
                    setString.push(id);
                }
            });

            const $or = [];

            if (setObjectId.length) {
                $or.push({ category: { $in: setObjectId } });
            }

            if (setString.length) {
                $or.push({
                    $or: [
                        { 'category_name.en': { $in: setString } },
                        { 'category_name.ar': { $in: setString } },
                    ],
                });
            }

            if ($or.length) {
                $generalMatch.$and.push({ $or });
            }
        }

        if (queryFilter[CONTENT_TYPES.BRAND] && queryFilter[CONTENT_TYPES.BRAND].length) {
            const setObjectId = [];
            const setString = [];

            queryFilter[CONTENT_TYPES.BRAND].forEach(id => {
                if (ObjectId.isValid(id)) {
                    setObjectId.push(ObjectId(id));
                } else {
                    setString.push(id);
                }
            });

            const $or = [];

            if (setObjectId.length) {
                $or.push({ 'brand._id': { $in: setObjectId } });
            }

            if (setString.length) {
                $or.push({ 'brand.name': { $in: setString } });
            }

            if ($or.length) {
                $generalMatch.$and.push({ $or });
            }
        }

        if (queryFilter[CONTENT_TYPES.VARIANT] && queryFilter[CONTENT_TYPES.VARIANT].length) {
            const setObjectId = [];
            const setString = [];

            queryFilter[CONTENT_TYPES.VARIANT].forEach(id => {
                if (ObjectId.isValid(id)) {
                    setObjectId.push(ObjectId(id));
                } else {
                    setString.push(id);
                }
            });

            const $or = [];

            if (setObjectId.length) {
                $or.push({ 'variant._id': { $in: setObjectId } });
            }

            if (setString.length) {
                $or.push({ 'variant.name': { $in: setString } });
            }

            if ($or.length) {
                $generalMatch.$and.push({ $or });
            }
        }

        if (queryFilter.distributor && queryFilter.distributor.length) {
            $generalMatch.$and.push({
                $or: [
                    {
                        'distributor.en': {
                            $in: queryFilter.distributor,
                        },
                    },
                    {
                        'distributor.ar': {
                            $in: queryFilter.distributor,
                        },
                    },
                ],
            });
        }

        const $timeMatch = {
            $or: timeFilter.map((frame) => {
                return {
                    $and: [
                        { 'createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d } },
                        { 'createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d } },
                    ],
                };
            }),
        };

        if ($timeMatch.$or.length) {
            pipeline.push({
                $match: $timeMatch,
            });
        }

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        pipeline.push({
            $addFields: {
                shelfLifePeriod: {
                    $trunc: {
                        $divide: [
                            {
                                $subtract: ['$shelfLifeEnd', '$shelfLifeStart'],
                            },
                            86400000,
                        ],
                    },
                },
            },
        });

        if (queryFilter.shelfLife) {
            queryFilter.shelfLife = parseInt(queryFilter.shelfLife, 10);

            pipeline.push({
                $match: {
                    shelfLifePeriod: { $gte: queryFilter.shelfLife },
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
            $addFields: {
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ['$createdBy.user', 0] },
                            },
                            in: {
                                _id: '$$user._id',
                                name: {
                                    en: { $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] },
                                    ar: { $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] },
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    date: '$createdBy.date',
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

        applyAnalyzeBy(pipeline, analyzeByParam);

        NewProductLaunch.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, cb);
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
            response = {
                barChart: {
                    labels: response.labels,
                    datasets: [{
                        data: response.data,
                    }],
                },
            };
        } else {
            response = {
                barChart: {
                    labels: [],
                    datasets: [],
                },
            };
        }

        res.status(200).send(response);
    });
};
