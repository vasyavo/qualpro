const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const striptags = require('striptags');
const _ = require('lodash');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PromotionModel = require('./../../../../types/promotion/model');
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
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, 'displayType',
            'status', 'publisher', CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
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
                promotionType: 1,
                ppt: 1,
                comments: 1,
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
                                position: '$$user.position',
                            },
                        },
                    },
                    date: 1,
                },
            },
        });

        pipeline.push({
            $addFields: {
                ppt: { $divide: ['$ppt', 100] },
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
                from: CONTENT_TYPES.PROMOTIONSITEMS,
                localField: '_id',
                foreignField: 'promotion',
                as: 'promotion',
            },
        });

        pipeline.push({
            $unwind: '$promotion',
        });

        const $timeMatch = {};

        $timeMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $timeMatch.$or.push({
                    $and: [
                        {
                            'promotion.createdBy.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'promotion.createdBy.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
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

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    'promotion.createdBy.user': {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    'promotion.branch': { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'promotion.branch',
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
                                en: '$$branch.name.en',
                                ar: '$$branch.name.ar',
                            },
                            subRegion: '$$branch.subRegion',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    'branch.subRegion': { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
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
                                en: '$$subRegion.name.en',
                                ar: '$$subRegion.name.ar',
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
                    'subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
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
                                en: '$$region.name.en',
                                ar: '$$region.name.ar',
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
                    'region.parent': { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
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
                                en: '$$country.name.en',
                                ar: '$$country.name.ar',
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                country: {
                    _id: '$country._id',
                    name: '$country.name',
                },
                location: {
                    $concat: ['$country.name.en', ' -> ', '$region.name.en', ' -> ', '$subRegion.name.en', ' -> ', '$branch.name.en'],
                },
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'displayTypes',
                localField: 'promotion.displayType',
                foreignField: '_id',
                as: 'displayType',
            },
        });

        pipeline.push({
            $project: {
                _id: '$promotion._id',
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                promotionType: 1,
                ppt: 1,
                dateStart: { $dateToString: { format: '%m/%d/%Y', date: '$dateStart' } },
                dateEnd: { $dateToString: { format: '%m/%d/%Y', date: '$dateEnd' } },
                createdBy: {
                    user: 1,
                    date: { $dateToString: { format: '%m/%d/%Y', date: '$createdBy.date' } },
                },
                displayType: { $arrayElemAt: ['$displayType', 0] },
                itemDateStart: { $dateToString: { format: '%m/%d/%Y', date: '$promotion.dateStart' } },
                itemDateEnd: { $dateToString: { format: '%m/%d/%Y', date: '$promotion.dateEnd' } },
                opening: '$promotion.opening',
                sellIn: '$promotion.sellIn',
                closingStock: '$promotion.closingStock',
                sellOut: '$promotion.sellOut',
            },
        });

        PromotionModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_PROMO_EVALUATION, cb);
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
                        <th>Branch</th>
                        <th>Promotion description</th>
                        <th>PPT, AED or $</th>
                        <th>Promotion Start</th>
                        <th>Promotion End</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Opening stock</th>
                        <th>Sell in</th>
                        <th>Closing stock</th>
                        <th>Sell out</th>
                        <th>Display type</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        const currentCountry = currency.defaultData.find((country) => {
                            return country._id.toString() === item.country._id.toString();
                        });
                        const itemPrice = parseFloat(item.ppt / currentCountry.currencyInUsd).toFixed(2);
                        return `
                            <tr>
                                <td>${item.country.name[currentLanguage]}</td>
                                <td>${item.region.name[currentLanguage]}</td>
                                <td>${item.subRegion.name[currentLanguage]}</td>
                                <td>${item.branch.name[currentLanguage]}</td>
                                <td>${striptags(_.unescape(item.promotionType[currentLanguage]))}</td>
                                <td>${itemPrice}</td>
                                <td>${item.dateStart}</td>
                                <td>${item.dateEnd}</td>
                                <td>${item.itemDateStart}</td>
                                <td>${item.itemDateEnd}</td>
                                <td>${item.opening}</td>
                                <td>${item.sellIn}</td>
                                <td>${item.closingStock}</td>
                                <td>${item.sellOut}</td>
                                <td>${item.displayType.name[currentLanguage]}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        /* eslint-enable */

        // res.status(200).send(verstka);

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
                    'Content-Disposition': `attachment; filename="promotionEvaluationReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};