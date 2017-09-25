const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ConsumersSurveyModel = require('./../../../../types/consumersSurvey/model');
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
    let currentLanguage;

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

        currentLanguage = personnel.currentLanguage || 'en';

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

        if (queryFilter.title && queryFilter.title.length) {
            pipeline.push({
                $match: {
                    _id: { $in: queryFilter.title },
                },
            });
        }

        pipeline.push({
            $match: {
                status: { $ne: 'draft' },
            },
        });

        if (queryFilter.status && queryFilter.status.length) {
            pipeline.push({
                $match: {
                    status: { $in: queryFilter.status },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            country: { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
                        },
                        {
                            country: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            region: { $in: queryFilter[CONTENT_TYPES.REGION] },
                        },
                        {
                            region: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            subRegion: { $in: queryFilter[CONTENT_TYPES.subRegion] },
                        },
                        {
                            subRegion: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            retailSegment: { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
                        },
                        {
                            retailSegment: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            outlet: { $in: queryFilter[CONTENT_TYPES.OUTLET] },
                        },
                        {
                            outlet: { $in: [] },
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            branch: { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                        },
                        {
                            branch: { $in: [] },
                        },
                    ],
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

        pipeline.push({
            $unwind: '$questions',
        });

        pipeline.push({
            $lookup: {
                from: 'consumersSurveyAnswers',
                localField: 'questions._id',
                foreignField: 'questionId',
                as: 'answers',
            },
        });

        pipeline.push({
            $unwind: {
                path: '$answers',
                preserveNullAndEmptyArrays: true,
            },
        });


        if (queryFilter.gender && queryFilter.gender.length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            'answers.customer.gender': {
                                $in: queryFilter.gender,
                            },
                        },
                        {
                            answers: {
                                $eq: null,
                            },
                        },
                    ],
                },
            });
        }

        if (queryFilter.nationality && queryFilter.nationality.length) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            'answers.customer.nationality.name.en': {
                                $in: queryFilter.nationality,
                            },
                        },
                        {
                            'answers.customer.nationality.name.ar': {
                                $in: queryFilter.nationality,
                            },
                        },
                        {
                            answers: {
                                $eq: null,
                            },
                        },
                    ],
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
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        });

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
                    date: '$consumer.createdBy.date',
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
                from: 'positions',
                localField: 'createdBy.user.position',
                foreignField: '_id',
                as: 'createdBy.user.position',
            },
        });

        pipeline.push({
            $addFields: {
                publisherPosition: {
                    $let: {
                        vars: {
                            position: {
                                $arrayElemAt: [
                                    '$createdBy.user.position',
                                    0,
                                ],
                            },
                        },
                        in: {
                            _id: '$$position._id',
                            name: '$$position.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                status: 1,
                createdBy: 1,
                questions: 1,
                countAnswered: 1,
                branch: '$branch.name.en',
                outlet: '$outlet.name.en',
                retailSegment: '$retailSegment.name.en',
                subRegion: '$subRegion.name.en',
                region: '$region.name.en',
                country: '$country.name.en',
                startDate: '$startDate',
                dueDate: '$dueDate',
                title: 1,
                publisherPosition: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: '$_id',
                countAnswered: { $first: '$countAnswered' },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                branch: { $first: '$branch' },
                startDate: { $first: '$startDate' },
                dueDate: { $first: '$dueDate' },
                status: { $first: '$status' },
                publisherPosition: { $first: '$publisherPosition' },
                createdBy: { $first: '$createdBy' },
                title: { $first: '$title' },
            },
        });

        pipeline.push({
            $addFields: {
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
                            $concat: [
                                '$$country',
                                {
                                    $let: {
                                        vars: {
                                            region: '$$region',
                                        },
                                        in: {
                                            $cond: {
                                                if: { $not: ['$$region'] },
                                                then: '',
                                                else: {
                                                    $concat: [
                                                        '->',
                                                        '$$region',
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                {
                                    $let: {
                                        vars: {
                                            subRegion: '$$subRegion',
                                        },
                                        in: {
                                            $cond: {
                                                if: { $not: ['$$subRegion'] },
                                                then: '',
                                                else: {
                                                    $concat: [
                                                        '->',
                                                        '$$subRegion',
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                {
                                    $let: {
                                        vars: {
                                            retailSegment: '$$retailSegment',
                                        },
                                        in: {
                                            $cond: {
                                                if: { $not: ['$$retailSegment'] },
                                                then: '',
                                                else: {
                                                    $concat: [
                                                        '->',
                                                        '$$retailSegment',
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                {
                                    $let: {
                                        vars: {
                                            outlet: '$$outlet',
                                        },
                                        in: {
                                            $cond: {
                                                if: { $not: ['$$outlet'] },
                                                then: '',
                                                else: {
                                                    $concat: [
                                                        '->',
                                                        '$$outlet',
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                {
                                    $let: {
                                        vars: {
                                            branch: '$$branch',
                                        },
                                        in: {
                                            $cond: {
                                                if: { $not: ['$$branch'] },
                                                then: '',
                                                else: {
                                                    $concat: [
                                                        '->',
                                                        '$$branch',
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        });

        ConsumersSurveyModel.aggregate(pipeline)
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

        const anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        /* eslint-disable */
        const verstka = `
            <table>
                <thead>
                    <tr>
                        <th>Location</th>
                        <th>Publisher</th>
                        <th>Position</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Answers number</th>
                        <th>Start date</th>
                        <th>Due date</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        return `
                            <tr>
                                <td>${sanitizeHtml(item.location)}</td>
                                <td>${item.createdBy.user.name[currentLanguage] || item.createdBy.user.name[anotherLanguage]}</td>
                                <td>${item.publisherPosition.name[currentLanguage] || item.publisherPosition.name[anotherLanguage]}</td>
                                <td>${sanitizeHtml(item.title[currentLanguage]) || sanitizeHtml(item.title[anotherLanguage])}</td>
                                <td>${item.status}</td>
                                <td>${item.countAnswered}</td>
                                <td>${item.startDate}</td>
                                <td>${item.dueDate}</td>
                            </tr>
                                `;
                    }).join('')}
                </tbody>
            </table>
        `;
        /* eslint-enable */

        conversion(verstka, (err, stream) => {
            if (err) {
                return next(err);
            }

            const bufs = [];

            stream.on('data', (data) => {
                bufs.push(data);
            });

            stream.on('end', () => {
                const buf = Buffer.concat(bufs);

                res.set({
                    'Content-Type': 'application/vnd.ms-excel',
                    'Content-Disposition': `attachment; filename="consumerSurveyReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
