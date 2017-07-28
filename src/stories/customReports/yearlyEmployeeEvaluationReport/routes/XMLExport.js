const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PersonnelModel = require('./../../../../types/personnel/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const OTHER_CONSTANTS = require('./../../../../public/js/constants/otherConstants');
const locationFiler = require('./../../utils/locationFilter');
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
            CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.POSITION, 'publisher',
        ];

        currentLanguage = personnel.currentLanguage || 'en';

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

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    _id: {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    position: {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        locationFiler(pipeline, personnel, queryFilter);

        pipeline.push({
            $lookup: {
                from: 'biYearlies',
                localField: '_id',
                foreignField: 'personnel',
                as: 'evaluations',
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
                _id: 1,
                name: {
                    en: {
                        $concat: ['$firstName.en', ' ', '$lastName.en'],
                    },
                    ar: {
                        $concat: ['$firstName.ar', ' ', '$lastName.ar'],
                    },
                },
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: '$branch.retailSegment',
                outlet: '$branch.outlet',
                branch: {
                    _id: 1,
                    name: 1,
                    retailSegment: 1,
                    outlet: 1,
                    subRegion: 1,
                },
                personnel: 1,
                position: 1,
                evaluations: {
                    _id: 1,
                    rating: 1,
                    personalSkills: 1,
                    sellingSkills: 1,
                    reporting: 1,
                    planningAndOrganizationSkills: 1,
                    overallPerformance: 1,
                    year: 1,
                    month: 1,
                    createdBy: 1,
                },
            },
        });

        pipeline.push({
            $unwind: '$evaluations',
        });

        const $timeMatch = {};
        $timeMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$or.push({
                    $and: [
                        {
                            'evaluations.createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'evaluations.createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
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
            $addFields: {
                personalSkills: '$evaluations.personalSkills.result',
                sellingSkills: '$evaluations.sellingSkills.result',
                reporting: '$evaluations.reporting.result',
                planningAndOrganizationSkills: '$evaluations.planningAndOrganizationSkills.result',
                overallPerformance: '$evaluations.overallPerformance',
                publisher: '$evaluations.createdBy.user',
                rating: '$evaluations.rating',
                year: '$evaluations.year',
                month: '$evaluations.month',
                skillsRate: {
                    $divide: [
                        {
                            $add: ['$evaluations.personalSkills.result', '$evaluations.sellingSkills.result', '$evaluations.reporting.result', '$evaluations.planningAndOrganizationSkills.result'],
                        },
                        4,
                    ],
                },
            },
        });

        if (queryFilter.publisher && queryFilter.publisher.length) {
            pipeline.push({
                $match: {
                    publisher: {
                        $in: queryFilter.publisher,
                    },
                },
            });
        }

        if (queryFilter.overallPerformance && queryFilter.overallPerformance.length) {
            pipeline.push({
                $match: {
                    overallPerformance: {
                        $in: queryFilter.overallPerformance,
                    },
                },
            });
        }

        if (queryFilter.skillsRate) {
            pipeline.push({
                $match: {
                    skillsRate: {
                        $gte: parseInt(queryFilter.skillsRate, 10),
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    retailSegment: {
                        $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    outlet: {
                        $in: queryFilter[CONTENT_TYPES.OUTLET],
                    },
                },
            });
        }

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
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
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

                personalSkills: 1,
                sellingSkills: 1,
                reporting: 1,
                planningAndOrganizationSkills: 1,
                overallPerformance: 1,
                year: 1,
                month: 1,
                rating: 1,
                country: {
                    $reduce: {
                        input: { $setDifference: ['$country', [{ $arrayElemAt: ['$country', 0] }]] },
                        initialValue: {
                            $let: {
                                vars: {
                                    country: { $arrayElemAt: ['$country', 0] },
                                },
                                in: {
                                    en: { $ifNull: ['$$country.name.en', 'null'] },
                                    ar: { $ifNull: ['$$country.name.ar', 'null'] },
                                },
                            },
                        },
                        in: {
                            en: { $concat: ['$$value.en', ', ', { $ifNull: ['$$this.name.en', 'null'] }], },
                            ar: { $concat: ['$$value.ar', ', ', { $ifNull: ['$$this.name.ar', 'null'] }], },
                        },
                    },
                },
                region: {
                    $reduce: {
                        input: { $setDifference: ['$region', [{ $arrayElemAt: ['$region', 0] }]] },
                        initialValue: {
                            $let: {
                                vars: {
                                    region: { $arrayElemAt: ['$region', 0] },
                                },
                                in: {
                                    en: { $ifNull: ['$$region.name.en', 'null'] },
                                    ar: { $ifNull: ['$$region.name.ar', 'null'] },
                                },
                            },
                        },
                        in: {
                            en: { $concat: ['$$value.en', ', ', { $ifNull: ['$$this.name.en', 'null'] }], },
                            ar: { $concat: ['$$value.ar', ', ', { $ifNull: ['$$this.name.ar', 'null'] }], },
                        },
                    },
                },
                subRegion: {
                    $reduce: {
                        input: { $setDifference: ['$subRegion', [{ $arrayElemAt: ['$subRegion', 0] }]] },
                        initialValue: {
                            $let: {
                                vars: {
                                    subRegion: { $arrayElemAt: ['$subRegion', 0] },
                                },
                                in: {
                                    en: { $ifNull: ['$$subRegion.name.en', 'null'] },
                                    ar: { $ifNull: ['$$subRegion.name.ar', 'null'] },
                                },
                            },
                        },
                        in: {
                            en: { $concat: ['$$value.en', ', ', { $ifNull: ['$$this.name.en', 'null'] }], },
                            ar: { $concat: ['$$value.ar', ', ', { $ifNull: ['$$this.name.ar', 'null'] }], },
                        },
                    },
                },
                retailSegment: {
                    $reduce: {
                        input: { $setDifference: ['$retailSegment', [{ $arrayElemAt: ['$retailSegment', 0] }]] },
                        initialValue: {
                            $let: {
                                vars: {
                                    retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                                },
                                in: {
                                    en: { $ifNull: ['$$retailSegment.name.en', 'null'] },
                                    ar: { $ifNull: ['$$retailSegment.name.ar', 'null'] },
                                },
                            },
                        },
                        in: {
                            en: { $concat: ['$$value.en', ', ', { $ifNull: ['$$this.name.en', 'null'] }], },
                            ar: { $concat: ['$$value.ar', ', ', { $ifNull: ['$$this.name.ar', 'null'] }], },
                        },
                    },
                },
                outlet: {
                    $reduce: {
                        input: { $setDifference: ['$outlet', [{ $arrayElemAt: ['$outlet', 0] }]] },
                        initialValue: {
                            $let: {
                                vars: {
                                    outlet: { $arrayElemAt: ['$outlet', 0] },
                                },
                                in: {
                                    en: { $ifNull: ['$$outlet.name.en', 'null'] },
                                    ar: { $ifNull: ['$$outlet.name.ar', 'null'] },
                                },
                            },
                        },
                        in: {
                            en: { $concat: ['$$value.en', ', ', { $ifNull: ['$$this.name.en', 'null'] }], },
                            ar: { $concat: ['$$value.ar', ', ', { $ifNull: ['$$this.name.ar', 'null'] }], },
                        },
                    },
                },
                branch: {
                    $reduce: {
                        input: { $setDifference: ['$branch', [{ $arrayElemAt: ['$branch', 0] }]] },
                        initialValue: {
                            $let: {
                                vars: {
                                    branch: { $arrayElemAt: ['$branch', 0] },
                                },
                                in: {
                                    en: { $ifNull: ['$$branch.name.en', 'null'] },
                                    ar: { $ifNull: ['$$branch.name.ar', 'null'] },
                                },
                            },
                        },
                        in: {
                            en: { $concat: ['$$value.en', ', ', { $ifNull: ['$$this.name.en', 'null'] }], },
                            ar: { $concat: ['$$value.ar', ', ', { $ifNull: ['$$this.name.ar', 'null'] }], },
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
            },
        });

        PersonnelModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.PERSONNEL, cb);
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
                        <th>Trade Channel</th>
                        <th>Outlet</th>
                        <th>Branch</th>
                        <th>Personnel</th>
                        <th>Position</th>
                        <th>Personal Skills</th>
                        <th>Selling Skills</th>
                        <th>Reporting</th>
                        <th>Planning And Organization Skills</th>
                        <th>Overall Performance</th>
                        <th>Rating</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
            return `
                            <tr>
                                <td>${item.country[currentLanguage] || item.country[anotherLanguage]}</td>
                                <td>${item.region[currentLanguage] || item.region[anotherLanguage]}</td>
                                <td>${item.subRegion[currentLanguage] || item.subRegion[anotherLanguage]}</td>
                                <td>${item.retailSegment[currentLanguage] || item.retailSegment[anotherLanguage]}</td>
                                <td>${item.outlet[currentLanguage] || item.outlet[anotherLanguage]}</td>
                                <td>${item.branch[currentLanguage] || item.branch[anotherLanguage]}</td>
                                <td>${item.name[currentLanguage] || item.name[anotherLanguage]}</td>
                                <td>${item.position.name[currentLanguage] || item.position.name[anotherLanguage]}</td>
                                <td>${item.personalSkills.toFixed(2)}</td>
                                <td>${item.sellingSkills.toFixed(2)}</td>
                                <td>${item.reporting.toFixed(2)}</td>
                                <td>${item.planningAndOrganizationSkills.toFixed(2)}</td>
                                <td>${OTHER_CONSTANTS.RATING_BIYEARLY.find((rating) => rating._id === item.overallPerformance).name[currentLanguage]}</td>
                                <td>${item.rating}</td>
                                <td>${moment(item.month, 'MM').format('MMMM') + ' ' + item.year}</td>
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
                    'Content-Disposition': `attachment; filename="employeeEvaluationReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
