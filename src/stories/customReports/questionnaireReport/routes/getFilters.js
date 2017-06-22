const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const QuestionnaryModel = require('./../../../../types/questionnaries/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
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
        const query = req.query;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION, 'assignedTo', 'questionnaire',
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

        pipeline.push({
            $match: {
                countAnswered: { $gt: 0 },
            },
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: _.union(queryFilter[CONTENT_TYPES.PERSONNEL], personnel._id),
                },
            });
        }

        if (queryFilter.assignedTo && queryFilter.assignedTo.length) {
            $generalMatch.$and.push({
                personnels: {
                    $in: _.union(queryFilter.assignedTo, personnel._id),
                },
            });
        }

        if (queryFilter.status && queryFilter.status.length) {
            $generalMatch.$and.push({
                status: {
                    $in: _.union(queryFilter.status, personnel._id),
                },
            });
        }

        if (queryFilter.questionnaire && queryFilter.questionnaire.length) {
            $generalMatch.$and.push({
                _id: { $in: queryFilter.questionnaire },
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
                    date: '$createdBy.date',
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
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'questionnaryAnswer',
                localField: '_id',
                foreignField: 'questionnaryId',
                as: 'answers',
            },
        });

        pipeline.push({
            $addFields: {
                answeredPersonnels: {
                    $map: {
                        input: '$answers',
                        as: 'item',
                        in: '$$item.personnelId',
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'answeredPersonnels',
                foreignField: '_id',
                as: 'answeredPersonnels',
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'answeredPersonnels.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                countries: { $push: '$country' },
                regions: { $push: '$region' },
                subRegions: { $push: '$subRegion' },
                retailSegments: { $push: '$retailSegment' },
                outlets: { $push: '$outlet' },
                branches: { $push: '$branch' },
                publishers: { $addToSet: '$createdBy.user' },
                positions: { $push: '$answeredPersonnels.position' },
                assignedTo: { $push: '$personnels' },
                statuses: { $addToSet: '$status' },
                questionnaires: {
                    $push: {
                        _id: '$_id',
                        name: '$title',
                    },
                },
            },
        });

        pipeline.push({
            $project: {
                answeredPersonnels: null,
                answers: null,
                positions: {
                    $reduce: {
                        input: '$positions',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                countries: {
                    $reduce: {
                        input: '$countries',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                regions: {
                    $reduce: {
                        input: '$regions',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                subRegions: {
                    $reduce: {
                        input: '$subRegions',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                retailSegments: {
                    $reduce: {
                        input: '$retailSegments',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                outlets: {
                    $reduce: {
                        input: '$outlets',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                branches: {
                    $reduce: {
                        input: '$branches',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                publishers: 1,
                assignedTo: {
                    $reduce: {
                        input: '$assignedTo',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: ['$$this', []],
                                        },
                                        {
                                            $ne: ['$$this', null],
                                        },
                                    ],
                                },
                                then: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                statuses: 1,
                questionnaires: 1,
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
            $lookup: {
                from: 'domains',
                localField: 'countries',
                foreignField: '_id',
                as: 'countries',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'regions',
                foreignField: '_id',
                as: 'regions',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegions',
                foreignField: '_id',
                as: 'subRegions',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegments',
                foreignField: '_id',
                as: 'retailSegments',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlets',
                foreignField: '_id',
                as: 'outlets',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branches',
                foreignField: '_id',
                as: 'branches',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
            },
        });

        pipeline.push({
            $project: {
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
                retailSegments: {
                    _id: 1,
                    name: 1,
                },
                outlets: {
                    _id: 1,
                    name: 1,
                },
                branches: {
                    _id: 1,
                    name: 1,
                },
                publishers: 1,
                positions: {
                    _id: 1,
                    name: 1,
                },
                assignedTo: {
                    $map: {
                        input: '$assignedTo',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            name: {
                                en: { $concat: ['$$item.firstName.en', ' ', '$$item.lastName.en'] },
                                ar: { $concat: ['$$item.firstName.ar', ' ', '$$item.lastName.ar'] },
                            },
                        },
                    },
                },
                statuses: 1,
                questionnaires: 1,
            },
        });

        QuestionnaryModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, cb);
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
            regions: [],
            subRegions: [],
            retailSegments: [],
            outlets: [],
            branches: [],
            publishers: [],
            positions: [],
            assignedTo: [],
            statuses: [],
            questionnaires: [],
        };

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
                    en: 'Publisher',
                    ar: '',
                },
                value: 'publisher',
            },
            {
                name: {
                    en: 'Assignee',
                    ar: '',
                },
                value: 'assignee',
            },
            {
                name: {
                    en: 'Assignee Position',
                    ar: '',
                },
                value: 'position',
            },
        ];

        res.status(200).send(response);
    });
};
