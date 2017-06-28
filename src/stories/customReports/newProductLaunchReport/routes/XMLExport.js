const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const NewProductLaunch = require('./../../../../types/newProductLaunch/model');
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
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
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

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE, 'packing'], queryFilter, personnel);

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRAND] && queryFilter[CONTENT_TYPES.BRAND].length) {
            $generalMatch.$and.push({
                'brand.name': {
                    $in: queryFilter[CONTENT_TYPES.BRAND],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.VARIANT] && queryFilter[CONTENT_TYPES.VARIANT].length) {
            $generalMatch.$and.push({
                'variant.name': {
                    $in: queryFilter[CONTENT_TYPES.VARIANT],
                },
            });
        }

        if (queryFilter.distributor && queryFilter.distributor.length) {
            $generalMatch.$and.push({
                $or: [
                    {
                        'distributor.en': {
                            $in: queryFilter.distributor,
                        },
                    },
                    {
                        'distributor.ar': {
                            $in: queryFilter.distributor,
                        },
                    },
                ],
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

        if ($generalMatch.$and.length) {
            pipeline.push({
                $match: $generalMatch,
            });
        }

        if (queryFilter.shelfLife) {
            queryFilter.shelfLife = parseInt(queryFilter.shelfLife, 10);

            pipeline.push({
                $addFields: {
                    shelfLifePeriod: {
                        $trunc: {
                            $divide: [
                                {
                                    $subtract: ['$shelfLifeEnd', '$shelfLifeStart'],
                                },
                                86400000,
                            ],
                        },
                    },
                },
            });

            pipeline.push({
                $match: {
                    shelfLifePeriod: { $gte: queryFilter.shelfLife },
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
            $project: {
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                brand: 1,
                category: 1,
                variant: 1,
                packing: 1,
                displayType: 1,
                price: 1,
                origin: 1,
                shelfLifeStart: 1,
                shelfLifeEnd: 1,
                distributor: 1,
                attachments: 1,
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
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
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
                from: 'origins',
                localField: 'origin',
                foreignField: '_id',
                as: 'origin',
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
            $project: {
                _id: 1,
                location: {
                    $concat: [
                        {
                            $let: {
                                vars: {
                                    country: { $arrayElemAt: ['$country', 0] },
                                },
                                in: '$$country.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    region: { $arrayElemAt: ['$region', 0] },
                                },
                                in: '$$region.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    subRegion: { $arrayElemAt: ['$subRegion', 0] },
                                },
                                in: '$$subRegion.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                                },
                                in: '$$retailSegment.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    outlet: { $arrayElemAt: ['$outlet', 0] },
                                },
                                in: '$$outlet.name.en',
                            },
                        },
                        ' -> ',
                        {
                            $let: {
                                vars: {
                                    branch: { $arrayElemAt: ['$branch', 0] },
                                },
                                in: '$$branch.name.en',
                            },
                        },
                    ],
                },
                country: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                        },
                        in: '$$country.name',
                    },
                },
                region: {
                    $let: {
                        vars: {
                            region: { $arrayElemAt: ['$region', 0] },
                        },
                        in: '$$region.name',
                    },
                },
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                        },
                        in: '$$subRegion.name',
                    },
                },
                retailSegment: {
                    $let: {
                        vars: {
                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                        },
                        in: '$$retailSegment.name',
                    },
                },
                outlet: {
                    $let: {
                        vars: {
                            outlet: { $arrayElemAt: ['$outlet', 0] },
                        },
                        in: '$$outlet.name',
                    },
                },
                branch: {
                    $let: {
                        vars: {
                            branch: { $arrayElemAt: ['$branch', 0] },
                        },
                        in: '$$branch.name',
                    },
                },
                position: {
                    $let: {
                        vars: {
                            position: { $arrayElemAt: ['$position', 0] },
                        },
                        in: '$$position.name',
                    },
                },
                createdBy: 1,
                brand: 1,
                category: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0] },
                        },
                        in: '$$category.name',
                    },
                },
                variant: 1,
                packing: 1,
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
                price: 1,
                origin: {
                    $let: {
                        vars: {
                            origin: { $arrayElemAt: ['$origin', 0] },
                        },
                        in: '$$origin.name',
                    },
                },
                shelfLifeStart: 1,
                shelfLifeEnd: 1,
                distributor: 1,
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
            },
        });

        NewProductLaunch.aggregate(pipeline)
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
                        <th>Brand</th>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Packing</th>
                        <th>Display Type</th>
                        <th>Price</th>
                        <th>Origin</th>
                        <th>Shelf Life Start</th>
                        <th>Shelf Life End</th>
                        <th>Distributor</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        return `
                            <tr>
                                <td>${item.country[currentLanguage]}</td>
                                <td>${item.region[currentLanguage]}</td>
                                <td>${item.subRegion[currentLanguage]}</td>
                                <td>${item.retailSegment[currentLanguage]}</td>
                                <td>${item.outlet[currentLanguage]}</td>
                                <td>${item.branch[currentLanguage]}</td>
                                <td>${item.createdBy.user.name[currentLanguage] + ', ' + item.position[currentLanguage]}</td>
                                <td>${item.brand.name}</td>
                                <td>${item.category ? item.category[currentLanguage] : ''}</td>
                                <td>${item.variant.name}</td>
                                <td>${item.packing}</td>
                                <td>${item.displayType[currentLanguage].join(', ')}</td>
                                <td>${item.price}</td>
                                <td>${item.origin ? item.origin[currentLanguage] : ''}</td>
                                <td>${moment(item.shelfLifeStart).format('DD MMMM, YYYY')}</td>
                                <td>${moment(item.shelfLifeEnd).format('DD MMMM, YYYY')}</td>
                                <td>${item.distributor[currentLanguage]}</td>
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
                    'Content-Disposition': `attachment; filename="newProductLaunchReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
