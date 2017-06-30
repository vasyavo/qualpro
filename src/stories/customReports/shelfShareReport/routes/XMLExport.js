const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ShelfShareModel = require('./../../../../types/shelfShare/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
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
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.BRAND, CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.CATEGORY], queryFilter, personnel);

        if (queryFilter.brand && queryFilter.brand.length) {
            $generalMatch.$and.push({
                'brands.brand': {
                    $in: queryFilter.brand,
                },
            });
        }

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
            $project: {
                _id: 1,
                category: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                brands: 1,
                createdBy: {
                    user: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ['$createdBy.user', 0] },
                            },
                            in: {
                                _id: '$$user._id',
                                lastName: '$$user.lastName',
                                firstName: '$$user.firstName',
                                position: '$$user.position',
                            },
                        },
                    },
                    date: 1,
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
            $unwind: '$brands',
        });

        if (queryFilter.brand && queryFilter.brand.length) {
            pipeline.push({
                $match: {
                    'brands.brand': {
                        $in: queryFilter.brand,
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'createdBy.user.position',
                foreignField: '_id',
                as: 'createdBy.user.position',
            },
        }, {
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
        });

        pipeline.push({
            $group: {
                _id: {
                    category: '$category',
                    brand: '$brands.brand',
                    country: '$country',
                    region: '$region',
                    subRegion: '$subRegion',
                    retailSegment: '$retailSegment',
                    outlet: '$outlet',
                    branch: '$branch',
                    createdBy: '$createdBy',

                },
                maxLength: { $max: '$brands.length' },
                minLength: { $min: '$brands.length' },
                avgLength: { $avg: '$brands.length' },
                maxPercent: { $max: '$brands.percent' },
                minPercent: { $min: '$brands.percent' },
                avgPercent: { $avg: '$brands.percent' },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'brands',
                localField: '_id.brand',
                foreignField: '_id',
                as: 'brand',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                createdBy: 1,
                maxLength: 1,
                minLength: 1,
                avgLength: 1,
                maxPercent: 1,
                minPercent: 1,
                avgPercent: 1,
                name: {
                    $let: {
                        vars: {
                            brand: { $arrayElemAt: ['$brand', 0] },
                        },
                        in: '$$brand.name',
                    },
                },
            },
        });

        pipeline.push({
            $group: {
                _id: {
                    category: '$_id.category',
                    country: '$_id.country',
                    region: '$_id.region',
                    subRegion: '$_id.subRegion',
                    retailSegment: '$_id.retailSegment',
                    outlet: '$_id.outlet',
                    branch: '$_id.branch',
                },
                brands: {
                    $push: {
                        _id: '$_id.brand',
                        name: '$name',
                        createdBy: '$_id.createdBy',
                        maxLength: '$maxLength',
                        minLength: '$minLength',
                        avgLength: '$avgLength',
                        maxPercent: '$maxPercent',
                        minPercent: '$minPercent',
                        avgPercent: '$avgPercent',
                    },
                },
                totalMinLength: { $min: '$minLength' },
                totalMaxLength: { $max: '$maxLength' },
                totalAvgLength: { $avg: '$avgLength' },
                totalMinPercent: { $min: '$minPercent' },
                totalMaxPercent: { $max: '$maxPercent' },
                totalAvgPercent: { $avg: '$avgPercent' },
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                brands: 1,
                totalMinLength: 1,
                totalMaxLength: 1,
                totalAvgLength: 1,
                totalMinPercent: 1,
                totalMaxPercent: 1,
                totalAvgPercent: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: '_id.category',
                foreignField: '_id',
                as: 'category',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: '_id.country',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: '_id.region',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: '_id.subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: '_id.retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: '_id.outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: '_id.branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeline.push({
            $project: {
                _id: 1,
                brands: 1,
                totalMinLength: 1,
                totalMaxLength: 1,
                totalAvgLength: 1,
                totalMinPercent: 1,
                totalMaxPercent: 1,
                totalAvgPercent: 1,
                country: {
                    $let: {
                        vars: {
                            country: { $arrayElemAt: ['$country', 0] },
                        },
                        in: {
                            _id: '$$country._id',
                            name: '$$country.name',
                        },
                    },
                },
                region: {
                    $let: {
                        vars: {
                            region: { $arrayElemAt: ['$region', 0] },
                        },
                        in: {
                            _id: '$$region._id',
                            name: '$$region.name',
                        },
                    },
                },
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: { $arrayElemAt: ['$subRegion', 0] },
                        },
                        in: {
                            _id: '$$subRegion._id',
                            name: '$$subRegion.name',
                        },
                    },
                },
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
                name: {
                    $let: {
                        vars: {
                            category: { $arrayElemAt: ['$category', 0] },
                        },
                        in: '$$category.name',
                    },
                },
            },
        });

        ShelfShareModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.SHELF_SHARES, cb);
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
                        <th>Employee</th>
                        <th>Position</th>
                        <th>Country</th>
                        <th>Region</th>
                        <th>Sub Region</th>
                        <th>Retail Segment</th>
                        <th>Outlet</th>
                        <th>Branch</th>
                        <th>Product</th>
                        <th>Brand</th>
                        <th>Min (M / %)</th>
                        <th>Max (M / %)</th>
                        <th>Avg (M / %)</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map((product) => {
                        return `
                                ${product.brands.map((brand) => {
                                    return `
                                        <tr>
                                            <td>${brand.createdBy.user.firstName[currentLanguage]} ${brand.createdBy.user.lastName[currentLanguage]}</td>
                                            <td>${brand.createdBy.user.position.name[currentLanguage]}</td>
                                            <td>${product.country.name[currentLanguage]}</td>
                                            <td>${product.region.name[currentLanguage]}</td>
                                            <td>${product.subRegion.name[currentLanguage]}</td>
                                            <td>${product.retailSegment.name[currentLanguage]}</td>
                                            <td>${product.outlet.name[currentLanguage]}</td>
                                            <td>${product.branch.name[currentLanguage]}</td>
                                            <td>${product.name[currentLanguage]}</td>
                                            <td>${brand.name[currentLanguage]}</td>
                                            <td>${parseFloat(brand.minLength).toFixed(2) + ' / ' + parseFloat(brand.minPercent).toFixed(2)}</td>
                                            <td>${parseFloat(brand.maxLength).toFixed(2) + ' / ' + parseFloat(brand.maxPercent).toFixed(2)}</td>
                                            <td>${parseFloat(brand.avgLength).toFixed(2) + ' / ' + parseFloat(brand.avgPercent).toFixed(2)}</td>
                                        </tr>
                                    `;
                                })}
                                <tr>
                                    <td></td>
                                    <td>TOTAL</td>
                                    <td>${parseFloat(product.totalMinLength).toFixed(2) + ' / ' + parseFloat(product.totalMinPercent).toFixed(2)}</td>
                                    <td>${parseFloat(product.totalMaxLength).toFixed(2) + ' / ' + parseFloat(product.totalMaxPercent).toFixed(2)}</td>
                                    <td>${parseFloat(product.totalAvgLength).toFixed(2) + ' / ' + parseFloat(product.totalAvgPercent).toFixed(2)}</td>
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
                    'Content-Disposition': `attachment; filename="shelfSharesReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
