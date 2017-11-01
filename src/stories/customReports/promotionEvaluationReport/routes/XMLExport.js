const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const _ = require('lodash');
const mongoose = require('mongoose');
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
    let currentLanguage;

    const query = req.body;
    const queryFilter = query.filter || {};
    const timeFilter = query.timeFilter;

    const queryRun = (personnel, callback) => {
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

        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY,
            'displayType',
            CONTENT_TYPES.POSITION,
            'publisher',
            'employee',
            CONTENT_TYPES.PROMOTIONS,
        ].forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        locationFiler(pipeline, personnel, queryFilter);

        const $generalMatch = generalFiler([
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.CATEGORY,
            'displayType',
            'status',
            CONTENT_TYPES.PROMOTIONS,
        ], queryFilter);

        if (queryFilter.publisher && queryFilter.publisher.length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter.publisher,
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.PROMOTIONS}.length`)) {
            $generalMatch.$and.push({
                _id: {
                    $in: queryFilter[CONTENT_TYPES.PROMOTIONS],
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

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    country: { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
                },
            });
        }

        pipeline.push({
            $project: {
                _id: 1,
                promotionType: 1,
                ppt: 1,
                comments: 1,
                dateStart: 1,
                dateEnd: 1,
                parentCountry: '$country',
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
                from: 'positions',
                localField: 'createdBy.user.position',
                foreignField: '_id',
                as: 'position',
            },
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

        pipeline.push({
            $lookup: {
                from: CONTENT_TYPES.PROMOTIONSITEMS,
                localField: '_id',
                foreignField: 'promotion',
                as: 'promotion',
            },
        });

        pipeline.push({
            $unwind: {
                path: '$promotion',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (queryFilter.employee && queryFilter.employee.length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'promotion.createdBy.user': {
                            $in: queryFilter.employee,
                        },
                    }, {
                        promotion: null,
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'promotion.branch': {
                            $in: queryFilter[CONTENT_TYPES.BRANCH],
                        },
                    }, {
                        promotion: null,
                    }],
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
                        'branch.subRegion': {
                            $in: queryFilter[CONTENT_TYPES.SUBREGION],
                        },
                    }, {
                        promotion: null,
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.retailSegment': {
                            $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                        },
                    }, {
                        promotion: null,
                    }],
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    $or: [{
                        'branch.outlet': {
                            $in: queryFilter[CONTENT_TYPES.OUTLET],
                        },
                    }, {
                        promotion: null,
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
                    $or: [{
                        'subRegion.parent': {
                            $in: queryFilter[CONTENT_TYPES.REGION],
                        },
                    }, {
                        promotion: null,
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
                                en: '$$region.name.en',
                                ar: '$$region.name.ar',
                            },
                            parent: '$$region.parent',
                        },
                    },
                },
            },
        });

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
                'branch.name': 1,
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
                comment: '$promotion.comment',
                retailSegment: 1,
                outlet: 1,
                subRegion: 1,
                branch: 1,
                promotionType: 1,
                ppt: 1,
                dateStart: { $dateToString: { format: '%m/%d/%Y', date: '$dateStart' } },
                dateEnd: { $dateToString: { format: '%m/%d/%Y', date: '$dateEnd' } },
                createdBy: {
                    user: {
                        _id: 1,
                        name: 1,
                        position: {
                            $let: {
                                vars: {
                                    position: { $arrayElemAt: ['$position', 0] },
                                },
                                in: {
                                    _id: '$$position._id',
                                    name: '$$position.name',
                                },
                            },
                        },
                    },
                    date: { $dateToString: { format: '%m/%d/%Y', date: '$createdBy.date' } },
                },
                displayType: { $ifNull: [{ $arrayElemAt: ['$displayType', 0] }, 'N/A'] },
                itemDateStart: { $dateToString: { format: '%m/%d/%Y', date: '$promotion.dateStart' } },
                itemDateEnd: { $dateToString: { format: '%m/%d/%Y', date: '$promotion.dateEnd' } },
                itemRsp: '$promotion.rsp',
                opening: { $arrayElemAt: ['$promotion.opening', 0] },
                sellIn: { $arrayElemAt: ['$promotion.sellIn', 0] },
                closingStock: { $arrayElemAt: ['$promotion.closingStock', 0] },
                sellOut: { $arrayElemAt: ['$promotion.sellOut', 0] },
                assignee: '$promotion.createdBy.user',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'assignee',
                foreignField: '_id',
                as: 'assignee',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'comments',
                localField: 'comment',
                foreignField: '_id',
                as: 'comment',
            },
        });

        pipeline.push({
            $addFields: {
                comment: {
                    $let: {
                        vars: {
                            comment: { $arrayElemAt: ['$comment', 0] },
                        },
                        in: {
                            _id: '$$comment._id',
                            body: '$$comment.body',
                            createdBy: '$$comment.createdBy',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'comment.createdBy.user',
                foreignField: '_id',
                as: 'comment.createdBy.user',
            },
        });

        pipeline.push({
            $addFields: {
                comment: {
                    $let: {
                        vars: {
                            comment: '$comment',
                        },
                        in: {
                            _id: '$$comment._id',
                            body: '$$comment.body',
                            createdBy: {
                                user: {
                                    $let: {
                                        vars: {
                                            user: { $arrayElemAt: ['$$comment.createdBy.user', 0] },
                                        },
                                        in: {
                                            _id: '$$user._id',
                                            firstName: '$$user.firstName',
                                            lastName: '$$user.lastName',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                assignee: {
                    $let: {
                        vars: {
                            user: { $arrayElemAt: ['$assignee', 0] },
                        },
                        in: {
                            _id: '$$user._id',
                            name: {
                                en: { $ifNull: [{ $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'] }, 'N/A'] },
                                ar: { $ifNull: [{ $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'] }, 'N/A'] },
                            },
                        },
                    },
                },
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
                        <th>Trade channel</th>
                        <th>Customer</th>
                        <th>Branch</th>
                        <th>Publisher</th>                       
                        <th>Position</th>
                        <th>Assignee</th>
                        <th>Promotion description</th>
                        <th>PPT, AED or $</th>
                        <th>RSP</th>
                        <th>Promotion Start</th>
                        <th>Promotion End</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Opening stock</th>
                        <th>Sell in</th>
                        <th>Closing stock</th>
                        <th>Sell out</th>
                        <th>Display type</th>
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        let itemPrice =  (item.ppt || 0).toFixed(2);
                        let itemRsp = (item.itemRsp || 0).toFixed(2);
                        if (item.country._id){
                            const currentCountry = currency.defaultData.find((country) => {
                                return country._id.toString() === item.country._id.toString();
                            });
                            if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length > 1) {
                                itemPrice = parseFloat(itemPrice * currentCountry.currencyInUsd).toFixed(2);
                                itemPrice = `${itemPrice} $`;
                            } else {
                                itemPrice = `${itemPrice} ${currentCountry.currency}`;
                            }
    
                            if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length > 1) {
                                itemRsp = parseFloat(itemRsp * currentCountry.currencyInUsd).toFixed(2);
                                itemRsp = `${itemRsp} $`;
                            } else {
                                itemRsp = `${itemRsp} ${currentCountry.currency}`;
                            }
                        }
                        
                        const comments = item.comment && item.comment.createdBy.user.firstName ? `${item.comment.createdBy.user.firstName[currentLanguage]} ${item.comment.createdBy.user.lastName[currentLanguage]} : ${sanitizeHtml(item.comment.body)}` : '';
                        return `
                            <tr>
                                <td>${item.country.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.region.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.subRegion.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.retailSegment.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.outlet.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.branch.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.createdBy.user.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.createdBy.user.position.name[currentLanguage] || 'N/A'}</td>
                                <td>${item.assignee.name[currentLanguage] || 'N/A'}</td>
                                <td>${sanitizeHtml(item.promotionType[currentLanguage]  || 'N/A').trim()}</td>
                                <td>${itemPrice || 0}</td>
                                <td>${itemRsp || 0}</td>
                                <td>${item.dateStart || 'N/A'}</td>
                                <td>${item.dateEnd || 'N/A'}</td>
                                <td>${item.itemDateStart || 'N/A'}</td>
                                <td>${item.itemDateEnd || 'N/A'}</td>
                                <td>${item.opening || 0}</td>
                                <td>${item.sellIn || 0}</td>
                                <td>${item.closingStock || 0}</td>
                                <td>${item.sellOut || 0}</td>
                                <td>${item.displayType.name ? item.displayType.name[currentLanguage] : 'N/A'}</td>
                                <td>${comments || 'N/A'}</td>
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
