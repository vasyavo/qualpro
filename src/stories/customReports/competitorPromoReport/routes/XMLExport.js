const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const CompetitorPromotionModel = require('./../../../../types/competitorPromotion/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const currency = require('../../utils/currency');
const sanitizeHtml = require('../../utils/sanitizeHtml');

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

    const query = req.body;
    const timeFilter = query.timeFilter;
    const queryFilter = query.filter || {};

    const queryRun = (personnel, callback) => {
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.BRAND, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
            CONTENT_TYPES.ORIGIN, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];
        const pipeline = [];

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

        if (queryFilter.brands) {
            queryFilter.brand = queryFilter.brands;
            delete  queryFilter.brands;
        }

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRAND,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE, CONTENT_TYPES.ORIGIN,
        ], queryFilter, personnel);

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

        pipeline.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user',
            },
        });

        pipeline.push({
            $addFields: {
                packing  : {$concat: ['$packing', ' ', '$packingType']},
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
                from        : 'categories',
                localField  : 'category',
                foreignField: '_id',
                as          : 'category',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'brands',
                localField  : 'brand',
                foreignField: '_id',
                as          : 'brand',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'origins',
                localField  : 'origin',
                foreignField: '_id',
                as          : 'origin',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'displayTypes',
                localField  : 'displayType',
                foreignField: '_id',
                as          : 'displayType',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'domains',
                localField  : 'country',
                foreignField: '_id',
                as          : 'country',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'domains',
                localField  : 'region',
                foreignField: '_id',
                as          : 'region',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'domains',
                localField  : 'subRegion',
                foreignField: '_id',
                as          : 'subRegion',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'retailSegments',
                localField  : 'retailSegment',
                foreignField: '_id',
                as          : 'retailSegment',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'outlets',
                localField  : 'outlet',
                foreignField: '_id',
                as          : 'outlet',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'branches',
                localField  : 'branch',
                foreignField: '_id',
                as          : 'branch',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'positions',
                localField  : 'createdBy.user.position',
                foreignField: '_id',
                as          : 'createdBy.user.position',
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'comments',
                localField  : '_id',
                foreignField: 'taskId',
                as          : 'comments',
            },
        });

        pipeline.push({
            $project: {
                _id          : 1,
                description  : 1,
                promotion    : 1,
                packing      : 1,
                expiry       : 1,
                dateStart    : 1,
                dateEnd      : 1,
                price        : 1,
                comments     : 1,
                commentsUser : {
                    $reduce: {
                        input       : '$comments',
                        initialValue: [],
                        in          : {
                            $setUnion: [
                                ['$$this.createdBy.user'],
                                '$$value',
                            ],
                        },
                    },
                },
                country      : {
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
                region       : {
                    $let: {
                        vars: {
                            region: {$arrayElemAt: ['$region', 0]},
                        },
                        in  : {
                            _id : '$$region._id',
                            name: '$$region.name',
                        },
                    },
                },
                subRegion    : {
                    $let: {
                        vars: {
                            subRegion: {$arrayElemAt: ['$subRegion', 0]},
                        },
                        in  : {
                            _id : '$$subRegion._id',
                            name: '$$subRegion.name',
                        },
                    },
                },
                retailSegment: {
                    $let: {
                        vars: {
                            retailSegment: {$arrayElemAt: ['$retailSegment', 0]},
                        },
                        in  : {
                            _id : '$$retailSegment._id',
                            name: '$$retailSegment.name',
                        },
                    },
                },
                outlet       : {
                    $let: {
                        vars: {
                            outlet: {$arrayElemAt: ['$outlet', 0]},
                        },
                        in  : {
                            _id : '$$outlet._id',
                            name: '$$outlet.name',
                        },
                    },
                },
                branch       : {
                    $let: {
                        vars: {
                            branch: {$arrayElemAt: ['$branch', 0]},
                        },
                        in  : {
                            _id : '$$branch._id',
                            name: '$$branch.name',
                        },
                    },
                },
                category     : {
                    $let: {
                        vars: {
                            category: {$arrayElemAt: ['$category', 0]},
                        },
                        in  : {
                            _id : '$$category._id',
                            name: '$$category.name',
                        },
                    },
                },
                brand        : {
                    $let: {
                        vars: {
                            brand: {$arrayElemAt: ['$brand', 0]},
                        },
                        in  : {
                            _id : '$$brand._id',
                            name: '$$brand.name',
                        },
                    },
                },
                origin       : {
                    $let: {
                        vars: {
                            origin: {$arrayElemAt: ['$origin', 0]},
                        },
                        in  : {
                            _id : '$$origin._id',
                            name: '$$origin.name',
                        },
                    },
                },
                displayType  : {
                    $reduce: {
                        input       : '$displayType',
                        initialValue: {en: '', ar: ''},
                        in          : {
                            en: {
                                $concat: ['$$this.name.en', ' ', '$$value.en'],
                            },
                            ar: {
                                $concat: ['$$this.name.en', ' ', '$$value.en'],
                            },
                        },
                    },
                },
                createdBy    : {
                    user: {
                        _id     : 1,
                        name    : 1,
                        position: {
                            $let: {
                                vars: {
                                    position: {$arrayElemAt: ['$createdBy.user.position', 0]},
                                },
                                in  : {
                                    _id : '$$position._id',
                                    name: '$$position.name',
                                },
                            },
                        },
                    },
                    date: 1,
                },
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'commentsUser',
                foreignField: '_id',
                as          : 'commentsUser',
            },
        });

        pipeline.push({
            $project: {
                _id          : 1,
                description  : 1,
                promotion    : 1,
                packing      : 1,
                expiry       : 1,
                dateStart    : 1,
                dateEnd      : 1,
                price        : 1,
                category     : 1,
                brand        : 1,
                origin       : 1,
                displayType  : 1,
                createdBy    : 1,
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                comments     : {
                    $map: {
                        input: '$comments',
                        as   : 'item',
                        in   : {
                            _id      : '$$item._id',
                            body     : '$$item.body',
                            createdBy: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$commentsUser',
                                                    as   : 'user',
                                                    cond : {
                                                        $setIsSubset: [
                                                            [
                                                                '$$user._id',
                                                            ],
                                                            ['$$item.createdBy.user'],
                                                        ],
                                                    },
                                                },
                                            },
                                            as   : 'user',
                                            in   : {
                                                _id      : '$$user._id',
                                                firstName: '$$user.firstName',
                                                lastName : '$$user.lastName',
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                },
                location     : {
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
                        ' -> ',
                        '$branch.name.en',
                    ],
                },
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
            },
        });

        CompetitorPromotionModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.COMPETITOR_PROMOTION_ACTIVITY, cb);
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
                        <th>Employee</th>
                        <th>Position</th>
                        <th>Brand</th>
                        <th>Product</th>
                        <th>Promotion (description)</th>
                        <th>Weight + metric type</th>
                        <th>Expiry date</th>
                        <th>Start date</th>
                        <th>End date</th>
                        <th>Origin</th>
                        <th>RSP</th>
                        <th>Display or branding type</th>
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
            const currentCountry = currency.defaultData.find((country) => {
                return country._id.toString() === item.country._id.toString();
            });
            const comments = item.comments.map(comment => {
                return `${comment.createdBy.firstName[currentLanguage]} ${comment.createdBy.lastName[currentLanguage]} : ${sanitizeHtml(comment.body)}`
            });
            const dateStart = item.dateStart ? moment(item.dateStart).format('DD MMMM, YYYY') : 'N/A';
            const dateEnd = item.dateEnd ? moment(item.dateEnd).format('DD MMMM, YYYY') : 'N/A';
            item.price = Number(item.price);
            let price = item.price.toFixed(2);
            if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length > 1) {
                price = parseFloat(price * currentCountry.currencyInUsd).toFixed(2);
                price = `${price} $`;
            } else {
                price = `${price} ${currentCountry.currency}`;
            }
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
                                <td>${item.brand.name[currentLanguage]}</td>
                                <td>${item.category.name[currentLanguage]}</td>
                                <td>${item.promotion}</td>
                                <td>${item.packing}</td>
                                <td>${moment(item.expiry).format('DD MMMM, YYYY')}</td>
                                <td>${dateStart}</td>
                                <td>${dateEnd}</td>
                                <td>${item.origin.name ? item.origin.name[currentLanguage] : null}</td>
                                <td>${price}</td>
                                <td>${item.displayType[currentLanguage]}</td>
                                <td>${comments}</td>
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
                    'Content-Disposition': `attachment; filename="competitorPromoReportExport_${new Date()}.xls"`,
                    'Content-Length'     : buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
