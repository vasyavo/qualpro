const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PromotionModel = require('./../../../../types/promotion/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const applyAnalyzeBy = require('./../components/analyzeBy/index');
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

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const analyzeByParam = query.analyzeBy;

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
            CONTENT_TYPES.PROMOTIONS,
            CONTENT_TYPES.POSITION,
            'publisher',
            'employee',
            CONTENT_TYPES.CATEGORY,
            'displayType',
        ].forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        const pipeline = [];

        if (_.get(queryFilter, `${CONTENT_TYPES.PROMOTIONS}.length`)) {
            pipeline.push({
                $match: {
                    _id: queryFilter[CONTENT_TYPES.PROMOTIONS][0],
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    title: '$promotionType',
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    status: 1,
                    publisher: '$createdBy.user',
                    createdAt: '$createdBy.date',
                    product: '$category',
                    displayType: 1,
                },
            },
            {
                $match: {
                    $and: [{
                        $or: timeFilter.map(frame => {
                            return {
                                $and: [
                                    { createdAt: { $gt: moment(frame.from, 'MM/DD/YYYY')._d } },
                                    { createdAt: { $lt: moment(frame.to, 'MM/DD/YYYY')._d } },
                                ],
                            };
                        }),
                    }, {
                        status: { $ne: 'draft' },
                    }],
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            pipeline.push({
                $match: {
                    country: {
                        $in: queryFilter[CONTENT_TYPES.COUNTRY],
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.CATEGORY}.length`)) {
            pipeline.push({
                $match: {
                    product: {
                        $in: queryFilter[CONTENT_TYPES.CATEGORY],
                    },
                },
            });
        }

        if (_.get(queryFilter, 'displayType.length')) {
            pipeline.push({
                $match: {
                    displayType: {
                        $in: queryFilter.displayType,
                    },
                },
            });
        }

        if (_.get(queryFilter, 'status.length')) {
            pipeline.push({
                $match: {
                    status: {
                        $in: queryFilter.status,
                    },
                },
            });
        }

        pipeline.push({
            $project: {
                _id: 1,
                title: 1,
                country: ['$country'],
                region: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ['$region', []] } }, 0] },
                        then: { selected: '$region' },
                        else: { all: 'region' },
                    },
                },
                subRegion: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ['$subRegion', []] } }, 0] },
                        then: { selected: '$subRegion' },
                        else: { all: 'subRegion' },
                    },
                },
                branch: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ['$branch', []] } }, 0] },
                        then: { selected: '$branch' },
                        else: { all: 'branch' },
                    },
                },
                status: 1,
                publisher: 1,
                product: 1,
                displayType: 1,
            },
        });

        if (_.get(queryFilter, 'publisher.length')) {
            pipeline.push({
                $match: {
                    publisher: {
                        $in: queryFilter.publisher,
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $lookup: {
                    from: 'personnels',
                    localField: 'publisher',
                    foreignField: '_id',
                    as: 'publisher',
                },
            },
            {
                $addFields: {
                    publisher: {
                        $let: {
                            vars: {
                                publisher: { $arrayElemAt: ['$publisher', 0] },
                            },
                            in: {
                                _id: '$$publisher._id',
                                name: {
                                    en: { $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'] },
                                    ar: { $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'] },
                                },
                                position: '$$publisher.position',
                            },
                        },
                    },
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.POSITION}.length`)) {
            pipeline.push({
                $match: {
                    'publisher.position': {
                        $in: queryFilter[CONTENT_TYPES.POSITION],
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'publisher.position',
                    foreignField: '_id',
                    as: 'publisher.position',
                },
            },
            {
                $addFields: {
                    'publisher.position': {
                        $let: {
                            vars: {
                                position: { $arrayElemAt: ['$publisher.position', 0] },
                            },
                            in: {
                                _id: '$$position._id',
                                name: '$$position.name',
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $lookup: {
                from: 'promotionsItems',
                localField: '_id',
                foreignField: 'promotion',
                as: 'items',
            },
        });

        {
            const mapItemsByAssignee = {
                $map: {
                    input: '$items',
                    as: 'item',
                    in: {
                        _id: '$$item._id',
                        publisher: '$$item.createdBy.user',
                    },
                },
            };

            if (_.get(queryFilter, 'employee.length')) {
                mapItemsByAssignee.$map.input = {
                    $let: {
                        vars: {
                            assignee: queryFilter.employee,
                        },
                        in: {
                            $filter: {
                                input: '$items',
                                as: 'item',
                                cond: {
                                    $setIsSubset: [['$$item.createdBy.user'], '$$assignee'],
                                },
                            },
                        },
                    },
                };
            }

            pipeline.push(...[
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        country: 1,
                        region: 1,
                        subRegion: 1,
                        branch: 1,
                        status: 1,
                        publisher: 1,
                        product: 1,
                        displayType: 1,
                        items: mapItemsByAssignee,
                    },
                },
                {
                    $addFields: {
                        items: '$items._id',
                        assignee: {
                            $setUnion: ['$items.publisher', []],
                        },
                    },
                },
            ]);
        }

        pipeline.push(...[
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$country',
                                    as: 'country',
                                    cond: {
                                        $eq: ['$$country.archived', false],
                                    },
                                },
                            },
                            as: 'country',
                            in: '$$country._id',
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.selected',
                foreignField: '_id',
                as: 'region.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields['region.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region.selected',
                                        as: 'region',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$region.archived', false] },
                                                { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            } else {
                $addFields['region.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$region.selected',
                                as: 'region',
                                cond: {
                                    $eq: ['$$region.archived', false],
                                },
                            },
                        },
                        as: 'region',
                        in: '$$region._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.all',
                foreignField: 'type',
                as: 'region.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields.region = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$region.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$region.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$region.all',
                                                as: 'region',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$region.archived', false] },
                                                        { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'region',
                                        in: '$$region._id',
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.region = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$region.selected', []],
                                },
                            }, 0],
                        },
                        then: '$region.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region.all',
                                        as: 'region',
                                        cond: {
                                            $eq: ['$$region.archived', false],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            pipeline.push(...[
                {
                    $addFields: {
                        acceptable: {
                            $let: {
                                vars: {
                                    filters: {
                                        region: queryFilter[CONTENT_TYPES.REGION],
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$region',
                                                        as: 'region',
                                                        cond: {
                                                            $setIsSubset: [['$$region'], '$$filters.region'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.selected',
                foreignField: '_id',
                as: 'subRegion.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields['subRegion.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion.selected',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            } else {
                $addFields['subRegion.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$subRegion.selected',
                                as: 'subRegion',
                                cond: {
                                    $and: [
                                        { $eq: ['$$subRegion.archived', false] },
                                        { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                    ],
                                },
                            },
                        },
                        as: 'subRegion',
                        in: '$$subRegion._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.all',
                foreignField: 'type',
                as: 'subRegion.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields.subRegion = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$subRegion.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$subRegion.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$subRegion.all',
                                                as: 'subRegion',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$subRegion.archived', false] },
                                                        { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'subRegion',
                                        in: '$$subRegion._id',
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.subRegion = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$subRegion.selected', []],
                                },
                            }, 0],
                        },
                        then: '$subRegion.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion.all',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
            pipeline.push(...[
                {
                    $addFields: {
                        acceptable: {
                            $let: {
                                vars: {
                                    filters: {
                                        subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$subRegion',
                                                        as: 'subRegion',
                                                        cond: {
                                                            $setIsSubset: [['$$subRegion'], '$$filters.subRegion'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branch.selected',
                foreignField: '_id',
                as: 'branch.selected',
            },
        });
        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields['branch.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch.selected',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields['branch.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$branch.selected',
                                as: 'branch',
                                cond: {
                                    $and: [
                                        { $eq: ['$$branch.archived', false] },
                                        { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                    ],
                                },
                            },
                        },
                        as: 'branch',
                        in: {
                            _id: '$$branch._id',
                            retailSegment: '$$branch.retailSegment',
                            outlet: '$$branch.outlet',
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    'branch.selected': {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    'branch.selected': {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'subRegion',
                foreignField: 'subRegion',
                as: 'branch.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields.branch = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$branch.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$branch.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$branch.all',
                                                as: 'branch',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$branch.archived', false] },
                                                        { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'branch',
                                        in: {
                                            _id: '$$branch._id',
                                            retailSegment: '$$branch.retailSegment',
                                            outlet: '$$branch.outlet',
                                        },
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.branch = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$branch.selected', []],
                                },
                            }, 0],
                        },
                        then: '$branch.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch.all',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                branch: '$branch._id',
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.BRANCH}.length`)) {
            pipeline.push(...[
                {
                    $group: {
                        _id: null,
                        reports: { $push: '$$ROOT' },
                    },
                },
                {
                    $project: {
                        _id: false,
                        reports: 1,
                        matchedReports: {
                            $let: {
                                vars: {
                                    filters: {
                                        branch: queryFilter[CONTENT_TYPES.BRANCH],
                                    },
                                },
                                in: {
                                    $filter: {
                                        input: '$reports',
                                        as: 'report',
                                        cond: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$$report.branch',
                                                        as: 'branch',
                                                        cond: {
                                                            $setIsSubset: [['$$report.branch'], '$$filters.branch'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                /*
                 * tip: key thing is that if at least one report match condition then it's true condition,
                 * else condition is incorrect and branches with one of provided trade channel or outlet aren't exists.
                 */
                {
                    $project: {
                        reports: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$matchedReports',
                                    }, 0],
                                },
                                then: '$matchedReports',
                                else: '$reports',
                            },
                        },
                    },
                },
                {
                    $unwind: {
                        path: '$reports',
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: '$reports',
                    },
                },
            ]);
        }

        pipeline.push({
            $project: {
                _id: 1,
                title: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                retailSegment: 1,
                outlet: 1,
                status: 1,
                publisher: 1,
                items: 1,
                assignee: 1,
                product: 1,
                displayType: 1,
            },
        });

        pipeline.push(...[
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: '$country',
                            as: 'country',
                            in: {
                                _id: '$$country._id',
                                name: '$$country.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'personnels',
                    localField: 'assignee',
                    foreignField: '_id',
                    as: 'assignee',
                },
            },
            {
                $addFields: {
                    assignee: {
                        $filter: {
                            input: {
                                $map: {
                                    input: '$assignee',
                                    as: 'assignee',
                                    in: {
                                        _id: '$$assignee._id',
                                        name: {
                                            en: { $concat: ['$$assignee.firstName.en', ' ', '$$assignee.lastName.en'] },
                                            ar: { $concat: ['$$assignee.firstName.ar', ' ', '$$assignee.lastName.ar'] },
                                        },
                                        position: '$$assignee.position',
                                    },
                                },
                            },
                            as: 'assignee',
                            cond: {
                                $ne: ['$$assignee.position', null],
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'positions',
                    localField: 'assignee.position',
                    foreignField: '_id',
                    as: 'assigneePosition',
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    country: { $arrayElemAt: ['$country', 0] },
                    branch: 1,
                    product: 1,
                    displayType: 1,
                    publisher: 1,
                    assignee: {
                        $map: {
                            input: '$assignee',
                            as: 'assignee',
                            in: {
                                _id: '$$assignee._id',
                                name: '$$assignee.name',
                                position: {
                                    $arrayElemAt: [{
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$assigneePosition',
                                                    as: 'position',
                                                    cond: {
                                                        $eq: ['$$position._id', '$$assignee.position'],
                                                    },
                                                },
                                            },
                                            as: 'position',
                                            in: {
                                                _id: '$$position._id',
                                                name: '$$position.name',
                                            },
                                        },
                                    }, 0],
                                },
                            },
                        },
                    },
                    items: 1,
                },
            },
        ]);

        pipeline.push(...[
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $addFields: {
                    branch: {
                        $map: {
                            input: '$branch',
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                                name: '$$branch.name',
                                subRegion: '$$branch.subRegion',
                                retailSegment: '$$branch.retailSegment',
                                outlet: '$$branch.outlet',
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push(...[
            {
                $lookup: {
                    from: 'categories',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            {
                $addFields: {
                    product: {
                        $map: {
                            input: '$product',
                            as: 'product',
                            in: {
                                _id: '$$product._id',
                                name: '$$product.name',
                            },
                        },
                    },
                },
            },
        ]);

        pipeline.push(...[
            {
                $lookup: {
                    from: 'displayTypes',
                    localField: 'displayType',
                    foreignField: '_id',
                    as: 'displayType',
                },
            },
            {
                $addFields: {
                    displayType: {
                        $map: {
                            input: '$displayType',
                            as: 'displayType',
                            in: {
                                _id: '$$displayType._id',
                                name: '$$displayType.name',
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    country: 1,
                    branch: 1,
                    product: { $arrayElemAt: ['$product', 0] },
                    displayType: 1,
                    publisher: 1,
                    assignee: 1,
                    items: 1,
                },
            },
        ]);

        pipeline.push({
            $unwind: {
                path: '$branch',
            },
        });

        if (queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length) {
            pipeline.push({
                $match: {
                    'branch._id': { $in: queryFilter[CONTENT_TYPES.BRANCH] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length) {
            pipeline.push({
                $match: {
                    'branch.subRegion': { $in: queryFilter[CONTENT_TYPES.SUBREGION] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length) {
            pipeline.push({
                $match: {
                    'branch.retailSegment': { $in: queryFilter[CONTENT_TYPES.RETAILSEGMENT] },
                },
            });
        }

        if (queryFilter[CONTENT_TYPES.OUTLET] && queryFilter[CONTENT_TYPES.OUTLET].length) {
            pipeline.push({
                $match: {
                    'branch.outlet': { $in: queryFilter[CONTENT_TYPES.OUTLET] },
                },
            });
        }

        pipeline.push(...[
            {
                $lookup: {
                    from: 'domains',
                    localField: 'branch.subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $addFields: {
                    subRegion: {
                        $let: {
                            vars: {
                                subRegion: { $arrayElemAt: ['$subRegion', 0] },
                            },
                            in: {
                                _id: '$$subRegion._id',
                                name: '$$subRegion.name',
                                parent: '$$subRegion.parent',
                            },
                        },
                    },
                },
            },
        ]);

        if (queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length) {
            pipeline.push({
                $match: {
                    'subRegion.parent': { $in: queryFilter[CONTENT_TYPES.REGION] },
                },
            });
        }

        applyAnalyzeBy(pipeline, analyzeByParam, queryFilter);

        pipeline.push({
            $project: {
                barChart: {
                    data: '$data',
                    labels: '$labels',
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

        let response = result[0];

        if (response) {
            response = {
                barChart: {
                    labels: response.barChart.labels,
                    datasets: [{
                        data: response.barChart.data,
                    }],
                },
            };
        } else {
            response = {
                barChart: {
                    labels: [],
                    datasets: [],
                },
            };
        }

        res.status(200).send(response);
    });
};
