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
        const query = req.query;
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
                brands: 1,
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
            $group: {
                _id: {
                    category: '$category',
                    brand: '$brands.brand',
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
                _id: '$_id.category',
                brands: {
                    $push: {
                        _id: '$_id.brand',
                        name: '$name',
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
                localField: '_id',
                foreignField: '_id',
                as: 'category',
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

        pipeline.push({
            $limit: 3,
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

        // result.forEach(item => {
        //     item.brands.forEach(brand => {
        //         brand.minLength = parseFloat(brand.minLength).toFixed(2);
        //         brand.minPercent = parseFloat(brand.minPercent).toFixed(2);
        //         brand.avgLength = parseFloat(brand.avgLength).toFixed(2);
        //         brand.avgPercent = parseFloat(brand.avgPercent).toFixed(2);
        //         brand.maxLength = parseFloat(brand.maxLength).toFixed(2);
        //         brand.maxPercent = parseFloat(brand.maxPercent).toFixed(2);
        //     });
        //
        //     item.totalMinLength = parseFloat(item.totalMinLength).toFixed(2);
        //     item.totalMinPercent = parseFloat(item.totalMinPercent).toFixed(2);
        //     item.totalAvgLength = parseFloat(item.totalAvgLength).toFixed(2);
        //     item.totalAvgPercent = parseFloat(item.totalAvgPercent).toFixed(2);
        //     item.totalMaxLength = parseFloat(item.totalMaxLength).toFixed(2);
        //     item.totalMaxPercent = parseFloat(item.totalMaxPercent).toFixed(2);
        // });

        /* eslint-disable */
        const verstka = `
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Branch</th>
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
