const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PriceSurveyModel = require('./../../../../types/priceSurvey/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const moment = require('moment');
const currency = require('../../utils/currency');

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
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT, CONTENT_TYPES.ITEM,
            CONTENT_TYPES.BRAND, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT], queryFilter, personnel);

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
            $unwind: '$items',
        });

        if (queryFilter[CONTENT_TYPES.BRAND] && queryFilter[CONTENT_TYPES.BRAND].length) {
            pipeline.push({
                $match: {
                    'items.brand': {
                        $in: queryFilter[CONTENT_TYPES.BRAND],
                    },
                },
            });
        }

        if (queryFilter.size && queryFilter.size.length) {
            pipeline.push({
                $match: {
                    'items.size': {
                        $in: queryFilter.size,
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: {
                    outlet: '$outlet',
                    branch: '$branch',
                    brand: '$items.brand',
                    size: '$items.size',
                    category: '$category',
                    variant: '$variant',
                },
                min: { $min: '$items.price' },
                max: { $max: '$items.price' },
                avg: { $avg: '$items.price' },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
            },
        });

        pipeline.push({
            $project: {
                outlet: '$_id.outlet',
                branch: '$_id.branch',
                brand: '$_id.brand',
                size: '$_id.size',
                category: '$_id.category',
                variant: '$_id.variant',
                min: 1,
                max: 1,
                avg: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
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
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
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
                from: 'variants',
                localField: 'variant',
                foreignField: '_id',
                as: 'variant',
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
            $project: {
                _id: 0,
                min: 1,
                max: 1,
                avg: 1,
                size: '$size',
                country: { $arrayElemAt: ['$country', 0] },
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
                brand: {
                    $let: {
                        vars: {
                            brand: { $arrayElemAt: ['$brand', 0] },
                        },
                        in: {
                            _id: '$$brand._id',
                            name: '$$brand.name',
                        },
                    },
                },
                category: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0] },
                        },
                        in: {
                            _id: '$$category._id',
                            name: '$$category.name',
                        },
                    },
                },
                variant: {
                    $let: {
                        vars: {
                            variant: { $arrayElemAt: ['$variant', 0] },
                        },
                        in: {
                            _id: '$$variant._id',
                            name: '$$variant.name',
                        },
                    },
                },
                location: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                            region: { $arrayElemAt: ['$region', 0] },
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                            retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                            outlet: { $arrayElemAt: ['$outlet', 0] },
                        },
                        in: {
                            $concat: [
                                '$$country.name.en',
                                ' -> ',
                                '$$region.name.en',
                                ' -> ',
                                '$$subRegion.name.en',
                                ' -> ',
                                '$$retailSegment.name.en',
                                ' -> ',
                                '$$outlet.name.en',
                            ],
                        },
                    },
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
            $sort: {
                'category.name.en': 1,
                'brand.name.en': 1,
            },
        });

        PriceSurveyModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.PRICE_SURVEY, cb);
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
                        <th>Location</th>
                        <th>Category</th>
                        <th>Variant</th>
                        <th>Branch</th>
                        <th>Brand</th>
                        <th>Size</th>
                        <th>Avg</th>
                        <th>Max</th>
                        <th>Min</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        const currentCountry = currency.defaultData.find((country) => {
                            return country._id.toString() === item.country._id.toString();
                        });
                        const minPrice = parseFloat(item.min / currentCountry.currencyInUsd).toFixed(2);
                        const avgPrice = parseFloat(item.avg / currentCountry.currencyInUsd).toFixed(2);
                        const maxPrice = parseFloat(item.max / currentCountry.currencyInUsd).toFixed(2);
                        return `
                            <tr>
                                <td>${item.location}</td>
                                <td>${item.category.name[currentLanguage]}</td>
                                <td>${item.variant.name[currentLanguage]}</td>
                                <td>${item.branch.name[currentLanguage]}</td>
                                <td>${item.brand.name[currentLanguage]}</td>
                                <td>${item.size}</td>
                                <td>${avgPrice}</td>
                                <td>${maxPrice}</td>
                                <td>${minPrice}</td>
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
                    'Content-Disposition': `attachment; filename="priceSurveyReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
