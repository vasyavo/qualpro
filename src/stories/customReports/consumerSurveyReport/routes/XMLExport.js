const conversion = require('./../../../../utils/conversionHtmlToXlsx');
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
                            status: '$$consumer.status',
                            title: '$$consumer.title',
                            createdBy: '$$consumer.createdBy',
                            countAnswered: '$$consumer.countAnswered',
                            startDate: '$$consumer.startDate',
                            dueDate: '$$consumer.dueDate',
                        },
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
            $lookup: {
                from: 'domains',
                localField: 'region.parent',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeline.push({
            $group: {
                _id: '$questionnaryId',
                createdBy: { $first: '$createdBy' },
                consumer: { $first: '$consumer' },
                country: {
                    $addToSet: {
                        $let: {
                            vars: {
                                country: { $arrayElemAt: ['$country', 0] },
                            },
                            in: '$$country.name.en',
                        },
                    },
                },
                region: {
                    $addToSet: '$region.name.en',
                },
                subRegion: {
                    $addToSet: '$subRegion.name.en',
                },
                retailSegment: {
                    $addToSet: '$retailSegment.name.en',
                },
                outlet: {
                    $addToSet: '$outlet.name.en',
                },
                branch: {
                    $addToSet: '$branch.name.en',
                },
            },
        });

        pipeline.push({
            $addFields: {
                location: {
                    $concat: [
                        {
                            $reduce: {
                                input: { $setDifference: ['$country', [{ $arrayElemAt: ['$country', 0] }]] },
                                initialValue: {
                                    $let: {
                                        vars: {
                                            country: { $arrayElemAt: ['$country', 0] },
                                        },
                                        in: {
                                            $ifNull: ['$$country', 'null'],
                                        },
                                    },
                                },
                                in: {
                                    $concat: ['$$value', ', ', { $ifNull: ['$$this', 'null'] }],
                                },
                            },
                        },
                        ' -> ',
                        {
                            $reduce: {
                                input: { $setDifference: ['$region', [{ $arrayElemAt: ['$region', 0] }]] },
                                initialValue: {
                                    $let: {
                                        vars: {
                                            region: { $arrayElemAt: ['$region', 0] },
                                        },
                                        in: {
                                            $ifNull: ['$$region', 'null'],
                                        },
                                    },
                                },
                                in: {
                                    $concat: ['$$value', ', ', { $ifNull: ['$$this', 'null'] }],
                                },
                            },
                        },
                        ' -> ',
                        {
                            $reduce: {
                                input: { $setDifference: ['$subRegion', [{ $arrayElemAt: ['$subRegion', 0] }]] },
                                initialValue: {
                                    $let: {
                                        vars: {
                                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                                        },
                                        in: {
                                            $ifNull: ['$$subRegion', 'null'],
                                        },
                                    },
                                },
                                in: {
                                    $concat: ['$$value', ', ', { $ifNull: ['$$this', 'null'] }],
                                },
                            },
                        },
                        ' -> ',
                        {
                            $reduce: {
                                input: { $setDifference: ['$retailSegment', [{ $arrayElemAt: ['$retailSegment', 0] }]] },
                                initialValue: {
                                    $let: {
                                        vars: {
                                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                                        },
                                        in: {
                                            $ifNull: ['$$retailSegment', 'null'],
                                        },
                                    },
                                },
                                in: {
                                    $concat: ['$$value', ', ', { $ifNull: ['$$this', 'null'] }],
                                },
                            },
                        },
                        ' -> ',
                        {
                            $reduce: {
                                input: { $setDifference: ['$outlet', [{ $arrayElemAt: ['$outlet', 0] }]] },
                                initialValue: {
                                    $let: {
                                        vars: {
                                            outlet: { $arrayElemAt: ['$outlet', 0] },
                                        },
                                        in: {
                                            $ifNull: ['$$outlet', 'null'],
                                        },
                                    },
                                },
                                in: {
                                    $concat: ['$$value', ', ', { $ifNull: ['$$this', 'null'] }],
                                },
                            },
                        },
                        ' -> ',
                        {
                            $reduce: {
                                input: { $setDifference: ['$branch', [{ $arrayElemAt: ['$branch', 0] }]] },
                                initialValue: {
                                    $let: {
                                        vars: {
                                            branch: { $arrayElemAt: ['$branch', 0] },
                                        },
                                        in: {
                                            $ifNull: ['$$branch', 'null'],
                                        },
                                    },
                                },
                                in: {
                                    $concat: ['$$value', ', ', { $ifNull: ['$$this', 'null'] }],
                                },
                            },
                        },
                    ],
                },
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                location: 1,
                status: '$consumer.status',
                title: '$consumer.title',
                publisher: '$createdBy.user',
                countAnswered: '$consumer.countAnswered',
                startDate: { $dateToString: { format: '%m/%d/%Y', date: '$consumer.startDate' } },
                dueDate: { $dateToString: { format: '%m/%d/%Y', date: '$consumer.dueDate' } },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'publisher.position',
                foreignField: '_id',
                as: 'publisher.position',
            },
        });

        pipeline.push({
            $addFields: {
                publisher: {
                    name: '$publisher.name',
                    position: {
                        $let: {
                            vars: {
                                position: { $arrayElemAt: ['$publisher.position', 0] },
                            },
                            in: {
                                _id: '$$position._id',
                                name: '$$position.name',
                            },
                        },
                    },
                },
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
                                <td>${item.publisher.name[currentLanguage] || item.publisher.name[anotherLanguage]}</td>
                                <td>${item.publisher.position.name[currentLanguage] || item.publisher.position.name[anotherLanguage]}</td>
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
