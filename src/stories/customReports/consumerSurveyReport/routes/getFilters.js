const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ConsumersSurveyModel = require('./../../../../types/consumersSurvey/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const sanitizeHtml = require('../../utils/sanitizeHtml');
const locationFilter = require('./../../utils/locationFilter');

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
        const timeFilter = query.timeFilter;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.POSITION,
            CONTENT_TYPES.PERSONNEL,
            'title',
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
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        const pipeline = [];

        const scopeFilter = {};

        locationFilter(pipeline, personnel, queryFilter, scopeFilter);

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: 1,
                    countAnswered: 1,
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
                    }, {
                        status: { $ne: 'draft' },
                    }, {
                        countAnswered: { $gt: 0 },
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
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
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
                    from: 'consumersSurvey',
                    localField: '_id',
                    foreignField: '_id',
                    as: '_id',
                },
            },
            {
                $project: {
                    _id: false,
                    survey: {
                        $let: {
                            vars: {
                                survey: { $arrayElemAt: ['$_id', 0] },
                            },
                            in: {
                                _id: '$$survey._id',
                                title: '$$survey.title',
                                country: '$$survey.country',
                                region: '$$survey.region',
                                subRegion: '$$survey.subRegion',
                                branch: '$$survey.branch',
                                status: '$$survey.status',
                                publisher: ['$$survey.createdBy.user'],
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
                    'survey.country': {
                        $in: queryFilter[CONTENT_TYPES.COUNTRY],
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: '$survey._id',
                    title: '$survey.title',
                    country: { $ifNull: ['$country', []] },
                    region: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$survey.region', []] } }, 0] },
                            then: { selected: '$survey.region' },
                            else: { all: 'region' },
                        },
                    },
                    subRegion: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$survey.subRegion', []] } }, 0] },
                            then: { selected: '$survey.subRegion' },
                            else: { all: 'subRegion' },
                        },
                    },
                    branch: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$survey.branch', []] } }, 0] },
                            then: { selected: '$survey.branch' },
                            else: { all: 'branch' },
                        },
                    },
                    status: '$survey.status',
                    publisher: '$survey.publisher',
                },
            },
            {
                $lookup: {
                    from: 'consumersSurveyAnswers',
                    localField: '_id',
                    foreignField: 'questionnaryId',
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
                    displayType: 1,
                    assignee: {
                        $map: {
                            input: '$items',
                            as: 'item',
                            in: {
                                nationality: '$$item.customer.nationality',
                                gender: '$$item.customer.gender',
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
                },
            },
            {
                $group: {
                    _id: null,
                    survey: {
                        $push: {
                            _id: '$_id',
                            name: '$title',
                            status: '$status',
                        },
                    },
                    status: { $addToSet: '$status' },
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
                        },
                    },
                },
            },
            {
                $project: {
                    _id: false,
                    survey: 1,
                    shared: {
                        status: '$status',
                    },
                    items: 1,
                },
            },
        ]);

        if (_.get(queryFilter, 'title.length')) {
            pipeline.push(...[
                {
                    $addFields: {
                        items: {
                            $let: {
                                vars: {
                                    survey: queryFilter.title,
                                },
                                in: {
                                    $filter: {
                                        input: '$items',
                                        as: 'item',
                                        cond: {
                                            $setIsSubset: [['$$item._id'], '$$survey'],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        'shared.status': {
                            $setUnion: ['$items.status', []],
                        },
                    },
                },
            ]);
        }

        if (_.get(queryFilter, 'status.length')) {
            pipeline.push(...[
                {
                    $addFields: {
                        survey: {
                            $filter: {
                                input: '$survey',
                                as: 'survey',
                                cond: {
                                    $setIsSubset: [['$$survey.status'], queryFilter.status],
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        items: {
                            $let: {
                                vars: {
                                    survey: '$survey._id',
                                },
                                in: {
                                    $filter: {
                                        input: '$items',
                                        as: 'item',
                                        cond: {
                                            $setIsSubset: [['$$item._id'], '$$survey'],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ]);
        }

        pipeline.push(...[
            {
                $unwind: {
                    path: '$items',
                },
            },
            {
                $project: {
                    _id: false,
                    survey: {
                        $map: {
                            input: '$survey',
                            as: 'survey',
                            in: {
                                _id: '$$survey._id',
                                name: '$$survey.name',
                            },
                        },
                    },
                    country: '$items.country',
                    region: '$items.region',
                    subRegion: '$items.subRegion',
                    branch: '$items.branch',
                    retailSegment: '$items.retailSegment',
                    outlet: '$items.outlet',
                    status: '$shared.status',
                    publisher: '$items.publisher',
                    assignee: '$items.assignee',
                },
            },
            {
                $group: {
                    _id: null,
                    survey: { $first: '$survey' }, // tip: same in all documents
                    country: { $push: '$country' },
                    region: { $push: '$region' },
                    subRegion: { $push: '$subRegion' },
                    branch: { $push: '$branch' },
                    retailSegment: { $push: '$retailSegment' },
                    outlet: { $push: '$outlet' },
                    status: { $first: '$status' }, // tip: all available statuses over questionnaires
                    publisher: { $push: '$publisher' },
                    assignee: { $push: '$assignee' },
                },
            },
            {
                $project: {
                    _id: false,
                    survey: 1,
                    country: {
                        $reduce: {
                            input: '$country',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
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
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
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
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
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
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
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
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
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
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    status: 1,
                    publisher: {
                        $reduce: {
                            input: '$publisher',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    assignee: {
                        $reduce: {
                            input: '$assignee',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $concatArrays: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    gender: {
                        $setUnion: ['$assignee.gender', []],
                    },
                    nationality: {
                        $setUnion: ['$assignee.nationality', []],
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
                $addFields: {
                    publisher: {
                        $filter: {
                            input: {
                                $map: {
                                    input: '$publisher',
                                    as: 'publisher',
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
                            as: 'publisher',
                            cond: {
                                $ne: ['$$publisher.position', null],
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    publisherPosition: {
                        $setUnion: [{
                            $map: {
                                input: '$publisher',
                                as: 'publisher',
                                in: '$$publisher.position',
                            },
                        }, []],
                    },
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.POSITION}.length`)) {
            pipeline.push({
                $addFields: {
                    publisher: {
                        $filter: {
                            input: '$publisher',
                            as: 'publisher',
                            cond: {
                                $setIsSubset: [['$$publisher.position'], queryFilter[CONTENT_TYPES.POSITION]],
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
                    localField: 'publisherPosition',
                    foreignField: '_id',
                    as: 'publisherPosition',
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
                                name: '$$publisher.name',
                            },
                        },
                    },
                    publisherPosition: {
                        $map: {
                            input: '$publisherPosition',
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
                $project: {
                    _id: false,
                    countries: '$country',
                    regions: '$region',
                    subRegions: '$subRegion',
                    branches: '$branch',
                    outlets: '$outlet',
                    retailSegments: '$retailSegment',
                    publishers: '$publisher',
                    positions: '$publisherPosition',
                    nationalities: '$nationality',
                    genders: '$gender',
                    statuses: '$status',
                    titles: '$survey',
                },
            },
        ]);

        ConsumersSurveyModel.aggregate(pipeline)
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

        const response = result && result[0] ? result[0] : {
            countries: [],
            titles: [],
            regions: [],
            subRegions: [],
            branches: [],
            publishers: [],
            positions: [],
            retailSegments: [],
            outlets: [],
            statuses: [],
            nationalities: [],
            genders: [],
        };

        const statuses = [
            {
                _id: 'active',
                name: {
                    en: 'Active',
                    ar: '',
                },
            },
            {
                _id: 'completed',
                name: {
                    en: 'Completed',
                    ar: '',
                },
            },
        ];

        const genders = [
            {
                _id: 'male',
                name: {
                    en: 'Male',
                    ar: '',
                },
            },
            {
                _id: 'female',
                name: {
                    en: 'Female',
                    ar: '',
                },
            },
        ];

        response.statuses = statuses.filter((item) => {
            return response.statuses.indexOf(item._id) > -1;
        });

        response.titles = response.titles.map(item => {
            return {
                _id: item._id,
                name: {
                    en: sanitizeHtml(item.name.en),
                    ar: sanitizeHtml(item.name.ar),
                },
            };
        });

        response.genders = genders.filter((item) => {
            return response.genders.indexOf(item._id) > -1;
        });

        response.analyzeBy = [
            {
                name: {
                    en: 'Country',
                    ar: 'بلد',
                },
                value: 'country',
            },
            {
                name: {
                    en: 'Region',
                    ar: 'المنطقة',
                },
                value: 'region',
            },
            {
                name: {
                    en: 'Sub Region',
                    ar: 'حدد المنطقة الفرعية',
                },
                value: 'subRegion',
            },
            {
                name: {
                    en: 'Branch',
                    ar: 'الفرع',
                },
                value: 'branch',
            },
            {
                name: {
                    en: 'Publisher Position',
                    ar: 'منصب الناشر',
                },
                value: 'position',
            },
            {
                name: {
                    en: 'Publisher',
                    ar: 'الناشر',
                },
                value: 'publisher',
            },
        ];

        res.status(200).send(response);
    });
};
