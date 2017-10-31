const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const _ = require('lodash');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const ObjectiveModel = require('./../../../../types/objective/model');
const CONSTANTS = require('./../../../../constants/mainConstants');
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
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION, 'assignedToPersonnel', 'createdByPersonnel',
        ];
        const pipeline = [];

        pipeline.push({
            $match: {
                archived: false,
            },
        });

        pipeline.push({
            $match: {
                status: { $ne: 'draft' },
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

        pipeline.push({
            $match: {
                context: CONTENT_TYPES.INSTORETASKS,
            },
        });

        locationFiler(pipeline, personnel, queryFilter);
        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, 'status', 'priority'], queryFilter, personnel);

        if (queryFilter.formType && queryFilter.formType.length) {
            $generalMatch.$and.push({
                'form.contentType': {
                    $in: queryFilter.formType,
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

        if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
            pipeline.push({
                $addFields: {
                    subRegion: {
                        $let: {
                            vars: {
                                filters: {
                                    subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                },
                            },
                            in: {
                                $filter: {
                                    input: '$subRegion',
                                    as: 'subRegion',
                                    cond: {
                                        $setIsSubset: [['$$subRegion'], '$$filters.subRegion'],
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            pipeline.push({
                $addFields: {
                    region: {
                        $let: {
                            vars: {
                                filters: {
                                    region: queryFilter[CONTENT_TYPES.REGION],
                                },
                            },
                            in: {
                                $filter: {
                                    input: '$region',
                                    as: 'region',
                                    cond: {
                                        $setIsSubset: [['$$region'], '$$filters.region'],
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    retailSegment: {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $filter: {
                                    input: '$retailSegment',
                                    as: 'retailSegment',
                                    cond: {
                                        $setIsSubset: [['$$retailSegment'], '$$filters.retailSegment'],
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    outlet: {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $filter: {
                                    input: '$outlet',
                                    as: 'outlet',
                                    cond: {
                                        $setIsSubset: [['$$outlet'], '$$filters.outlet'],
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        if (queryFilter.assignedToPersonnel && queryFilter.assignedToPersonnel.length) {
            pipeline.push({
                $match: {
                    assignedTo: {
                        $in: _.union(queryFilter.assignedToPersonnel, personnel._id),
                    },
                },
            });
        }

        if (queryFilter.createdByPersonnel && queryFilter.createdByPersonnel.length) {
            pipeline.push({
                $match: {
                    'createdBy.user': {
                        $in: queryFilter.createdByPersonnel,
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

        pipeline.push({
            $group: {
                _id: null,
                setTasks: { $push: '$$ROOT' },
                total: { $sum: 1 },
            },
        });

        pipeline.push({
            $unwind: '$setTasks',
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
                localField: 'setTasks.country',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'setTasks.region',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'setTasks.subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'setTasks.retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'setTasks.outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'setTasks.branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'comments',
                localField: 'setTasks.comments',
                foreignField: '_id',
                as: 'comments',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'setTasks.createdBy.user.position',
                foreignField: '_id',
                as: 'position',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'setTasks.assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
            },
        });

        pipeline.push({
            $project: {
                _id: '$setTasks._id',
                title: '$setTasks.title',
                createdBy: '$setTasks.createdBy',
                priority: '$setTasks.priority',
                status: '$setTasks.status',
                form: '$setTasks.form',
                description: '$setTasks.description',
                objectiveType: '$setTasks.objectiveType',
                dateStart: '$setTasks.dateStart',
                dateEnd: '$setTasks.dateEnd',
                total: 1,
                comments: 1,
                location: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                            region: { $arrayElemAt: ['$region', 0] },
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                            outlet: { $arrayElemAt: ['$outlet', 0] },
                            branch: { $arrayElemAt: ['$branch', 0] },
                        },
                        in: {
                            en: {
                                $concat: [
                                    '$$country.name.en',
                                    ' -> ',
                                    '$$region.name.en',
                                    ' -> ',
                                    '$$subRegion.name.en',
                                    ' -> ',
                                    '$$retailSegment.name.en',
                                    ' -> ',
                                    '$$outlet.name.en',
                                ],
                            },
                            ar: {
                                $concat: [
                                    '$$country.name.ar',
                                    ' -> ',
                                    '$$region.name.ar',
                                    ' -> ',
                                    '$$subRegion.name.ar',
                                    ' -> ',
                                    '$$retailSegment.name.ar',
                                    ' -> ',
                                    '$$outlet.name.ar',
                                ],
                            },
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
                position: {
                    $let: {
                        vars: {
                            position: { $arrayElemAt: ['$position', 0] },
                        },
                        in: {
                            _id: '$$position._id',
                            name: '$$position.name',
                        },
                    },
                },
                attachments: {
                    $reduce: {
                        input: '$comments',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $ne: ['$$this.attachments', []],
                                },
                                then: {
                                    $setUnion: ['$$this.attachments', '$$value'],
                                },
                                else: '$$value',
                            },
                        },
                    },
                },
                commentsUser: {
                    $reduce: {
                        input: '$comments',
                        initialValue: [],
                        in: {
                            $setUnion: [
                                ['$$this.createdBy.user'],
                                '$$value',
                            ],
                        },
                    },
                },
                assignedTo: {
                    $map: {
                        input: '$assignedTo',
                        as: 'personnel',
                        in: {
                            _id: '$$personnel._id',
                            position: '$$personnel.position',
                            name: {
                                en: { $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] },
                                ar: { $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] },
                            },
                        },
                    },
                },
            },
        });

        if (queryFilter.POSITION && queryFilter.POSITION.length) {
            pipeline.push({
                $match: {
                    'assignedTo.position': {
                        $in: _.union(queryFilter.POSITION, personnel._id),
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'commentsUser',
                foreignField: '_id',
                as: 'commentsUser',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'files',
                localField: 'attachments',
                foreignField: '_id',
                as: 'attachments',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                title: 1,
                createdBy: 1,
                priority: 1,
                status: 1,
                form: 1,
                description: 1,
                objectiveType: 1,
                dateStart: 1,
                dateEnd: 1,
                total: 1,
                location: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                position: 1,
                attachments: 1,
                assignedTo: 1,
                comments: {
                    $map: {
                        input: '$comments',
                        as: 'comment',
                        in: {
                            _id: '$$comment._id',
                            body: '$$comment.body',
                            attachments: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$attachments',
                                            as: 'attachment',
                                            cond: {
                                                $setIsSubset: [['$$attachment._id'], '$$comment.attachments'],
                                            },
                                        },
                                    },
                                    as: 'attachment',
                                    in: {
                                        _id: '$$attachment._id',
                                        originalName: '$$attachment.originalName',
                                        contentType: '$$attachment.contentType',
                                        preview: '$$attachment.preview',
                                    },
                                },
                            },
                            createdBy: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$commentsUser',
                                                    as: 'user',
                                                    cond: {
                                                        $setIsSubset: [
                                                            [
                                                                '$$user._id',
                                                            ],
                                                            ['$$comment.createdBy.user'],
                                                        ],
                                                    },
                                                },
                                            },
                                            as: 'user',
                                            in: {
                                                _id: '$$user._id',
                                                firstName: '$$user.firstName',
                                                lastName: '$$user.lastName',
                                                imageSrc: '$$user.imageSrc',
                                            },

                                        },
                                    },
                                    0,
                                ],
                            },
                        },
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

        ObjectiveModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const priorities = [{
            _id: 'medium',
            name: {
                en: 'medium',
                ar: 'متوسط',
            },
        }, {
            _id: 'urgent',
            name: {
                en: 'urgent',
                ar: 'عاجل',
            },
        }, {
            _id: 'low',
            name: {
                en: 'low',
                ar: 'ضعيف',
            },
        }, {
            _id: 'high',
            name: {
                en: 'high',
                ar: 'هام للغايه',
            },
        }];

        const statuses = [{
            _id: 'toBeDiscussed',
            name: {
                en: 'To be discussed',
                ar: '',
            },
        }, {
            _id: 'inProgress',
            name: {
                en: 'In progress',
                ar: 'في تَقَدم',
            },
        }, {
            _id: 'reOpened',
            name: {
                en: 'Reopened',
                ar: 'ضعيف',
            },
        }, {
            _id: 'closed',
            name: {
                en: 'Closed',
                ar: 'مغلق',
            },
        }, {
            _id: 'overDue',
            name: {
                en: 'Overdue',
                ar: 'متأخر',
            },
        }, {
            _id: 'fail',
            name: {
                en: 'Fail',
                ar: 'اخفاق',
            },
        }, {
            _id: 'completed',
            name: {
                en: 'Completed',
                ar: 'منجز',
            },
        }];

        const formTypes = [{
            _id: 'distribution',
            name: {
                en: 'distribution',
                ar: 'نماذج التوزيع',
            },
        }, {
            _id: 'visibility',
            name: {
                en: 'visibility',
                ar: 'نماذج الرؤية',
            },
        }];

        const response = result.length ?
            result[0] : { data: [], total: 0 };
        response.data.forEach(item => {
            item.description = {
                en: sanitizeHtml(item.description.en),
                ar: sanitizeHtml(item.description.ar),
            };
            item.priority = priorities.filter((subItem) => {
                return item.priority.indexOf(subItem._id) > -1;
            });

            item.status = statuses.filter((subItem) => {
                return item.status.indexOf(subItem._id) > -1;
            });

            item.form.contentType = formTypes.filter((subItem) => {
                return item.form.contentType.indexOf(subItem._id) > -1;
            });
        });
        res.status(200).send(response);
    });
};
