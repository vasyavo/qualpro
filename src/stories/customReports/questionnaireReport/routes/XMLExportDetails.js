const conversion = require('./../../../../utils/conversionHtmlToXlsx');
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
    let currentLanguage;

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION, 'assignedTo', 'questionnaire',
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

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: _.union(queryFilter[CONTENT_TYPES.PERSONNEL], personnel._id),
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
            $project: {
                _id: 1,
                title: 1,
                answer: {
                    $map: {
                        input: '$answers',
                        as: 'answer',
                        in: {
                            country: '$$answer.country',
                            region: '$$answer.region',
                            subRegion: '$$answer.subRegion',
                            retailSegment: '$$answer.retailSegment',
                            outlet: '$$answer.outlet',
                            branch: '$$answer.branch',
                            personnel: '$$answer.personnelId',
                            question: {
                                $let: {
                                    vars: {
                                        questionObject: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$questions',
                                                        as: 'question',
                                                        cond: {
                                                            $eq: ['$$question._id', '$$answer.questionId'],
                                                        },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    },
                                    in: '$$questionObject.title',
                                },
                            },
                            answerText: {
                                $cond: {
                                    if: { $gt: ['$$answer.text', ''] },
                                    then: ['$$answer.text'],
                                    else: {
                                        $map: {
                                            input: '$$answer.optionIndex',
                                            as: 'answerIndex',
                                            in: {
                                                $let: {
                                                    vars: {
                                                        questionObject: {
                                                            $arrayElemAt: [
                                                                {
                                                                    $filter: {
                                                                        input: '$questions',
                                                                        as: 'question',
                                                                        cond: {
                                                                            $eq: ['$$question._id', '$$answer.questionId'],
                                                                        },
                                                                    },
                                                                },
                                                                0,
                                                            ],
                                                        },
                                                    },
                                                    in: {
                                                        $arrayElemAt: ['$$questionObject.options', '$$answerIndex'],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });


        pipeline.push({
            $unwind: {
                path: '$answer',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (queryFilter.assignedTo && queryFilter.assignedTo.length) {
            pipeline.push({
                $match: {
                    'answer.personnel': {
                        $in: _.union(queryFilter.assignedTo, personnel._id),
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'answer.personnel',
                foreignField: '_id',
                as: 'personnel',
            },
        });

        pipeline.push({
            $addFields: {
                personnel: {
                    $let: {
                        vars: {
                            personnel: { $arrayElemAt: ['$personnel', 0] },
                        },
                        in: {
                            _id: '$$personnel._id',
                            name: {
                                en: { $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] },
                                ar: { $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] },
                            },
                            position: '$$personnel.position',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'personnel.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push({
            $project: {
                total: 1,
                _id: 1,
                title: 1,
                country: '$answer.country',
                region: '$answer.region',
                subRegion: '$answer.subRegion',
                retailSegment: '$answer.retailSegment',
                outlet: '$answer.outlet',
                branch: '$answer.branch',
                personnel: '$personnel',
                question: '$answer.question',
                answer: { $arrayElemAt: ['$answer.answerText', 0] },
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
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
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
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                title: 1,
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
                region: {
                    $let: {
                        vars: {
                            region: { $arrayElemAt: ['$region', 0] },
                        },
                        in: {
                            _id: '$$region._id',
                            name: '$$region.name',
                        },
                    },
                },
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                        },
                        in: {
                            _id: '$$subRegion._id',
                            name: '$$subRegion.name',
                        },
                    },
                },
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
                branch: {
                    $let: {
                        vars: {
                            branch: { $arrayElemAt: ['$branch', 0] },
                        },
                        in: {
                            _id: '$$branch._id',
                            name: '$$branch.name',
                        },
                    },
                },
                personnel: 1,
                question: 1,
                answer: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'personnel.position',
                foreignField: '_id',
                as: 'position',
            },
        });

        pipeline.push({
            $addFields: {
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

        const anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        /* eslint-disable */
        const verstka = `
            <table>
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Region</th>
                        <th>Sub Region</th>
                        <th>Retail Segment</th>
                        <th>Outlet</th>
                        <th>Branch</th>
                        <th>Title</th>
                        <th>Question</th>
                        <th>Answer</th>
                        <th>Position</th>
                        <th>Personnel</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        return `
                            <tr>
                                <td>${item.country && item.country.name && item.country.name[currentLanguage] || 'N/A' }</td>
                                <td>${item.region && item.region.name && item.region.name[currentLanguage] || 'N/A' }</td>
                                <td>${item.subRegion && item.subRegion.name && item.subRegion.name[currentLanguage] || 'N/A' }</td>
                                <td>${item.retailSegment && item.retailSegment.name && item.retailSegment.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.outlet && item.outlet.name && item.outlet.name[currentLanguage] || 'N/A' }</td>
                                <td>${item.branch && item.branch.name && item.branch.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.title && item.title[currentLanguage] || 'N/A'}</td>
                                <td>${item.question && (item.question[currentLanguage] || item.question[anotherLanguage]) || 'N/A'}</td>
                                <td>${item.answer && (item.answer[currentLanguage] || item.answer[anotherLanguage]) || 'N/A'}</td>
                                <td>${item.position && item.position.name && item.position.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.personnel && item.personnel.name && item.personnel.name[currentLanguage] || 'N/A'}</td>
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
                    'Content-Disposition': `attachment; filename="questionnaireDetailsReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
