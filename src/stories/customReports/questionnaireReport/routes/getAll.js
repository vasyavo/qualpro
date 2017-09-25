const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const QuestionnaryModel = require('./../../../../types/questionnaries/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const CONSTANTS = require('./../../../../constants/mainConstants');
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
        const query = req.body;
        const timeFilter = query.timeFilter;
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
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
                    $in: queryFilter.status,
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

        pipeline.push({
            $match: {
                status: { $ne: 'draft' },
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
            $addFields: {
                answeredPersonnels: null,
                answers: null,
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                total: { $sum: 1 },
                records: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $unwind: '$records',
        });

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'records.country',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'records.region',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'records.subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'records.retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'records.outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'records.branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'records.createdBy.user.position',
                foreignField: '_id',
                as: 'position',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                status: '$records.status',
                createdBy: '$records.createdBy',
                countAnswered: '$records.countAnswered',
                countBranches: '$records.countBranches',
                countAll: '$records.countAll',
                position: {
                    $let: {
                        vars: {
                            item: { $arrayElemAt: ['$position', 0] },
                        },
                        in: {
                            _id: '$$item._id',
                            name: '$$item.name',
                        },
                    },
                },
                country: {
                    _id: 1,
                    name: 1,
                },
                region: {
                    _id: 1,
                    name: 1,
                },
                subRegion: {
                    _id: 1,
                    name: 1,
                },
                retailSegment: {
                    _id: 1,
                    name: 1,
                },
                outlet: {
                    _id: 1,
                    name: 1,
                },
                branch: {
                    _id: 1,
                    name: 1,
                },
                dueDate: '$records.dueDate',
                title: '$records.title',
            },
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

        const response = result.length ?
            result[0] : { data: [], total: 0 };

        res.status(200).send(response);
    });
};
