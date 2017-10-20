const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const CompetitorBrandingModel = require('./../../../../types/competitorBranding/model');
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

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.BRAND, CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];

        currentLanguage = personnel.currentLanguage || 'en';

        const pipeline = [];

        pipeline.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                category     : 1,
                brand        : 1,
                displayType  : 1,
                dateStart    : 1,
                dateEnd      : 1,
                description  : 1,
                createdBy    : 1,
            },
        });

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
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.DISPLAY_TYPE,
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

        const $timeMatch = {
            $or: timeFilter.map((frame) => {
                return {
                    $and: [
                        {'createdBy.date': {$gt: moment(frame.from, 'MM/DD/YYYY')._d}},
                        {'createdBy.date': {$lt: moment(frame.to, 'MM/DD/YYYY')._d}},
                    ],
                };
            }),
        };

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
            $addFields: {
                country                  : {
                    $let: {
                        vars: {
                            country: {
                                $arrayElemAt: ['$country', 0],
                            },
                        },
                        in  : {
                            _id : '$$country._id',
                            name: '$$country.name',
                        },
                    },
                },
                region                   : {
                    $let: {
                        vars: {
                            region: {
                                $arrayElemAt: ['$region', 0],
                            },
                        },
                        in  : {
                            _id : '$$region._id',
                            name: '$$region.name',
                        },
                    },
                },
                subRegion                : {
                    $let: {
                        vars: {
                            subRegion: {
                                $arrayElemAt: ['$subRegion', 0],
                            },
                        },
                        in  : {
                            _id : '$$subRegion._id',
                            name: '$$subRegion.name',
                        },
                    },
                },
                retailSegment            : {
                    $let: {
                        vars: {
                            retailSegment: {
                                $arrayElemAt: ['$retailSegment', 0],
                            },
                        },
                        in  : {
                            _id : '$$retailSegment._id',
                            name: '$$retailSegment.name',
                        },
                    },
                },
                outlet                   : {
                    $let: {
                        vars: {
                            outlet: {
                                $arrayElemAt: ['$outlet', 0],
                            },
                        },
                        in  : {
                            _id : '$$outlet._id',
                            name: '$$outlet.name',
                        },
                    },
                },
                branch                   : {
                    $let: {
                        vars: {
                            branch: {
                                $arrayElemAt: ['$branch', 0],
                            },
                        },
                        in  : {
                            _id : '$$branch._id',
                            name: '$$branch.name',
                        },
                    },
                },
                'createdBy.user.position': {
                    $let: {
                        vars: {
                            position: {$arrayElemAt: ['$createdBy.user.position', 0]},
                        },
                        in  : {
                            _id : '$$position._id',
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
            $addFields: {
                location: {
                    en: {
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
                    ar: {
                        $concat: [
                            '$country.name.ar',
                            ' -> ',
                            '$region.name.ar',
                            ' -> ',
                            '$subRegion.name.ar',
                            ' -> ',
                            '$retailSegment.name.ar',
                            ' -> ',
                            '$outlet.name.ar',
                        ],
                    },
                },
            },
        });

        pipeline.push({
            $sort: {
                location     : 1,
                'branch.name': 1,
            },
        });

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
                from        : 'displayTypes',
                localField  : 'displayType',
                foreignField: '_id',
                as          : 'displayType',
            },
        });

        pipeline.push({
            $project: {
                _id          : 1,
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                category     : {
                    $reduce: {
                        input       : '$category',
                        initialValue: {
                            $let: {
                                vars: {
                                    category: {
                                        $arrayElemAt: ['$category', 0],
                                    },
                                },
                                in  : `$$category.name.${currentLanguage}`,
                            },
                        },
                        in          : {
                            $cond: {
                                if  : {
                                    $eq: [`$$this.name.${currentLanguage}`, '$$value'],
                                },
                                then: '$$value',
                                else: {
                                    $concat: ['$$value', ', ', `$$this.name.${currentLanguage}`],
                                },
                            },
                        },
                    },
                },
                brand        : {
                    $let: {
                        vars: {
                            brand: {
                                $arrayElemAt: ['$brand', 0],
                            },
                        },
                        in  : {
                            _id : '$$brand._id',
                            name: '$$brand.name',
                        },
                    },
                },
                displayType  : {
                    $reduce: {
                        input       : '$displayType',
                        initialValue: {
                            $let: {
                                vars: {
                                    displayType: {
                                        $arrayElemAt: ['$displayType', 0],
                                    },
                                },
                                in  : `$$displayType.name.${currentLanguage}`,
                            },
                        },
                        in          : {
                            $cond: {
                                if  : {
                                    $eq: [`$$this.name.${currentLanguage}`, '$$value'],
                                },
                                then: '$$value',
                                else: {
                                    $concat: ['$$value', ', ', `$$this.name.${currentLanguage}`],
                                },
                            },
                        },
                    },
                },
                dateStart    : {$dateToString: {format: '%m/%d/%Y', date: '$dateStart'}},
                dateEnd      : {$dateToString: {format: '%m/%d/%Y', date: '$dateEnd'}},
                description  : 1,
                createdBy    : 1,
            },
        });

        CompetitorBrandingModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.COMPETITOR_BRANDING_DISPLAY_REPORT, cb);
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
                        <th>Product</th>
                        <th>Brand</th>
                        <th>Display Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
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
                                <td>${item.category || 'N/A'}</td>
                                <td>${item.brand.name[currentLanguage]}</td>
                                <td>${item.displayType}</td>
                                <td>${item.dateStart || 'N/A'}</td>
                                <td>${item.dateEnd || 'N/A'}</td>
                                <td>${sanitizeHtml(item.description[currentLanguage])}</td>
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
                    'Content-Disposition': `attachment; filename="competitorBrandingReportExport_${new Date()}.xls"`,
                    'Content-Length'     : buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
