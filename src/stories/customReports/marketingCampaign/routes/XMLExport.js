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
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, 'displayType',
            'status', 'publisher', CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
            CONTENT_TYPES.MARKETING_CAMPAIGN,
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

        if (queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN] && queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN].length) {
            pipeline.push({
                $match: {
                    _id: { $in: queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN] },
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
                country: 1,
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
                            name: {
                                en: '$$country.name.en',
                                ar: '$$country.name.ar',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'marketingCampaignItem',
                localField: '_id',
                foreignField: 'brandingAndDisplay',
                as: 'respondents',
            },
        });

        pipeline.push({
            $addFields: {
                respondents: { $size: '$respondents' },
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                country: 1,
                status: 1,
                displayType: {
                    _id: 1,
                    name: 1,
                },
                category: 1,
                respondents: 1,
                description: 1,
                dateStart: 1,
                dateEnd: 1,
                createdBy: 1,
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
                        <th>Publisher</th>
                        <th>Position</th>
                        <th>Product</th>
                        <th>Display Type</th>
                        <th>Time Frame</th>
                        <th>Description</th>
                        <th>Respondents</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        const displayType = {
                            en: item.displayType.map(type => {
                                return type.name.en;
                            }),
                            ar: item.displayType.map(type => {
                                return type.name.ar;
                            })
                        };
                        
            return `
                            <tr>
                                <td>${item.country.name[currentLanguage || 'en']}</td>
                                <td>${item.createdBy.user.name[currentLanguage || 'en']}</td>
                                <td>${item.createdBy.user.position.name[currentLanguage || 'en']}</td>
                                <td>${item.category ? item.category.name[currentLanguage || 'en'] : ''}</td>
                                <td>${displayType[currentLanguage || 'en'].join(', ')}</td>
                                <td>${item.dateStart} - ${item.dateEnd}</td>
                                <td>${sanitizeHtml(item.description[currentLanguage || 'en'])}</td>
                                <td>${item.respondents}</td>
                                <td>${item.status}</td>
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
