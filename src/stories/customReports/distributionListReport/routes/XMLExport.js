const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const DistributionFormModel = require('./../../../../types/distributionForm/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');

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
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT, CONTENT_TYPES.ITEM,
            CONTENT_TYPES.POSITION, 'executorPosition', 'executor', CONTENT_TYPES.PERSONNEL,
        ];

        currentLanguage = personnel.currentLanguage || 'en';

        const pipeline = [{
            $project: {
                objective                 : 1,
                branches                  : 1,
                'items.category'          : 1,
                'items.variant'           : 1,
                'items.item'              : 1,
                'items.branches.branch'   : 1,
                'items.branches.indicator': 1,
                publisher                 : '$createdBy.user',
                createdAt                 : '$createdBy.date',
                updatedAt                 : '$editedBy.date',
            },
        }];

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({timeFrames: timeFilter});

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

        const $timeMatch = {
            $or: timeFilter.map((frame) => {
                return {
                    $and: [
                        {createdAt: {$gt: moment(frame.from, 'MM/DD/YYYY')._d}},
                        {createdAt: {$lt: moment(frame.to, 'MM/DD/YYYY')._d}},
                    ],
                };
            }),
        };

        if ($timeMatch.$or.length) {
            pipeline.push({
                $match: $timeMatch,
            });
        }

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    branches: {$in: queryFilter[CONTENT_TYPES.BRANCH]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    publisher: {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'publisher',
                foreignField: '_id',
                as          : 'publisher',
            },
        });

        pipeline.push({
            $addFields: {
                publisher: {
                    $let: {
                        vars: {
                            publisher: {$arrayElemAt: ['$publisher', 0]},
                        },
                        in  : {
                            _id     : '$$publisher._id',
                            name    : {
                                en: {$concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en']},
                                ar: {$concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar']},
                            },
                            position: '$$publisher.position',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.POSITION] && queryFilter[CONTENT_TYPES.POSITION].length) {
            pipeline.push({
                $match: {
                    'publisher.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from        : 'positions',
                localField  : 'publisher.position',
                foreignField: '_id',
                as          : 'publisher.position',
            },
        });

        pipeline.push({
            $addFields: {
                'publisher.position': {
                    $let: {
                        vars: {
                            position: {$arrayElemAt: ['$publisher.position', 0]},
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
            $lookup: {
                from        : 'objectives',
                localField  : 'objective',
                foreignField: '_id',
                as          : 'objective',
            },
        });

        pipeline.push({
            $addFields: {
                countries: null,
                objective: {
                    $let: {
                        vars: {
                            objective: {$arrayElemAt: ['$objective', 0]},
                        },
                        in  : '$$objective._id',
                    },
                },
                assignee : {
                    $let: {
                        vars: {
                            objective: {$arrayElemAt: ['$objective', 0]},
                        },
                        in  : '$$objective.assignedTo',
                    },
                },
            },
        });

        if (queryFilter.executor && queryFilter.executor.length) {
            pipeline.push({
                $match: {
                    assignee: {
                        $in: queryFilter.executor,
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'assignee',
                foreignField: '_id',
                as          : 'assignee',
            },
        });

        pipeline.push({
            $addFields: {
                assignee: {
                    $let: {
                        vars: {
                            assignee: {$arrayElemAt: ['$assignee', 0]},
                        },
                        in  : {
                            _id     : '$$assignee._id',
                            name    : {
                                en: {$concat: ['$$assignee.firstName.en', ' ', '$$assignee.lastName.en']},
                                ar: {$concat: ['$$assignee.firstName.ar', ' ', '$$assignee.lastName.ar']},
                            },
                            position: '$$assignee.position',
                        },
                    },
                },
            },
        });

        // some objectives contains not existing users
        pipeline.push({
            $match: {'assignee._id': {$ne: null}},
        });

        if (queryFilter.executorPosition && queryFilter.executorPosition.length) {
            pipeline.push({
                $match: {
                    'assignee.position': {
                        $in: queryFilter.executorPosition,
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from        : 'positions',
                localField  : 'assignee.position',
                foreignField: '_id',
                as          : 'assignee.position',
            },
        });

        pipeline.push({
            $addFields: {
                'assignee.position': {
                    $let: {
                        vars: {
                            position: {$arrayElemAt: ['$assignee.position', 0]},
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
            $unwind: '$items',
        });

        if (queryFilter[CONTENT_TYPES.CATEGORY] && queryFilter[CONTENT_TYPES.CATEGORY].length) {
            pipeline.push({
                $match: {
                    'items.category': {
                        $in: queryFilter[CONTENT_TYPES.CATEGORY],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.VARIANT] && queryFilter[CONTENT_TYPES.VARIANT].length) {
            pipeline.push({
                $match: {
                    'items.variant': {
                        $in: queryFilter[CONTENT_TYPES.VARIANT],
                    },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.ITEM] && queryFilter[CONTENT_TYPES.ITEM].length) {
            pipeline.push({
                $match: {
                    'items.item': {
                        $in: queryFilter[CONTENT_TYPES.ITEM],
                    },
                },
            });
        }

        pipeline.push({
            $unwind: '$items.branches',
        });

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    'items.branches.branch': {$in: queryFilter[CONTENT_TYPES.BRANCH]},
                },
            });
        }

        pipeline.push({
            $sort: {
                createdAt: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'branches',
                localField  : 'items.branches.branch',
                foreignField: '_id',
                as          : 'branch',
            },
        });

        pipeline.push({
            $addFields: {
                branch: {
                    $let: {
                        vars: {
                            branch: {$arrayElemAt: ['$branch', 0]},
                        },
                        in  : {
                            _id          : '$$branch._id',
                            name         : '$$branch.name',
                            retailSegment: '$$branch.retailSegment',
                            outlet       : '$$branch.outlet',
                            subRegion    : '$$branch.subRegion',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    'branch.subRegion': {$in: queryFilter[CONTENT_TYPES.SUBREGION]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    'branch.retailSegment': {$in: queryFilter[CONTENT_TYPES.RETAILSEGMENT]},
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    'branch.outlet': {$in: queryFilter[CONTENT_TYPES.OUTLET]},
                },
            });
        }

        pipeline.push({
            $lookup: {
                from        : 'retailSegments',
                localField  : 'branch.retailSegment',
                foreignField: '_id',
                as          : 'retailSegment',
            },
        });

        pipeline.push({
            $addFields: {
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
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'outlets',
                localField  : 'branch.outlet',
                foreignField: '_id',
                as          : 'outlet',
            },
        });

        pipeline.push({
            $addFields: {
                outlet: {
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
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'domains',
                localField  : 'branch.subRegion',
                foreignField: '_id',
                as          : 'subRegion',
            },
        });

        pipeline.push({
            $addFields: {
                subRegion: {
                    $let: {
                        vars: {
                            subRegion: {$arrayElemAt: ['$subRegion', 0]},
                        },
                        in  : {
                            name  : '$$subRegion.name',
                            parent: '$$subRegion.parent',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    'subRegion.parent': {$in: queryFilter[CONTENT_TYPES.REGION]},
                },
            });
        }

        pipeline.push({
            $lookup: {
                from        : 'domains',
                localField  : 'subRegion.parent',
                foreignField: '_id',
                as          : 'region',
            },
        });

        pipeline.push({
            $addFields: {
                region: {
                    $let: {
                        vars: {
                            region: {$arrayElemAt: ['$region', 0]},
                        },
                        in  : {
                            name  : '$$region.name',
                            parent: '$$region.parent',
                        },
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    'region.parent': {$in: queryFilter[CONTENT_TYPES.COUNTRY]},
                },
            });
        }

        pipeline.push({
            $lookup: {
                from        : 'domains',
                localField  : 'region.parent',
                foreignField: '_id',
                as          : 'country',
            },
        });

        pipeline.push({
            $addFields: {
                country : {$arrayElemAt: ['$country', 0]},
                location: {
                    $let: {
                        vars: {
                            country: {$arrayElemAt: ['$country', 0]},
                        },
                        in  : {
                            en: {
                                $concat: [
                                    '$$country.name.en',
                                    ' -> ',
                                    '$region.name.en',
                                    ' -> ',
                                    '$subRegion.name.en',
                                ],
                            },
                            ar: {
                                $concat: [
                                    '$$country.name.ar',
                                    ' -> ',
                                    '$region.name.ar',
                                    ' -> ',
                                    '$subRegion.name.ar',
                                ],
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $sort: {
                location: 1,
                editedAt: 1,
            },
        });

        pipeline.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                outlet       : 1,
                retailSegment: 1,
                branch       : 1,
                category     : '$items.category',
                variant      : '$items.variant',
                item         : '$items.item',
                indicator    : '$items.branches.indicator',
                publisher    : '$publisher',
                assignee     : '$assignee',
                timestamp    : '$editedBy.date',
                objective    : 1,
            },
        });

        pipeline.push({
            $lookup: {
                from        : 'variants',
                localField  : 'variant',
                foreignField: '_id',
                as          : 'variant',
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
                from        : 'items',
                localField  : 'item',
                foreignField: '_id',
                as          : 'item',
            },
        });

        pipeline.push({
            $addFields: {
                category: {
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
                variant : {
                    $let: {
                        vars: {
                            variant: {$arrayElemAt: ['$variant', 0]},
                        },
                        in  : {
                            _id : '$$variant._id',
                            name: '$$variant.name',
                        },
                    },
                },
                item    : {
                    $let: {
                        vars: {
                            item: {$arrayElemAt: ['$item', 0]},
                        },
                        in  : {
                            _id    : '$$item._id',
                            name   : '$$item.name',
                            packing: '$$item.packing',
                        },
                    },
                },
            },
        });

        DistributionFormModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVES_AND_TASKS_FORM, cb);
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
                        <th>Trade Channel</th>
                        <th>Outlet</th>
                        <th>Branch</th>
                        <th>Category</th>
                        <th>Variant</th>
                        <th>Item</th>
                        <th>Weight</th>
                        <th>Indicator</th>
                        <th>Timestamp</th>
                        <th>Publisher</th>
                        <th>Assignee</th>
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
                                <td>${item.category.name[currentLanguage]}</td>
                                <td>${item.variant.name[currentLanguage]}</td>
                                <td>${item.item.name[currentLanguage]}</td>
                                <td>${item.item.packing}</td>
                                <td>${item.indicator}</td>
                                <td>${moment(item.timestamp).format('DD MMMM, YYYY')}</td>
                                <td>${item.publisher.name[currentLanguage]}</td>
                                <td>${item.assignee.name[currentLanguage]}</td>
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
                    'Content-Disposition': `attachment; filename="distributionListReportExport_${new Date()}.xls"`,
                    'Content-Length'     : buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
