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
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, CONTENT_TYPES.VARIANT, CONTENT_TYPES.ITEM,
            CONTENT_TYPES.POSITION, 'executorPosition', CONTENT_TYPES.PERSONNEL,
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

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    branches: { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branches',
                foreignField: '_id',
                as: 'branches',
            },
        });

        pipeline.push({
            $addFields: {
                subRegions: {
                    $map: {
                        input: '$branches',
                        as: 'item',
                        in: '$$item.subRegion',
                    },
                },
                retailSegments: {
                    $map: {
                        input: '$branches',
                        as: 'item',
                        in: '$$item.retailSegment',
                    },
                },
                outlets: {
                    $map: {
                        input: '$branches',
                        as: 'item',
                        in: '$$item.outlet',
                    },
                },
                branches: null,
            },
        });

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    subRegions: { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    retailSegments: { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    outlets: { $in: queryFilter[CONTENT_TYPES.OUTLET] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegions',
                foreignField: '_id',
                as: 'subRegions',
            },
        });

        pipeline.push({
            $addFields: {
                subRegions: null,
                retailSegments: null,
                outlets: null,
                regions: {
                    $map: {
                        input: '$subRegions',
                        as: 'item',
                        in: '$$item.parent',
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    regions: { $in: queryFilter[CONTENT_TYPES.REGION] },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'regions',
                foreignField: '_id',
                as: 'regions',
            },
        });

        pipeline.push({
            $addFields: {
                regions: null,
                countries: {
                    $map: {
                        input: '$regions',
                        as: 'item',
                        in: '$$item.parent',
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length) {
            pipeline.push({
                $match: {
                    countries: { $in: queryFilter[CONTENT_TYPES.COUNTRY] },
                },
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
            $lookup: {
                from: 'objectives',
                localField: 'objective',
                foreignField: '_id',
                as: 'objective',
            },
        });

        pipeline.push({
            $addFields: {
                countries: null,
                objective: {
                    $let: {
                        vars: {
                            objective: { $arrayElemAt: ['$objective', 0] },
                        },
                        in: '$$objective._id',
                    },
                },
                executors: {
                    $let: {
                        vars: {
                            objective: { $arrayElemAt: ['$objective', 0] },
                        },
                        in: '$$objective.assignedTo',
                    },
                },
            },
        });

        if (queryFilter[CONTENT_TYPES.PERSONNEL] && queryFilter[CONTENT_TYPES.PERSONNEL].length) {
            pipeline.push({
                $match: {
                    executors: {
                        $in: queryFilter[CONTENT_TYPES.PERSONNEL],
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'executors',
                foreignField: '_id',
                as: 'executors',
            },
        });

        pipeline.push({
            $addFields: {
                executors: null,
                executorPositions: {
                    $map: {
                        input: '$executors',
                        as: 'item',
                        in: '$$item.position',
                    },
                },
            },
        });

        if (queryFilter.executorPosition && queryFilter.executorPosition.length) {
            pipeline.push({
                $match: {
                    executorPositions: {
                        $in: queryFilter.executorPosition,
                    },
                },
            });
        }

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
                    'items.branches.branch': { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                },
            });
        }

        pipeline.push({
            $sort: {
                'createdBy.date': 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'items.branches.branch',
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
                            name: '$$branch.name',
                            retailSegment: '$$branch.retailSegment',
                            outlet: '$$branch.outlet',
                            subRegion: '$$branch.subRegion',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'branch.retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeline.push({
            $addFields: {
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
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'branch.outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeline.push({
            $addFields: {
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
            },
        });

        pipeline.push({
            $group: {
                _id: {
                    _id: '$_id',
                    variant: '$items.variant',
                    category: '$items.category',
                },
                items: {
                    $push: {
                        branch: '$branch',
                        indicator: '$items.branches.indicator',
                        retailSegment: '$retailSegment',
                        outlet: '$outlet',
                        timestamp: '$editedBy.date',
                    },
                },
                subRegion: { $addToSet: '$branch.subRegion' },
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
            $project: {
                _id: 1,
                total: 1,
                items: 1,
                region: '$subRegion.parent',
                subRegion: {
                    $reduce: {
                        input: '$subRegion',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $setIsSubset: [['$$this.name.en'], '$$value'],
                                },
                                then: '$$value',
                                else: {
                                    $setUnion: ['$$value', ['$$this.name.en']],
                                },
                            },
                        },
                    },
                },
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
            $project: {
                _id: 1,
                total: 1,
                items: 1,
                subRegion: 1,
                country: '$region.parent',
                region: {
                    $reduce: {
                        input: '$region',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $setIsSubset: [['$$this.name.en'], '$$value'],
                                },
                                then: '$$value',
                                else: {
                                    $setUnion: ['$$value', ['$$this.name.en']],
                                },
                            },
                        },
                    },
                },
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
            $project: {
                _id: 1,
                total: 1,
                items: 1,
                subRegion: 1,
                region: 1,
                country: {
                    $reduce: {
                        input: '$country',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $setIsSubset: [['$$this.name.en'], '$$value'],
                                },
                                then: '$$value',
                                else: {
                                    $setUnion: ['$$value', ['$$this.name.en']],
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'variants',
                localField: '_id.variant',
                foreignField: '_id',
                as: 'variant',
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
            $project: {
                _id: 0,
                items: 1,
                location: {
                    $concat: [
                        {
                            $reduce: {
                                input: '$country',
                                initialValue: {
                                    $arrayElemAt: ['$country', 0],
                                },
                                in: {
                                    $cond: {
                                        if: { $eq: ['$$this', '$$value'] },
                                        then: '$$value',
                                        else: { $concat: ['$$value', ', ', '$$this'] },
                                    },
                                },
                            },
                        },
                        ' -> ',
                        {
                            $reduce: {
                                input: '$region',
                                initialValue: {
                                    $arrayElemAt: ['$region', 0],
                                },
                                in: {
                                    $cond: {
                                        if: { $eq: ['$$this', '$$value'] },
                                        then: '$$value',
                                        else: { $concat: ['$$value', ', ', '$$this'] },
                                    },
                                },
                            },
                        },
                        ' -> ',
                        {
                            $reduce: {
                                input: '$subRegion',
                                initialValue: {
                                    $arrayElemAt: ['$subRegion', 0],
                                },
                                in: {
                                    $cond: {
                                        if: { $eq: ['$$this', '$$value'] },
                                        then: '$$value',
                                        else: { $concat: ['$$value', ', ', '$$this'] },
                                    },
                                },
                            },
                        },
                    ],
                },
                total: 1,
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
            },
        });

        pipeline.push({
            $unwind: '$items',
        });

        pipeline.push({
            $sort: {
                'items.timestamp': 1,
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
                        <th>Location</th>
                        <th>Category</th>
                        <th>Variant</th>
                        <th>Trade Channel</th>
                        <th>Outlet</th>
                        <th>Branch</th>
                        <th>Indicator</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        return `
                            <tr>
                                <td>${item.location}</td>
                                <td>${item.category.name[currentLanguage]}</td>
                                <td>${item.variant.name[currentLanguage]}</td>
                                <td>${item.items.retailSegment.name[currentLanguage]}</td>
                                <td>${item.items.outlet.name[currentLanguage]}</td>
                                <td>${item.items.branch.name[currentLanguage]}</td>
                                <td>${item.items.indicator}</td>
                                <td>${moment(item.items.timestamp).format('DD MMMM, YYYY')}</td>
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
                    'Content-Disposition': `attachment; filename="distributionListReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });

    });
};
