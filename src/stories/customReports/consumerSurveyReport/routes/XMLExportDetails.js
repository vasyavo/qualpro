const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ConsumersSurveyAnswersModel = require('./../../../../types/consumersSurveyAnswers/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const sanitizeHtml = require('./../../utils/sanitizeHtml');
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
    let currentLanguage;

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION,
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

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    branch: { $in: queryFilter[CONTENT_TYPES.BRANCH] },
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
                consumer: {
                    $let: {
                        vars: {
                            consumer: { $arrayElemAt: ['$consumer', 0] },
                        },
                        in: {
                            title: '$$consumer.title',
                            questions: '$$consumer.questions',
                            status: '$$consumer.status',
                            createdBy: '$$consumer.createdBy',
                            countAnswered: '$$consumer.countAnswered',
                            startDate: '$$consumer.startDate',
                            dueDate: '$$consumer.dueDate',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    'consumer.createdBy.user': {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'consumer.createdBy.user',
                foreignField: '_id',
                as: 'consumer.createdBy.user',
            },
        });

        pipeline.push({
            $addFields: {
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ['$consumer.createdBy.user', 0] },
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
            $match: {
                'consumer.status': {
                    $ne: 'draft',
                },
            },
        });

        if (queryFilter.status && queryFilter.status.length) {
            pipeline.push({
                $match: {
                    'consumer.status': { $in: queryFilter.status },
                },
            });
        }

        pipeline.push({
            $project: {
                title: '$consumer.title',
                author: '$createdBy.user',
                status: '$consumer.status',
                numberOfRespondents: '$consumer.countAnswered',
                startDate: { $dateToString: { format: '%m/%d/%Y', date: '$consumer.startDate' } },
                dueDate: { $dateToString: { format: '%m/%d/%Y', date: '$consumer.dueDate' } },
                name: '$customer.name',
                nationality: '$customer.nationality.name',
                gender: '$customer.gender',
                question: {
                    $let: {
                        vars: {
                            question: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: '$consumer.questions',
                                            as: 'question',
                                            cond: {
                                                $eq: ['$$question._id', '$questionId'],
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                        in: {
                            text: '$$question.title',
                            answer: {
                                $cond: {
                                    if: { $eq: ['$type', 'fullAnswer'] },
                                    then: ['$text'],
                                    else: {
                                        $map: {
                                            input: '$optionIndex',
                                            as: 'index',
                                            in: {
                                                $arrayElemAt: ['$$question.options', { $subtract: ['$$index', 1] }],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                country: '$region.parent',
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
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
            $addFields: {
                country: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                        },
                        in: {
                            _id: '$$country._id',
                            name: '$$country.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $sort: {
                'country.name.en': 1,
                'region.name.en': 1,
                'subRegion.name.en': 1,
                'retailSegment.name.en': 1,
                'outlet.name.en': 1,
                'branch.name.en': 1,
                'title.en': 1,
                'nationality.en': 1,
                gender: 1,
                'name.en': 1,
                'question.text.en': 1,
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

        const anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        /* eslint-disable */
        const verstka = `
            <table>
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Region</th>
                        <th>Sub Region</th>
                        <th>Trade channel</th>
                        <th>Outlet</th>
                        <th>Branch</th>
                        <th>Author</th>
                        <th>Status</th>
                        <th>Number of respondents</th>
                        <th>Start date</th>
                        <th>End date</th>
                        <th>Consumer survey name</th>
                        <th>Customer name</th>
                        <th>Nationality</th>
                        <th>Gender</th>
                        <th>Question</th>
                        <th>Answer</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        return `
                            <tr>
                                <td>${item.country.name[currentLanguage] || item.country.name[anotherLanguage] }</td>
                                <td>${item.region.name[currentLanguage] || item.region.name[anotherLanguage] }</td>
                                <td>${item.subRegion.name[currentLanguage] || item.subRegion.name[anotherLanguage] }</td>
                                <td>${item.retailSegment.name[currentLanguage] || item.retailSegment.name[anotherLanguage] }</td>
                                <td>${item.outlet.name[currentLanguage] || item.outlet.name[anotherLanguage] }</td>
                                <td>${item.branch.name[currentLanguage] || item.branch.name[anotherLanguage] }</td>
                                <td>${item.author.name[currentLanguage] || item.author.name[anotherLanguage] }</td>
                                <td>${item.status}</td>
                                <td>${item.numberOfRespondents}</td>
                                <td>${item.startDate}</td>
                                <td>${item.dueDate}</td>
                                <td>${item.title[currentLanguage] || item.title[anotherLanguage]}</td>
                                <td>${item.name}</td>
                                <td>${item.nationality[currentLanguage] || item.nationality[anotherLanguage]}</td>
                                <td>${item.gender}</td>
                                <td>${sanitizeHtml(item.question.text[currentLanguage] || item.question.text[anotherLanguage])}</td>
                                <td>${sanitizeHtml(item.question.answer.map((item) => item[currentLanguage] || item[anotherLanguage]).join('; '))}</td>
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
                    'Content-Disposition': `attachment; filename="consumerSurveyDetailsReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
