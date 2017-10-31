const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const MarketingCampaignModel = require('./../../../../types/marketingCampaign/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const moment = require('moment');
const sanitizeHtml = require('../../utils/sanitizeHtml');

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
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, 'displayType',
            'status', 'publisher', CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
            CONTENT_TYPES.MARKETING_CAMPAIGN,
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

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.CATEGORY, 'displayType', 'status'], queryFilter, personnel);

        if (queryFilter.publisher && queryFilter.publisher.length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter.publisher,
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN] && queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN].length) {
            pipeline.push({
                $match: {
                    _id: { $in: queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN] },
                },
            });
        }

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        pipeline.push({
            $match: {
                status: { $ne: 'draft' },
            },
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
                description: 1,
                category: 1,
                displayType: 1,
                dateStart: 1,
                dateEnd: 1,
                country: 1,
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: {
                                    $arrayElemAt: [
                                        '$createdBy.user',
                                        0,
                                    ],
                                },
                            },
                            in: {
                                _id: '$$user._id',
                                name: {
                                    en: {
                                        $concat: [
                                            '$$user.firstName.en',
                                            ' ',
                                            '$$user.lastName.en',
                                        ],
                                    },
                                    ar: {
                                        $concat: [
                                            '$$user.firstName.ar',
                                            ' ',
                                            '$$user.lastName.ar',
                                        ],
                                    },
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    date: 1,
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'displayTypes',
                localField: 'displayType',
                foreignField: '_id',
                as: 'displayType',
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
                            name: {
                                en: '$$category.name.en',
                                ar: '$$category.name.ar',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'createdBy.user.position',
                    foreignField: '_id',
                    as: 'createdBy.user.position',
                },
            },
            {
                $addFields: {
                    'createdBy.user.position': {
                        $let: {
                            vars: {
                                position: { $arrayElemAt: ['$createdBy.user.position', 0] },
                            },
                            in: {
                                _id: '$$position._id',
                                name: {
                                    en: '$$position.name.en',
                                    ar: '$$position.name.ar',
                                },
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
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
                            name: {
                                en: '$$country.name.en',
                                ar: '$$country.name.ar',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'marketingCampaignItem',
                localField: '_id',
                foreignField: 'brandingAndDisplay',
                as: 'respondents',
            },
        });

        pipeline.push({
            $addFields: {
                respondents: { $size: '$respondents' },
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                country: 1,
                status: 1,
                displayType: {
                    _id: 1,
                    name: 1,
                },
                category: 1,
                respondents: 1,
                description: 1,
                dateStart: 1,
                dateEnd: 1,
                createdBy: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                records: { $push: '$$ROOT' },
                total: { $sum: 1 },
            },
        });

        pipeline.push({
            $unwind: {
                path: '$records',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline.push({
            $project: {
                _id: '$records._id',
                dateStart: '$records.dateStart',
                dateEnd: '$records.dateEnd',
                status: '$records.status',
                createdBy: '$records.createdBy',
                description: '$records.description',
                displayType: '$records.displayType',
                country: '$records.country',
                category: '$records.category',
                respondents: '$records.respondents',
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

        pipeline.push({
            $project: {
                total: 1,
                data: {
                    _id: 1,
                    dateStart: 1,
                    dateEnd: 1,
                    status: 1,
                    createdBy: 1,
                    description: 1,
                    displayType: 1,
                    country: 1,
                    category: 1,
                    respondents: 1,
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

        const response = result.length ?
            result[0] : { data: [], total: 0 };
        response.data.forEach(item => {
            item.description = {
                en: sanitizeHtml(item.description.en),
                ar: sanitizeHtml(item.description.ar),
            };
            item.dateStart = moment(item.dateStart).format('DD-MM-YYYY');
            item.dateEnd = moment(item.dateEnd).format('DD-MM-YYYY');
        });

        res.status(200).send(response);
    });
};
