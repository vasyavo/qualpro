const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const ObjectiveModel = require('./../../../../types/objective/model');
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
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
            },
        });

        pipeline.push({
            $project: {
                title: '$title',
                createdBy: '$createdBy',
                description: '$description',
                status: '$status',
                dateStart: '$dateStart',
                dateEnd: '$dateEnd',
                priority: '$priority',
                form: '$form',
                country: {
                    $reduce: {
                        input: '$country',
                        initialValue: { en: [], ar: [] },
                        in: {
                            en: { $concatArrays: [['$$this.name.en'], '$$value.en'] },
                            ar: { $concatArrays: [['$$this.name.ar'], '$$value.ar'] },
                        },
                    },
                },
                region: {
                    $reduce: {
                        input: '$region',
                        initialValue: { en: [], ar: [] },
                        in: {
                            en: { $concatArrays: [['$$this.name.en'], '$$value.en'] },
                            ar: { $concatArrays: [['$$this.name.ar'], '$$value.ar'] },
                        },
                    },
                },
                subRegion: {
                    $reduce: {
                        input: '$subRegion',
                        initialValue: { en: [], ar: [] },
                        in: {
                            en: { $concatArrays: [['$$this.name.en'], '$$value.en'] },
                            ar: { $concatArrays: [['$$this.name.ar'], '$$value.ar'] },
                        },
                    },
                },
                retailSegment: {
                    $reduce: {
                        input: '$retailSegment',
                        initialValue: { en: [], ar: [] },
                        in: {
                            en: { $concatArrays: [['$$this.name.en'], '$$value.en'] },
                            ar: { $concatArrays: [['$$this.name.ar'], '$$value.ar'] },
                        },
                    },
                },
                outlet: {
                    $reduce: {
                        input: '$outlet',
                        initialValue: { en: [], ar: [] },
                        in: {
                            en: { $concatArrays: [['$$this.name.en'], '$$value.en'] },
                            ar: { $concatArrays: [['$$this.name.ar'], '$$value.ar'] },
                        },
                    },
                },
                branch: {
                    $reduce: {
                        input: '$branch',
                        initialValue: { en: [], ar: [] },
                        in: {
                            en: { $concatArrays: [['$$this.name.en'], '$$value.en'] },
                            ar: { $concatArrays: [['$$this.name.ar'], '$$value.ar'] },
                        },
                    },
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
                assignedTo: {
                    $reduce: {
                        input: '$assignedTo',
                        initialValue: { en: [], ar: [] },
                        in: {
                            en: {
                                $concatArrays: [
                                    [{
                                        $concat: ['$$this.firstName.en', ' ', '$$this.lastName.en'],
                                    }],
                                    '$$value.en',
                                ],
                            },
                            ar: {
                                $concatArrays: [
                                    [{
                                        $concat: ['$$this.firstName.ar', ' ', '$$this.lastName.ar'],
                                    }],
                                    '$$value.ar',
                                ],
                            },
                        },
                    },
                },
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

        /* eslint-disable */
        const verstka = `
            <table>
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Region</th>
                        <th>Sub Region</th>
                        <th>Trade Channel</th>
                        <th>Customer</th>
                        <th>Branch</th>
                        <th>Title</th>
                        <th>Assigned To</th>
                        <th>Assigned By</th>
                        <th>Position</th>
                        <th>Description</th>
                        <th>Form Type</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Creation date</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        return `
                            <tr>
                                <td>${item.country[currentLanguage] ? item.country[currentLanguage].join(', ') : 'N/A'}</td>
                                <td>${item.region[currentLanguage] ? item.region[currentLanguage].join(', ') : 'N/A'}</td>
                                <td>${item.subRegion[currentLanguage] ? item.subRegion[currentLanguage].join(', ') : 'N/A'}</td>
                                <td>${item.retailSegment[currentLanguage] ? item.retailSegment[currentLanguage].join(', ') : 'N/A'}</td>
                                <td>${item.outlet[currentLanguage] ? item.outlet[currentLanguage].join(', ') : 'N/A'}</td>
                                <td>${item.branch[currentLanguage] ? item.branch[currentLanguage].join(', ') : 'N/A'}</td>
                                <td>${item.title[currentLanguage]}</td>
                                <td>${item.assignedTo[currentLanguage] ? item.assignedTo[currentLanguage].join(', ') : 'N/A'}</td>
                                <td>${item.createdBy.user.name[currentLanguage]}</td>
                                <td>${item.position.name[currentLanguage]}</td>
                                <td>${sanitizeHtml(item.description[currentLanguage])}</td>
                                <td>${item.form.contentType}</td>
                                <td>${item.status}</td>
                                <td>${item.priority}</td>
                                <td>${moment(item.createdBy.date).format('DD MMMM, YYYY')}</td>
                                <td>${moment(item.dateStart).format('DD MMMM, YYYY')}</td>
                                <td>${moment(item.dateEnd).format('DD MMMM, YYYY')}</td>
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
                    'Content-Disposition': `attachment; filename="InStoreTaskReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
