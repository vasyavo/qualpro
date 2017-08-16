const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const BrandingAndMonthlyDisplayModel = require('./../../../../types/brandingAndMonthlyDisplay/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const applyAnalyzeBy = require('./../components/analyzeBy/index');
const _ = require('lodash');

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

    const query = req.body;
    const timeFilter = query.timeFilter;

    const queryRun = (personnel, callback) => {
        const queryFilter = query.filter || {};
        const analyzeByParam = query.analyzeBy;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];
        const pipeline = [];

        // fixme: data structure should be like in Competitor Branding
        pipeline.push({
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                category: '$categories',
                displayType: 1,
                dateStart: 1,
                dateEnd: 1,
                description: 1,
                attachments: 1,
                createdBy: {
                    user: '$createdBy',
                    date: '$createdAt',
                },
            },
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

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
        ], queryFilter, personnel);

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
            $addFields: {
                category: {
                    $let: {
                        vars: {
                            allowedCategory: queryFilter[CONTENT_TYPES.CATEGORY] || [],
                        },
                        in: {
                            $filter: {
                                input: { $ifNull: ['$category', []] },
                                as: 'category',
                                cond: {
                                    $setIsSubset: [['$$category'], '$$allowedCategory'],
                                },
                            },
                        },
                    },
                },
            },
        });

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




            let timeFrames = timeFilter.map(function(item){
                item.from = moment(item.from, 'MM/DD/YYYY')._d;
                item.to = moment(item.to, 'MM/DD/YYYY')._d;

                return item;
            });

        pipeline.push({
            $addFields: {
                timeFrames: {
                    $filter: {
                        input: timeFrames,
                        as   : 'timeFrameItem',
                        cond : {
                            $and: [
                                {$gt: ['$createdBy.date', '$$timeFrameItem.from']},
                                {$lt: ['$createdBy.date', '$$timeFrameItem.to']},
                            ],
                        },
                    },
                }
            }
        });

        pipeline.push({
            $unwind: '$timeFrames',
        });


        applyAnalyzeBy(pipeline, analyzeByParam);

        BrandingAndMonthlyDisplayModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        let response = result[0];

        if (!response || !response.charts) {
            response = {
                charts: [],
            };
        }

        response.charts.forEach(element => {
            const dataset = [];

            element.labels = _.map(_.groupBy(element.labels, function(doc){
                return doc._id;
            }), function(grouped){
                return grouped[0];
            });

            timeFilter.forEach((timePeriod, index) => {
                let timeFrames = element.timeFrames.filter((timeFrame) => {
                    return moment(timePeriod.from).isSame(timeFrame.timeFrame.from) && moment(timePeriod.to).isSame(timeFrame.timeFrame.to)
                });
                dataset.push({
                    data: []
                });

                element.labels.forEach(label => {
                    let _idTimeFrame = timeFrames.find((timeFrameEldment) => {
                        return timeFrameEldment._id.toString() === label._id.toString()
                    });

                    dataset[index].data.push(_idTimeFrame && _idTimeFrame.data || 0)
                });


            });


            element.datasets = dataset;
        });



        res.status(200).send(response);
    });
};
