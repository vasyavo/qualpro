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
        const query = req.query;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION, 'assignedTo',
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

        if (queryFilter.questionnaireTitle && queryFilter.questionnaireTitle.length) {
            $generalMatch.$and.push({
                $or: [
                    {
                        'title.en': { $in: queryFilter.questionnaireTitle },
                    },
                    {
                        'title.ar': { $in: queryFilter.questionnaireTitle },
                    },
                ],
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
            $addFields: {
                answeredPersonnels: null,
                answers: null,
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
            $lookup: {
                from: 'positions',
                localField: 'createdBy.user.position',
                foreignField: '_id',
                as: 'position',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'personnels',
                foreignField: '_id',
                as: 'personnels',
            },
        });

        pipeline.push({
            $project: {
                status: '$status',
                createdBy: '$createdBy',
                countAnswered: '$countAnswered',
                countBranches: '$countBranches',
                countAll: '$countAll',
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
                country: `$country.name.${currentLanguage}`,
                region: `$region.name.${currentLanguage}`,
                subRegion: `$subRegion.name.${currentLanguage}`,
                retailSegment: `$retailSegment.name.${currentLanguage}`,
                outlet: `$outlet.name.${currentLanguage}`,
                branch: `$branch.name.${currentLanguage}`,
                assignedTo: {
                    $reduce: {
                        input: '$personnels',
                        initialValue: [],
                        in: {
                            $concatArrays: ['$$value', [{
                                $concat: [`$$this.firstName.${currentLanguage}`, ' ', `$$this.lastName.${currentLanguage}`],
                            }]],
                        },
                    },
                },
                dueDate: '$dueDate',
                title: '$title',
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
                        <th>Assigned By</th>
                        <th>Assigned To</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Count Answered</th>
                        <th>Count Branches</th>
                        <th>Count All</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        return `
                            <tr>
                                <td>${item.country && item.country.length ? item.country.join(', ') : ''}</td>
                                <td>${item.region && item.region.length ? item.region.join(', ') : ''}</td>
                                <td>${item.subRegion && item.subRegion.length ? item.subRegion.join(', ') : ''}</td>
                                <td>${item.retailSegment && item.retailSegment.length ? item.retailSegment.join(', ') : ''}</td>
                                <td>${item.outlet && item.outlet.length ? item.outlet.join(', ') : ''}</td>
                                <td>${item.branch && item.branch.length ? item.branch.join(', ') : ''}</td>
                                <td>${item.createdBy.user.name[currentLanguage] + ', ' + item.position.name[currentLanguage]}</td>
                                <td>${item.assignedTo && item.assignedTo.length ? item.assignedTo.join(', ') : ''}</td>
                                <td>${item.title[currentLanguage]}</td>
                                <td>${item.status}</td>
                                <td>${item.countAnswered}</td>
                                <td>${item.countBranches}</td>
                                <td>${item.countAll}</td>
                                <td>${moment(item.dueDate).format('DD MMMM, YYYY')}</td>
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
                    'Content-Disposition': `attachment; filename="questionnaireReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
