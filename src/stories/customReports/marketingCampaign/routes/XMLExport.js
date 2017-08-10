const ObjectId = require('bson-objectid');
const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const generalFiler = require('./../../utils/generalFilter');
const locationFiler = require('./../../utils/locationFilter');
const MarketingCampaignModel = require('./../../../../types/marketingCampaign/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const sanitizeHtml = require('../../utils/sanitizeHtml');

const ajv = new Ajv();

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

    const query = req.body;
    const timeFilter = query.timeFilter;
    const queryFilter = query.filter || {};
    const queryRun = (personnel, callback) => {
        currentLanguage = personnel.currentLanguage || 'en';

        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, 'displayType',
            'status', 'publisher', CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];
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
            if (queryFilter[filterName] && queryFilter[filterName][0] && filterName !== 'status') {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.CATEGORY, 'displayType', 'status'], queryFilter, personnel);

        if (queryFilter.publisher && queryFilter.publisher.length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter.publisher,
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
            $project: {
                _id: 1,
                status: 1,
                description: 1,
                category: 1,
                displayType: 1,
                dateStart: 1,
                dateEnd: 1,
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
                    date: 1,
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'displayTypes',
                localField: 'displayType',
                foreignField: '_id',
                as: 'displayType',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        });

        pipeline.push({
            $addFields: {
                category: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0] },
                        },
                        in: {
                            _id: '$$category._id',
                            name: {
                                en: '$$category.name.en',
                                ar: '$$category.name.ar',
                            },
                        },
                    },
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
        ]);

        pipeline.push({
            $lookup: {
                from: CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM,
                localField: '_id',
                foreignField: 'brandingAndDisplay',
                as: 'marketingCampaign',
            },
        });

        pipeline.push({
            $unwind: {
                path: '$marketingCampaign',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    'marketingCampaign.createdBy.user': {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'marketingCampaign.branch': {
                            $in: queryFilter[CONTENT_TYPES.BRANCH],
                        },
                    }],
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'marketingCampaign.branch',
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
                            name: {
                                en: { $ifNull: ['$$branch.name.en', 'N/A'] },
                                ar: { $ifNull: ['$$branch.name.ar', 'N/A'] },
                            },
                            outlet: '$$branch.outlet',
                            retailSegment: '$$branch.retailSegment',
                            subRegion: '$$branch.subRegion',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'branch.subRegion': {
                            $in: queryFilter[CONTENT_TYPES.SUBREGION],
                        },
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'branch.retailSegment': {
                            $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                        },
                    }],
                },
            });
        }

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
                                en: { $ifNull: ['$$subRegion.name.en', 'N/A'] },
                                ar: { $ifNull: ['$$subRegion.name.ar', 'N/A'] },
                            },
                            parent: '$$subRegion.parent',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'subRegion.parent': {
                            $in: queryFilter[CONTENT_TYPES.REGION],
                        },
                    }],
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
                                en: { $ifNull: ['$$region.name.en', 'N/A'] },
                                ar: { $ifNull: ['$$region.name.ar', 'N/A'] },
                            },
                            parent: '$$region.parent',
                        },
                    },
                },
            },
        });


        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        marketingCampaign: null,
                    }, {
                        'region.parent': {
                            $in: queryFilter[CONTENT_TYPES.COUNTRY],
                        },
                    }],
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
                                en: { $ifNull: ['$$country.name.en', 'N/A'] },
                                ar: { $ifNull: ['$$country.name.ar', 'N/A'] },
                            },
                        },
                    },
                },
            },
        });

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
                                    en: { $ifNull: ['$$outlet.name.en', 'N/A'] },
                                    ar: { $ifNull: ['$$outlet.name.ar', 'N/A'] },
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
                                    en: { $ifNull: ['$$retailSegment.name.en', 'N/A'] },
                                    ar: { $ifNull: ['$$retailSegment.name.ar', 'N/A'] },
                                },
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $addFields: {
                location: {
                    $concat: [
                        '$country.name.en',
                        ' -> ',
                        '$region.name.en',
                        ' -> ',
                        '$subRegion.name.en',
                        ' -> ',
                        '$retailSegment.name.en',
                        ' -> ',
                        '$outlet.name.en',
                    ],
                },
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
                'branch.name.en': 1,
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                location: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                status: 1,
                displayType: {
                    _id: 1,
                    name: 1,
                },
                category: 1,
                description: 1,
                dateStart: 1,
                dateEnd: 1,
                createdBy: 1,
                marketingCampaign: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                records: { $push: '$$ROOT' },
                total: { $sum: 1 },
            },
        });

        pipeline.push({
            $unwind: {
                path: '$records',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline.push({
            $project: {
                _id: '$records._id',
                location: '$records.location',
                branch: '$records.branch',
                country: '$records.country',
                region: '$records.region',
                subRegion: '$records.subRegion',
                retailSegment: '$records.retailSegment',
                outlet: '$records.outlet',
                status: '$records.status',
                displayType: '$records.displayType',
                category: '$records.category',
                description: '$records.description',
                dateStart: '$records.dateStart',
                dateEnd: '$records.dateEnd',
                createdBy: '$records.createdBy',
                marketingCampaign: '$records.marketingCampaign',
                total: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'comments',
                localField: 'marketingCampaign.comments',
                foreignField: '_id',
                as: 'marketingCampaignComment',
            },
        });

        pipeline.push({
            $project: {
                _id: '$marketingCampaign._id',
                employee: '$marketingCampaign.createdBy.user',
                location: 1,
                branch: 1,
                status: 1,
                marketingCampaignComment: 1,
                description: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                category: 1,
                displayType: 1,
                commentsUser: {
                    $reduce: {
                        input: '$marketingCampaignComment',
                        initialValue: [],
                        in: {
                            $setUnion: [
                                ['$$this.createdBy.user'],
                                '$$value',
                            ],
                        },
                    },
                },
                dateStart: { $dateToString: { format: '%m/%d/%Y', date: '$dateStart' } },
                dateEnd: { $dateToString: { format: '%m/%d/%Y', date: '$dateEnd' } },
                createdBy: {
                    user: 1,
                    date: { $dateToString: { format: '%m/%d/%Y', date: '$createdBy.date' } },
                },
                total: 1,
            },
        });

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
                from: 'personnels',
                localField: 'employee',
                foreignField: '_id',
                as: 'employee',
            },
        });

        pipeline.push({
            $addFields: {
                employee: {
                    $let: {
                        vars: {
                            user: { $arrayElemAt: ['$employee', 0] },
                        },
                        in: {
                            _id: '$$user._id',
                            position: '$$user.position',
                            name: {
                                en: { $ifNull: [{ $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] }, 'N/A'] },
                                ar: { $ifNull: [{ $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] }, 'N/A'] },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'employee.position',
                    foreignField: '_id',
                    as: 'employee.position',
                },
            },
            {
                $addFields: {
                    'employee.position': {
                        $let: {
                            vars: {
                                position: { $arrayElemAt: ['$employee.position', 0] },
                            },
                            in: {
                                _id: '$$position._id',
                                name: {
                                    en: { $ifNull: ['$$position.name.en', 'N/A'] },
                                    ar: { $ifNull: ['$$position.name.ar', 'N/A'] },
                                },
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $project: {
                _id: 1,
                employee: 1,
                location: 1,
                branch: 1,
                status: 1,
                description: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                category: 1,
                displayType: {
                    $reduce: {
                        input: '$displayType',
                        initialValue: { en: [], ar: [] },
                        in: {
                            en: { $concatArrays: ['$$value.en', ['$$this.name.en']] },
                            ar: { $concatArrays: ['$$value.ar', ['$$this.name.ar']] },
                        },
                    },
                },
                dateStart: 1,
                dateEnd: 1,
                total: 1,
                createdBy: 1,
                marketingCampaignComment: {
                    $map: {
                        input: '$marketingCampaignComment',
                        as: 'comment',
                        in: {
                            _id: '$$comment._id',
                            body: '$$comment.body',
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
        MarketingCampaignModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.NEW_PRODUCT_LAUNCH, cb);
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
                        <th>Product</th>
                        <th>Display Type</th>
                        <th>Time Frame</th>
                        <th>Description</th>
                        <th>Employee</th>
                        <th>Employee position</th>
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
            const comments = item.marketingCampaignComment.map(comment => {
                return `${comment.createdBy.firstName[currentLanguage]} ${comment.createdBy.lastName[currentLanguage]} : ${sanitizeHtml(comment.body)}`
            });
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
                                <td>${item.category ? item.category.name[currentLanguage] : ''}</td>
                                 <td>${item.displayType[currentLanguage].join(', ')}</td>
                                <td>${item.dateStart} - ${item.dateEnd}</td>
                                <td>${sanitizeHtml(item.description[currentLanguage])}</td>
                                <td>${item.employee.name[currentLanguage]}</td>
                                <td>${item.employee.position.name[currentLanguage]}</td>
                                <td>${comments.join(';\n')}</td>
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
                    'Content-Disposition': `attachment; filename="marketingCampaignReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
