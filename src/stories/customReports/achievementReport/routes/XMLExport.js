const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const AchievementFormModel = require('./../../../../types/achievementForm/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const emojiStrip = require('emoji-strip');

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
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
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

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'createdBy.user.position',
                    foreignField: '_id',
                    as: 'createdBy.user.position',
                },
            },
            {
                $addFields: {
                    'createdBy.user.position': {
                        $let: {
                            vars: {
                                position: { $arrayElemAt: ['$createdBy.user.position', 0] },
                            },
                            in: {
                                _id: '$$position._id',
                                name: {
                                    en: '$$position.name.en',
                                    ar: '$$position.name.ar',
                                },
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                branch: { $arrayElemAt: ['$branch', 0] },
                            },
                            in: {
                                _id: '$$branch._id',
                                name: {
                                    en: '$$branch.name.en',
                                    ar: '$$branch.name.ar',
                                },
                                outlet: '$$branch.outlet',
                                retailSegment: '$$branch.retailSegment',
                                subRegion: '$$branch.subRegion',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'branch.subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $addFields: {
                    branch: {
                        _id: '$branch._id',
                        name: '$branch.name',
                    },
                    subRegion: {
                        $let: {
                            vars: {
                                subRegion: { $arrayElemAt: ['$subRegion', 0] },
                            },
                            in: {
                                _id: '$$subRegion._id',
                                name: {
                                    en: '$$subRegion.name.en',
                                    ar: '$$subRegion.name.ar',
                                },
                                parent: '$$subRegion.parent',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion.parent',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
                $addFields: {
                    subRegion: {
                        _id: '$subRegion._id',
                        name: '$subRegion.name',
                    },
                    region: {
                        $let: {
                            vars: {
                                region: { $arrayElemAt: ['$region', 0] },
                            },
                            in: {
                                _id: '$$region._id',
                                name: {
                                    en: '$$region.name.en',
                                    ar: '$$region.name.ar',
                                },
                                parent: '$$region.parent',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region.parent',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    region: {
                        _id: '$region._id',
                        name: '$region.name',
                    },
                    country: {
                        $let: {
                            vars: {
                                country: { $arrayElemAt: ['$country', 0] },
                            },
                            in: {
                                _id: '$$country._id',
                                name: {
                                    en: '$$country.name.en',
                                    ar: '$$country.name.ar',
                                },
                            },
                        },
                    },
                },
            }]
        );

        pipeline.push(...[
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'branch.outlet',
                    foreignField: '_id',
                    as: 'outlet',
                },
            },
            {
                $addFields: {
                    branch: {
                        _id: '$branch._id',
                        name: '$branch.name',
                        retailSegment: '$branch.retailSegment',
                        subRegion: '$branch.subRegion',
                    },
                    outlet: {
                        $let: {
                            vars: {
                                outlet: { $arrayElemAt: ['$outlet', 0] },
                            },
                            in: {
                                _id: '$$outlet._id',
                                name: {
                                    en: '$$outlet.name.en',
                                    ar: '$$outlet.name.ar',
                                },
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'retailSegments',
                    localField: 'branch.retailSegment',
                    foreignField: '_id',
                    as: 'retailSegment',
                },
            },
            {
                $addFields: {
                    branch: {
                        _id: '$branch._id',
                        name: '$branch.name',
                        subRegion: '$branch.subRegion',
                    },
                    retailSegment: {
                        $let: {
                            vars: {
                                retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                            },
                            in: {
                                _id: '$$retailSegment._id',
                                name: {
                                    en: '$$retailSegment.name.en',
                                    ar: '$$retailSegment.name.ar',
                                },
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push(...[
            {
                $addFields: {
                    country: {
                        _id: '$country._id',
                        name: '$country.name',
                    },
                    location: {
                        $concat: ['$country.name.en', ' -> ', '$region.name.en', ' -> ', '$subRegion.name.en', ' -> ', '$retailSegment.name.en', ' -> ', '$outlet.name.en', ' -> ', '$branch.name.en'],
                    },
                },
            },
            {
                $sort: {
                    location: 1,
                },
            },
        ]);

        pipeline.push({
            $project: {
                _id: 1,
                description: 1,
                additionalComment: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
            },
        });

        AchievementFormModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.ACHIEVEMENT_FORM, cb);
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
                        <th>Trade channel</th>
                        <th>Customer</th>
                        <th>Branch</th>
                        <th>Publisher</th>
                        <th>Position</th>
                        <th>Description</th>
                        <th>Comment</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        return `
                            <tr>
                                <td>${item.country.name[currentLanguage]}</td>
                                <td>${item.region.name[currentLanguage]}</td>
                                <td>${item.subRegion.name[currentLanguage]}</td>
                                <td>${item.retailSegment.name[currentLanguage]}</td>
                                <td>${item.outlet.name[currentLanguage]}</td>
                                <td>${item.branch.name[currentLanguage]}</td>
                                <td>${item.createdBy.user.name[currentLanguage]}</td>
                                <td>${item.createdBy.user.position.name[currentLanguage]}</td>
                                <td>${emojiStrip(item.description[currentLanguage])}</td>
                                <td>${item.createdBy.user.name[currentLanguage] + ': ' +emojiStrip(item.additionalComment[currentLanguage])}</td>
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
                    'Content-Disposition': `attachment; filename="achievementReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
