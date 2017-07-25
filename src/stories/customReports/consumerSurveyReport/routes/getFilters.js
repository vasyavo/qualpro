const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ConsumersSurveyAnswersModel = require('./../../../../types/consumersSurveyAnswers/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
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
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION, 'title',
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

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    branch: { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                },
            });
        }

        if (queryFilter.title && queryFilter.title.length) {
            pipeline.push({
                $match: {
                    questionnaryId: { $in: queryFilter.title },
                },
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

        if (queryFilter.gender && queryFilter.gender.length) {
            pipeline.push({
                $match: {
                    'customer.gender': {
                        $in: queryFilter.gender,
                    },
                },
            });
        }

        if (queryFilter.nationality && queryFilter.nationality.length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            'customer.nationality.name.en': {
                                $in: queryFilter.nationality,
                            },
                        },
                        {
                            'customer.nationality.name.ar': {
                                $in: queryFilter.nationality,
                            },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    'createdBy.user': {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
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

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeline.push({
            $addFields: {
                branch: {
                    $let: {
                        vars: {
                            branch: { $arrayElemAt: ['$branch', 0] },
                        },
                        in: {
                            _id: '$$branch._id',
                            name: '$$branch.name',
                            retailSegment: '$$branch.retailSegment',
                            outlet: '$$branch.outlet',
                            subRegion: '$$branch.subRegion',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    'branch.subRegion': { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    'branch.retailSegment': { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    'branch.outlet': { $in: queryFilter[CONTENT_TYPES.OUTLET] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'branch.retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $let: {
                        vars: {
                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                        },
                        in: {
                            _id: '$$retailSegment._id',
                            name: '$$retailSegment.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'branch.outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeline.push({
            $addFields: {
                outlet: {
                    $let: {
                        vars: {
                            outlet: { $arrayElemAt: ['$outlet', 0] },
                        },
                        in: {
                            _id: '$$outlet._id',
                            name: '$$outlet.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'branch.subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeline.push({
            $addFields: {
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                        },
                        in: {
                            _id: '$$subRegion._id',
                            name: '$$subRegion.name',
                            parent: '$$subRegion.parent',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    'subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.parent',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeline.push({
            $addFields: {
                region: {
                    $let: {
                        vars: {
                            region: { $arrayElemAt: ['$region', 0] },
                        },
                        in: {
                            _id: '$$region._id',
                            name: '$$region.name',
                            parent: '$$region.parent',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    'region.parent': { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'consumersSurvey',
                localField: 'questionnaryId',
                foreignField: '_id',
                as: 'consumer',
            },
        });

        pipeline.push({
            $addFields: {
                status: {
                    $let: {
                        vars: {
                            consumer: { $arrayElemAt: ['$consumer', 0] },
                        },
                        in: '$$consumer.status',
                    },
                },
                consumer: null,
                title: {
                    $let: {
                        vars: {
                            consumer: { $arrayElemAt: ['$consumer', 0] },
                        },
                        in: '$$consumer.title',
                    },
                },
                customer: {
                    gender: '$customer.gender',
                    nationality: {
                        _id: '$customer.nationality.name.en',
                        name: '$customer.nationality.name',
                    },
                },
            },
        });

        pipeline.push({
            $match: {
                status: {
                    $ne: 'draft',
                },
            },
        });

        if (queryFilter.status && queryFilter.status.length) {
            pipeline.push({
                $match: {
                    status: { $in: queryFilter.status },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                countries: { $addToSet: '$region.parent' },
                titles: {
                    $addToSet: {
                        _id: '$questionnaryId',
                        name: '$title',
                    },
                },
                regions: { $addToSet: '$region' },
                subRegions: { $addToSet: '$subRegion' },
                retailSegments: { $addToSet: '$retailSegment' },
                outlets: { $addToSet: '$outlet' },
                branches: { $addToSet: '$branch' },
                publishers: { $addToSet: '$createdBy.user' },
                positions: { $addToSet: '$createdBy.user.position' },
                statuses: { $addToSet: '$status' },
                nationalities: { $addToSet: '$customer.nationality' },
                genders: { $addToSet: '$customer.gender' },
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
                from: 'positions',
                localField: 'positions',
                foreignField: '_id',
                as: 'positions',
            },
        });

        pipeline.push({
            $project: {
                titles: 1,
                countries: {
                    _id: 1,
                    name: 1,
                },
                regions: {
                    _id: 1,
                    name: 1,
                },
                subRegions: {
                    _id: 1,
                    name: 1,
                },
                branches: {
                    _id: 1,
                    name: 1,
                },
                publishers: {
                    _id: 1,
                    name: 1,
                },
                positions: {
                    _id: 1,
                    name: 1,
                },
                retailSegments: 1,
                outlets: 1,
                statuses: 1,
                nationalities: 1,
                genders: 1,
            },
        });

        ConsumersSurveyAnswersModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVES_AND_TASKS_FORM, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const response = result && result[0] ? result[0] : {
            countries: [],
            titles: [],
            regions: [],
            subRegions: [],
            branches: [],
            publishers: [],
            positions: [],
            retailSegments: [],
            outlets: [],
            statuses: [],
            nationalities: [],
            genders: [],
        };

        const statuses = [
            {
                _id: 'active',
                name: {
                    en: 'Active',
                    ar: '',
                },
            },
            {
                _id: 'completed',
                name: {
                    en: 'Completed',
                    ar: '',
                },
            },
        ];

        const genders = [
            {
                _id: 'male',
                name: {
                    en: 'Male',
                    ar: '',
                },
            },
            {
                _id: 'female',
                name: {
                    en: 'Female',
                    ar: '',
                },
            },
        ];

        response.statuses = statuses.filter((item) => {
            return response.statuses.indexOf(item._id) > -1;
        });

        response.titles = response.titles.map(item => {
            return {
                _id: item._id,
                name: {
                    en: sanitizeHtml(item.name.en),
                    ar: sanitizeHtml(item.name.ar),
                },
            };
        });

        response.genders = genders.filter((item) => {
            return response.genders.indexOf(item._id) > -1;
        });

        response.analyzeBy = [
            {
                name: {
                    en: 'Country',
                    ar: '',
                },
                value: 'country',
            },
            {
                name: {
                    en: 'Region',
                    ar: '',
                },
                value: 'region',
            },
            {
                name: {
                    en: 'Sub Region',
                    ar: '',
                },
                value: 'subRegion',
            },
            {
                name: {
                    en: 'Branch',
                    ar: '',
                },
                value: 'branch',
            },
            {
                name: {
                    en: 'Position',
                    ar: '',
                },
                value: 'position',
            },
            {
                name: {
                    en: 'Publisher',
                    ar: '',
                },
                value: 'publisher',
            },
        ];

        res.status(200).send(response);
    });
};
