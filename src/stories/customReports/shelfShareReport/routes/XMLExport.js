const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const _ = require('lodash');
const AccessManager = require('./../../../../helpers/access')();
const ShelfShareModel = require('./../../../../types/shelfShare/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
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
                    'createdBy.date': {
                        $gte: moment(frame.from, 'MM/DD/YYYY')._d,
                        $lte: moment(frame.to, 'MM/DD/YYYY').add(1, 'day')._d,
                    },
                });
                $timeMatch.$or.push({
                    'editedBy.date': {
                        $gte: moment(frame.from, 'MM/DD/YYYY')._d,
                        $lte: moment(frame.to, 'MM/DD/YYYY').add(1, 'day')._d,
                    },
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
                totalMinLength: { $sum: '$minLength' },
                totalMaxLength: { $sum: '$maxLength' },
                totalAvgLength: { $sum: '$avgLength' },
            },
        });

        pipeline.push({
            $group: {
                _id: null,
                setShelfShare: { $push: '$$ROOT' },
                total: { $sum: 1 },
            },
        });

        pipeline.push({
            $unwind: {
                path: '$setShelfShare',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline.push({
            $project: {
                _id: '$setShelfShare._id',
                brands: '$setShelfShare.brands',
                totalMinLength: '$setShelfShare.totalMinLength',
                totalMaxLength: '$setShelfShare.totalMaxLength',
                totalAvgLength: '$setShelfShare.totalAvgLength',
                total: 1,
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
                total: 1,
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
            $group: {
                _id: null,
                total: { $first: '$total' },
                data: { $push: '$$ROOT' },
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

        result = result.length ?
            result[0] : { data: [], total: 0 };

        result.data.forEach(item => {
            item.brands.forEach(brand => {
                brand.minLength = parseFloat(brand.minLength).toFixed(2);
                brand.minPercent = parseFloat(brand.minPercent).toFixed(2);
                brand.avgLength = parseFloat(brand.avgLength).toFixed(2);
                brand.avgPercent = parseFloat(brand.avgPercent).toFixed(2);
                brand.maxLength = parseFloat(brand.maxLength).toFixed(2);
                brand.maxPercent = parseFloat(brand.maxPercent).toFixed(2);
            });

            item.totalMinLength = parseFloat(item.totalMinLength).toFixed(2);
            item.totalAvgLength = parseFloat(item.totalAvgLength).toFixed(2);
            item.totalMaxLength = parseFloat(item.totalMaxLength).toFixed(2);
        });

        const setBrands = result.data.map(item => {
            return item.brands.map(brand => brand.name);
        });
        let orderedBrands = _(setBrands)
            .flatten()
            .sortBy('en')
            .uniqBy('en')
            .value();

        const ourBrand = orderedBrands
            .filter(brand => brand.en === 'Al alali')
            .slice()
            .pop();

        if (ourBrand) {
            orderedBrands = [
                ourBrand,
                ...orderedBrands
                    .filter(brand => brand.en !== 'Al alali'),
            ];
        }

        const brandTitle = orderedBrands.map(brand => (
            `<th colspan=3>${sanitizeHtml(brand.en)}</th>`
        )).join('');

        const chastVerstki1 = orderedBrands.map(() => `
                <th >min</th>
                <th >avg</th>
                <th >max</th>
        `).join('');

        const chastVerstki2 = result.data.map(item => `
        <tr>
        <td rowSpan=2>${item.name.en}</td>
        <td>m</td>
        <td>${item.totalMinLength}</td>
        <td>${item.totalAvgLength}</td>
        <td>${item.totalMaxLength}</td>
        ${orderedBrands.map(brand => {
            const brandByItem = _.find(item.brands, { name: brand });

            if (brandByItem) {
                return `
                    <td>${brandByItem.minLength}</td>,
                    <td>${brandByItem.avgLength}</td>,
                    <td>${brandByItem.maxLength}</td>,
                `;
            }

            return `
                <td />,
                <td />,
                <td />,
            `;
        }).join('')}
        </tr>,
        <tr>
        <td>%</td>
        <td>${item.totalMinPercent || 0}</td>
        <td>${item.totalAvgPercent || 0}</td>
        <td>${item.totalMaxPercent || 0}</td>
        ${_.flatten(orderedBrands.map(brand => {
            const brandByItem = _.find(item.brands, { name: brand });

            if (brandByItem) {
                return `
                    <td>${brandByItem.minPercent}</td>
            <td>${brandByItem.avgPercent}</td>
            <td>${brandByItem.maxPercent}</td>
            `;
            }

            return `
            <td />
            <td />
            <td />
            `;
        })).join('')}
        </tr>,
        `).join('');

        const verstka = `
            <table>
            <thead>
            <tr>
            <th rowSpan=2>Product</th>
            <th rowSpan=2>m / %</th>
            <th colSpan=3>TOTAL</th>
            ${brandTitle}
        </tr>
        <tr>
        <th>min</th>
        <th>avg</th>
        <th>max</th>
        ${chastVerstki1}
        </tr>
        </thead>
        <tbody>
        ${chastVerstki2}
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
