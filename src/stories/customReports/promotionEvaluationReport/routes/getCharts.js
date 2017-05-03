const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PromotionModel = require('./../../../../types/promotion/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const applyAnalyzeBy = require('./../components/analyzeBy/index');

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
        const analyzeByParam = query.analyzeBy;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, 'displayType',
            'status', 'publisher', CONTENT_TYPES.POSITION,
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
            if (queryFilter[filterName] && queryFilter[filterName][0] && filterName !== 'status') {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        if (timeFilter) {
            pipeline.push({
                $match: {
                    $and: [
                        {
                            'createdBy.date': { $gt: new Date(timeFilter.from) },
                        },
                        {
                            'createdBy.date': { $lt: new Date(timeFilter.to) },
                        },
                    ],
                },
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
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                category: 1,
                publisher: { $arrayElemAt: ['$createdBy.user._id', 0] },
                publisherPosition: { $arrayElemAt: ['$createdBy.user.position', 0] },
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    publisherPosition: {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        applyAnalyzeBy(pipeline, analyzeByParam);

        pipeline.push({
            $group: {
                _id: null,
                data: {
                    $push: {
                        value: {
                            count: '$count',
                            promotion: '$promotion',
                        },
                        label: '$name',
                    },
                },
                labels: { $addToSet: '$count' },
            },
        });

        pipeline.push({
            $project: {
                lineChart: {
                    data: '$data',
                    labels: '$labels',
                },
                pieChart: {
                    data: '$data',
                },
            },
        });

        PromotionModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_PROMO_EVALUATION, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const response = result[0];

        response.lineChart.labels.sort();
        response.lineChart.data = _.sortBy(response.lineChart.data, ['value']);
        response.pieChart.data = _.sortBy(response.lineChart.data, ['value']);

        res.status(200).send(result);
    });
};
