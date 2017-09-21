const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ConsumersSurveyModel = require('./../../../../types/consumersSurvey/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const sanitizeHtml = require('./../../utils/sanitizeHtml');
const moment = require('moment');

const ajv = new Ajv();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const timeFilterSchema = {
        type      : 'object',
        properties: {
            timeFrames: {
                type : 'array',
                items: {
                    from    : {
                        type: 'string',
                    },
                    to      : {
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
        const pipeline = [{
            $match: {
                status: {
                    $ne: 'draft',
                },
            },
        }];

        if (queryFilter.status && queryFilter.status.length) {
            pipeline.push({
                $match: {
                    status: {$in: queryFilter.status},
                },
            });
        }

        currentLanguage = personnel.currentLanguage || 'en';

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({timeFrames: timeFilter});

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

        const $timeMatch = {};
        $timeMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$or.push({
                    $and: [
                        {
                            'createdBy.date': {$gt: moment(frame.from, 'MM/DD/YYYY')._d},
                        },
                        {
                            'createdBy.date': {$lt: moment(frame.to, 'MM/DD/YYYY')._d},
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

        if (queryFilter.title && queryFilter.title.length) {
            pipeline.push({
                $match: {
                    _id: {$in: queryFilter.title},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    branch: {
                        $in: queryFilter[CONTENT_TYPES.BRANCH],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    subRegion: {$in: queryFilter[CONTENT_TYPES.SUBREGION]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    retailSegment: {$in: queryFilter[CONTENT_TYPES.RETAILSEGMENT]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    outlet: {$in: queryFilter[CONTENT_TYPES.OUTLET]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    region: {$in: queryFilter[CONTENT_TYPES.REGION]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    country: {$in: queryFilter[CONTENT_TYPES.COUNTRY]},
                },
            });
        }

        pipeline.push(...[{
            $unwind: {
                path: '$questions',
            },
        }, {
            $lookup: {
                from        : 'consumersSurveyAnswers',
                localField  : 'questions._id',
                foreignField: 'questionId',
                as          : 'answers',
            },
        }, {
            $unwind: {
                path                      : '$answers',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from        : 'branches',
                localField  : 'answers.branch',
                foreignField: '_id',
                as          : 'branch',
            },
        }, {
            $addFields: {
                branch: {
                    $let: {
                        vars: {
                            branch: {
                                $arrayElemAt: [
                                    '$branch',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id          : '$$branch._id',
                            name         : '$$branch.name',
                            retailSegment: '$$branch.retailSegment',
                            outlet       : '$$branch.outlet',
                            subRegion    : '$$branch.subRegion',
                        },
                    },
                },
            },
        }]);

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        branch: {$in: queryFilter[CONTENT_TYPES.BRANCH]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        if (queryFilter.gender && queryFilter.gender.length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'answers.customer.gender': {
                            $in: queryFilter.gender,
                        },
                    }, {
                        answers: null,
                    }],
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
                        }, {
                            'answers.customer.nationality.name.ar': {
                                $in: queryFilter.nationality,
                            },
                        }, {
                            answers: null,
                        },
                    ],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.subRegion': {$in: queryFilter[CONTENT_TYPES.SUBREGION]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.retailSegment': {$in: queryFilter[CONTENT_TYPES.RETAILSEGMENT]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.outlet': {$in: queryFilter[CONTENT_TYPES.OUTLET]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        pipeline.push(...[{
            $lookup: {
                from        : 'retailSegments',
                localField  : 'branch.retailSegment',
                foreignField: '_id',
                as          : 'retailSegment',
            },
        }, {
            $addFields: {
                retailSegment: {
                    $let: {
                        vars: {
                            retailSegment: {
                                $arrayElemAt: [
                                    '$retailSegment',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id : '$$retailSegment._id',
                            name: '$$retailSegment.name',
                        },
                    },
                },
            },
        }, {
            $lookup: {
                from        : 'outlets',
                localField  : 'branch.outlet',
                foreignField: '_id',
                as          : 'outlet',
            },
        }, {
            $addFields: {
                outlet: {
                    $let: {
                        vars: {
                            outlet: {
                                $arrayElemAt: [
                                    '$outlet',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id : '$$outlet._id',
                            name: '$$outlet.name',
                        },
                    },
                },
            },
        }, {
            $lookup: {
                from        : 'domains',
                localField  : 'branch.subRegion',
                foreignField: '_id',
                as          : 'subRegion',
            },
        }, {
            $addFields: {
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: {
                                $arrayElemAt: [
                                    '$subRegion',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id   : '$$subRegion._id',
                            name  : '$$subRegion.name',
                            parent: '$$subRegion.parent',
                        },
                    },
                },
            },
        }]);

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'subRegion.parent': {$in: queryFilter[CONTENT_TYPES.REGION]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        pipeline.push(...[{
            $lookup: {
                from        : 'domains',
                localField  : 'subRegion.parent',
                foreignField: '_id',
                as          : 'region',
            },
        }, {
            $addFields: {
                region: {
                    $let: {
                        vars: {
                            region: {
                                $arrayElemAt: [
                                    '$region',
                                    0,
                                ],
                            },
                        },
                        in  : {
                            _id   : '$$region._id',
                            name  : '$$region.name',
                            parent: '$$region.parent',
                        },
                    },
                },
            },
        }]);

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'region.parent': {$in: queryFilter[CONTENT_TYPES.COUNTRY]},
                    }, {
                        answers: null,
                    }],
                },
            });
        }

        pipeline.push(...[{
            $lookup: {
                from        : 'personnels',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user',
            },
        }, {
            $addFields: {
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: {$arrayElemAt: ['$createdBy.user', 0]},
                            },
                            in  : {
                                _id     : '$$user._id',
                                name    : {
                                    en: {$concat: ['$$user.firstName.en', ' ', '$$user.lastName.en']},
                                    ar: {$concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar']},
                                },
                                position: '$$user.position',
                            },
                        },
                    },
                    date: '$createdBy.date',
                },
            },
        }]);

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
                from        : 'domains',
                localField  : 'region.parent',
                foreignField: '_id',
                as          : 'country',
            },
        });

        pipeline.push({
            $project: {
                title              : {
                    $ifNull: ['$title', 'N/A'],
                },
                author             : '$createdBy.user',
                status             : 1,
                numberOfRespondents: '$countAnswered',
                startDate          : {
                    $dateToString: {
                        format: '%m/%d/%Y',
                        date  : '$startDate',
                    },
                },
                dueDate            : {
                    $dateToString: {
                        format: '%m/%d/%Y',
                        date  : '$dueDate',
                    },
                },
                name               : {
                    $ifNull: ['$answers.customer.name', 'N/A'],
                },
                nationality        : {
                    $ifNull: [
                        '$answers.customer.nationality.name', {
                            en: 'N/A',
                            ar: 'N/A',
                        },
                    ],
                },
                gender             : {
                    $ifNull: ['$answers.customer.gender', 'N/A'],
                },
                question           : {
                    text  : '$questions.title',
                    answer: {
                        $cond: {
                            if  : {
                                $eq: [
                                    '$answers.type',
                                    'fullAnswer',
                                ],
                            },
                            then: [
                                '$answers.text',
                            ],
                            else: {
                                $map: {
                                    input: '$answers.optionIndex',
                                    as   : 'index',
                                    in   : {
                                        $arrayElemAt: [
                                            '$questions.options',
                                            {
                                                $subtract: [
                                                    '$$index',
                                                    1,
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                country            : {
                    $let: {
                        vars: {
                            country: {$arrayElemAt: ['$country', 0]},
                        },
                        in  : {
                            _id : '$$country._id',
                            name: '$$country.name',
                        },
                    },
                },
                region             : {
                    $cond: [
                        {$eq: ['$region', {}]},
                        {
                            name: {
                                en: 'N/A',
                                ar: 'N/A',
                            },
                        },
                        '$region',
                    ],
                },
                subRegion          : {
                    $cond: [
                        {$eq: ['$subRegion', {}]},
                        {
                            name: {
                                en: 'N/A',
                                ar: 'N/A',
                            },
                        },
                        '$subRegion',
                    ],
                },
                retailSegment      : {
                    $cond: [
                        {$eq: ['$retailSegment', {}]},
                        {
                            name: {
                                en: 'N/A',
                                ar: 'N/A',
                            },
                        },
                        '$retailSegment',
                    ],
                },
                outlet             : {
                    $cond: [
                        {$eq: ['$outlet', {}]},
                        {
                            name: {
                                en: 'N/A',
                                ar: 'N/A',
                            },
                        },
                        '$outlet',
                    ],
                },
                branch             : {
                    $cond: [
                        {$eq: ['$branch', {}]},
                        {
                            name: {
                                en: 'N/A',
                                ar: 'N/A',
                            },
                        },
                        '$branch',
                    ],
                },
            },
        });

        pipeline.push({
            $addFields: {
                'question.answer': {
                    $ifNull: [
                        '$question.answer',
                        [
                            {
                                en: 'N/A',
                                ar: 'N/A',
                            },
                        ],
                    ],
                },
                country          : {
                    $cond: [
                        {$eq: ['$country', {}]},
                        {
                            name: {
                                en: 'N/A',
                                ar: 'N/A',
                            },
                        },
                        '$country',
                    ],
                },
            },
        });

        pipeline.push({
            $sort: {
                'country.name.en'      : 1,
                'region.name.en'       : 1,
                'subRegion.name.en'    : 1,
                'retailSegment.name.en': 1,
                'outlet.name.en'       : 1,
                'branch.name.en'       : 1,
                'title.en'             : 1,
                'nationality.en'       : 1,
                gender                 : 1,
                'name.en'              : 1,
                'question.text.en'     : 1,
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
                    'Content-Type'       : 'application/vnd.ms-excel',
                    'Content-Disposition': `attachment; filename="consumerSurveyDetailsReportExport_${new Date()}.xls"`,
                    'Content-Length'     : buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
