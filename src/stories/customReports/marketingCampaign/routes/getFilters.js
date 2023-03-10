const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const MarketingCampaignModel = require('./../../../../types/marketingCampaign/model');
const locationFilter = require('./../../utils/locationFilter');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const generalFiler = require('./../../utils/generalFilter');
const sanitizeHtml = require('../../utils/sanitizeHtml');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');

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
            CONTENT_TYPES.CATEGORY,
            'status', 'publisher', CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];

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

        const pipeline = [];

        pipeline.push({
            $match: {
                status: { $ne: 'draft' },
            },
        });

        const scopeFilter = {};

        locationFilter(pipeline, personnel, queryFilter, scopeFilter);

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.CATEGORY, 'displayType', 'status'], queryFilter, personnel);

        if (queryFilter.publisher && queryFilter.publisher.length) {
            $generalMatch.$and.push({
                'createdBy.user': {
                    $in: queryFilter.publisher,
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: 1,
                    createdAt: '$createdBy.date',
                    status: 1,
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
                    }],
                },
            },
            {
                $project: {
                    _id: 1,
                    country: {
                        $ifNull: ['$country', []],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    country: { $push: '$country' },
                    items: { $push: '$$ROOT._id' },
                },
            },
            {
                $project: {
                    _id: '$items',
                    country: {
                        $reduce: {
                            input: '$country',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                },
            },
            {
                $unwind: {
                    path: '$_id',
                },
            },
            {
                $lookup: {
                    from: 'marketingCampaign',
                    localField: '_id',
                    foreignField: '_id',
                    as: '_id',
                },
            },
            {
                $project: {
                    _id: false,
                    marketingCampaign: {
                        $let: {
                            vars: {
                                marketingCampaign: { $arrayElemAt: ['$_id', 0] },
                            },
                            in: {
                                _id: '$$marketingCampaign._id',
                                title: '$$marketingCampaign.description',
                                country: '$$marketingCampaign.country',
                                region: '$$marketingCampaign.region',
                                subRegion: '$$marketingCampaign.subRegion',
                                branch: '$$marketingCampaign.branch',
                                status: '$$marketingCampaign.status',
                                publisher: '$$marketingCampaign.createdBy.user',
                                product: '$$marketingCampaign.category',
                            },
                        },
                    },
                    country: 1,
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            pipeline.push({
                $match: {
                    'marketingCampaign.country': {
                        $in: queryFilter[CONTENT_TYPES.COUNTRY],
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: '$marketingCampaign._id',
                    title: '$marketingCampaign.title',
                    country: { $ifNull: ['$country', []] },
                    region: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$marketingCampaign.region', []] } }, 0] },
                            then: { selected: '$marketingCampaign.region' },
                            else: { all: 'region' },
                        },
                    },
                    subRegion: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$marketingCampaign.subRegion', []] } }, 0] },
                            then: { selected: '$marketingCampaign.subRegion' },
                            else: { all: 'subRegion' },
                        },
                    },
                    branch: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$marketingCampaign.branch', []] } }, 0] },
                            then: { selected: '$marketingCampaign.branch' },
                            else: { all: 'branch' },
                        },
                    },
                    status: '$marketingCampaign.status',
                    publisher: '$marketingCampaign.publisher',
                    product: '$marketingCampaign.product',
                },
            },
            {
                $lookup: {
                    from: 'marketingCampaignItem',
                    localField: '_id',
                    foreignField: 'brandingAndDisplay',
                    as: 'items',
                },
            },
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
                    assignee: {
                        $setUnion: ['$items.createdBy.user', []],
                    },
                },
            },
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

        if (scopeFilter[CONTENT_TYPES.REGION]) {
            pipeline.push({
                $addFields: {
                    region: {
                        $filter: {
                            input: '$region',
                            as: 'region',
                            cond: {
                                $setIsSubset: [['$$region'], scopeFilter[CONTENT_TYPES.REGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            pipeline.push(...[{
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

        if (scopeFilter[CONTENT_TYPES.SUBREGION]) {
            pipeline.push({
                $addFields: {
                    subRegion: {
                        $filter: {
                            input: '$subRegion',
                            as: 'subRegion',
                            cond: {
                                $setIsSubset: [['$$subRegion'], scopeFilter[CONTENT_TYPES.SUBREGION]],
                            },
                        },
                    },
                },
            });
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

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $setUnion: ['$branch.selected.retailSegment', []],
                },
            },
        });

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

        pipeline.push({
            $addFields: {
                outlet: {
                    $setUnion: ['$branch.selected.outlet', []],
                },
            },
        });

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

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$retailSegment',
                            }, 0],
                        },
                        then: '$retailSegment',
                        else: {
                            $setUnion: ['$branch.retailSegment', []],
                        },
                    },
                },
            },
        });

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

        pipeline.push({
            $addFields: {
                outlet: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$outlet',
                            }, 0],
                        },
                        then: '$outlet',
                        else: {
                            $setUnion: ['$branch.outlet', []],
                        },
                    },
                },
            },
        });

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
                branch: {
                    $map: {
                        input: '$branch',
                        as: 'branch',
                        in: {
                            _id: '$$branch._id',
                        },
                    },
                },
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
                                                            $setIsSubset: [['$$report.branch._id'], '$$filters.branch'],
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

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    title: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: '$branch._id',
                    retailSegment: 1,
                    outlet: 1,
                    status: 1,
                    publisher: 1,
                    assignee: 1,
                    product: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    marketingCampaign: {
                        $push: {
                            _id: '$_id',
                            name: '$title',
                            status: '$status',
                        },
                    },
                    statuses: { $addToSet: '$status' },
                    items: {
                        $push: {
                            _id: '$$ROOT._id',
                            country: '$$ROOT.country',
                            region: '$$ROOT.region',
                            subRegion: '$$ROOT.subRegion',
                            branch: '$$ROOT.branch',
                            retailSegment: '$$ROOT.retailSegment',
                            outlet: '$$ROOT.outlet',
                            status: '$$ROOT.status',
                            publisher: '$$ROOT.publisher',
                            assignee: '$$ROOT.assignee',
                            product: '$$ROOT.product',
                        },
                    },
                },
            },
            {
                $unwind: {
                    path: '$items',
                },
            },
        ]);

        if (_.get(queryFilter, 'status.length')) {
            pipeline.push({
                $project: {
                    _id: '$items._id',
                    marketingCampaign: {
                        $filter: {
                            input: '$marketingCampaign',
                            as: 'marketingCampaign',
                            cond: {
                                $setIsSubset: [['$$marketingCampaign.status'], queryFilter.status],
                            },
                        },
                    },
                    statuses: 1,
                    country: '$items.country',
                    region: '$items.region',
                    subRegion: '$items.subRegion',
                    branch: '$items.branch',
                    retailSegment: '$items.retailSegment',
                    outlet: '$items.outlet',
                    status: '$items.status',
                    publisher: '$items.publisher',
                    assignee: '$items.assignee',
                    product: '$items.product',
                },
            });
        } else {
            pipeline.push({
                $project: {
                    _id: '$items._id',
                    marketingCampaign: 1,
                    statuses: 1,
                    country: '$items.country',
                    region: '$items.region',
                    subRegion: '$items.subRegion',
                    branch: '$items.branch',
                    retailSegment: '$items.retailSegment',
                    outlet: '$items.outlet',
                    status: '$items.status',
                    publisher: '$items.publisher',
                    assignee: '$items.assignee',
                    product: '$items.product',
                },
            });
        }

        pipeline.push({
            $addFields: {
                marketingCampaign: {
                    $map: {
                        input: '$marketingCampaign',
                        as: 'marketingCampaign',
                        in: {
                            _id: '$$marketingCampaign._id',
                            name: '$$marketingCampaign.name',
                        },
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.MARKETING_CAMPAIGN}.length`)) {
            pipeline.push({
                $match: {
                    _id: {
                        $in: queryFilter[CONTENT_TYPES.MARKETING_CAMPAIGN],
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

        pipeline.push(...[
            {
                $project: {
                    _id: false,
                    marketingCampaign: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    retailSegment: 1,
                    outlet: 1,
                    status: '$statuses',
                    publisher: 1,
                    assignee: 1,
                    product: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    marketingCampaign: { $first: '$marketingCampaign' }, // tip: same in all documents
                    country: { $push: '$country' },
                    region: { $push: '$region' },
                    subRegion: { $push: '$subRegion' },
                    branch: { $push: '$branch' },
                    retailSegment: { $push: '$retailSegment' },
                    outlet: { $push: '$outlet' },
                    status: { $first: '$status' }, // tip: all available statuses over questionnaires
                    publisher: { $addToSet: '$publisher' },
                    assignee: { $push: '$assignee' },
                    product: { $addToSet: '$product' },
                },
            },
            {
                $project: {
                    _id: false,
                    marketingCampaign: 1,
                    country: {
                        $reduce: {
                            input: '$country',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                    region: {
                        $reduce: {
                            input: '$region',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                    subRegion: {
                        $reduce: {
                            input: '$subRegion',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                    branch: {
                        $reduce: {
                            input: '$branch',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                    retailSegment: {
                        $reduce: {
                            input: '$retailSegment',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                    outlet: {
                        $reduce: {
                            input: '$outlet',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                    status: 1,
                    publisher: 1,
                    assignee: {
                        $reduce: {
                            input: '$assignee',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                    product: {
                        $reduce: {
                            input: '$product',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                },
            },
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
                    localField: 'publisher',
                    foreignField: '_id',
                    as: 'publisher',
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
                    publisher: {
                        $map: {
                            input: '$publisher',
                            as: 'publisher',
                            in: {
                                _id: '$$publisher._id',
                                name: {
                                    en: { $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'] },
                                    ar: { $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'] },
                                },
                            },
                        },
                    },
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
                $addFields: {
                    assigneePosition: {
                        $setUnion: [{
                            $map: {
                                input: '$assignee',
                                as: 'assignee',
                                in: '$$assignee.position',
                            },
                        }, []],
                    },
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.POSITION}.length`)) {
            pipeline.push({
                $addFields: {
                    assignee: {
                        $filter: {
                            input: '$assignee',
                            as: 'assignee',
                            cond: {
                                $setIsSubset: [['$$assignee.position'], queryFilter[CONTENT_TYPES.POSITION]],
                            },
                        },
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'assigneePosition',
                    foreignField: '_id',
                    as: 'assigneePosition',
                },
            },
            {
                $addFields: {
                    assignee: {
                        $map: {
                            input: '$assignee',
                            as: 'assignee',
                            in: {
                                _id: '$$assignee._id',
                                name: '$$assignee.name',
                            },
                        },
                    },
                    assigneePosition: {
                        $map: {
                            input: '$assigneePosition',
                            as: 'position',
                            in: {
                                _id: '$$position._id',
                                name: '$$position.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
                $addFields: {
                    region: {
                        $map: {
                            input: '$region',
                            as: 'region',
                            in: {
                                _id: '$$region._id',
                                name: '$$region.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $addFields: {
                    subRegion: {
                        $map: {
                            input: '$subRegion',
                            as: 'subRegion',
                            in: {
                                _id: '$$subRegion._id',
                                name: '$$subRegion.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'retailSegments',
                    localField: 'retailSegment',
                    foreignField: '_id',
                    as: 'retailSegment',
                },
            },
            {
                $addFields: {
                    retailSegment: {
                        $map: {
                            input: '$retailSegment',
                            as: 'retailSegment',
                            in: {
                                _id: '$$retailSegment._id',
                                name: '$$retailSegment.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'outlet',
                    foreignField: '_id',
                    as: 'outlet',
                },
            },
            {
                $addFields: {
                    outlet: {
                        $map: {
                            input: '$outlet',
                            as: 'outlet',
                            in: {
                                _id: '$$outlet._id',
                                name: '$$outlet.name',
                            },
                        },
                    },
                },
            },
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
                            },
                        },
                    },
                },
            },
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
            {
                $project: {
                    _id: false,
                    countries: '$country',
                    regions: '$region',
                    subRegions: '$subRegion',
                    branches: '$branch',
                    outlets: '$outlet',
                    retailSegments: '$retailSegment',
                    publishers: '$publisher',
                    positions: '$assigneePosition',
                    personnels: '$assignee',
                    statuses: '$status',
                    marketingCampaigns: '$marketingCampaign',
                    categories: '$product',
                },
            },
        ]);

        MarketingCampaignModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_MARKETING, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        let response = {
            countries: [],
            regions: [],
            subRegions: [],
            retailSegments: [],
            branches: [],
            categories: [],
            statuses: [],
            publishers: [],
            positions: [],
            personnels: [],
            marketingCampaigns: [],
        };

        if (result.length) {
            response = result[0];
        }

        response.marketingCampaigns = response.marketingCampaigns.map(item => {
            return {
                _id: item._id,
                name: {
                    en: sanitizeHtml(item.name.en),
                    ar: sanitizeHtml(item.name.ar),
                },
            };
        });

        response.analyzeBy = [
            {
                name: {
                    en: 'Country',
                    ar: '??????',
                },
                value: 'country',
            },
            {
                name: {
                    en: 'Region',
                    ar: '??????????????',
                },
                value: 'region',
            },
            {
                name: {
                    en: 'Sub Region',
                    ar: '?????? ?????????????? ??????????????',
                },
                value: 'subRegion',
            },
            {
                name: {
                    en: 'Branch',
                    ar: '??????????',
                },
                value: 'branch',
            },
            {
                name: {
                    en: 'Category',
                    ar: '??????????',
                },
                value: 'category',
            },
            {
                name: {
                    en: 'Publisher',
                    ar: '????????????',
                },
                value: 'publisher',
            },
            {
                name: {
                    en: 'Position',
                    ar: '????????',
                },
                value: 'position',
            },
            {
                name: {
                    en: 'Personnel',
                    ar: '???????? ????????????????',
                },
                value: 'personnel',
            },
        ];

        res.status(200).send(response);
    });
};
