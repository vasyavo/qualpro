const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const QuestionnaryModel = require('./../../../../types/questionnaries/model');
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
            'questionnaire',
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
                    from: 'questionnary',
                    localField: '_id',
                    foreignField: '_id',
                    as: '_id',
                },
            },
            {
                $project: {
                    _id: false,
                    questionnaire: {
                        $let: {
                            vars: {
                                questionnaire: { $arrayElemAt: ['$_id', 0] },
                            },
                            in: {
                                _id: '$$questionnaire._id',
                                title: '$$questionnaire.title',
                                country: '$$questionnaire.country',
                                region: '$$questionnaire.region',
                                subRegion: '$$questionnaire.subRegion',
                                branch: '$$questionnaire.branch',
                                status: '$$questionnaire.status',
                                publisher: ['$$questionnaire.createdBy.user'],
                                assignee: '$$questionnaire.personnels',
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
                    'questionnaire.country': {
                        $in: queryFilter[CONTENT_TYPES.COUNTRY],
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: '$questionnaire._id',
                    title: '$questionnaire.title',
                    country: { $ifNull: ['$country', []] },
                    region: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$questionnaire.region', []] } }, 0] },
                            then: { selected: '$questionnaire.region' },
                            else: { all: 'region' },
                        },
                    },
                    subRegion: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$questionnaire.subRegion', []] } }, 0] },
                            then: { selected: '$questionnaire.subRegion' },
                            else: { all: 'subRegion' },
                        },
                    },
                    branch: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$questionnaire.branch', []] } }, 0] },
                            then: { selected: '$questionnaire.branch' },
                            else: { all: 'branch' },
                        },
                    },
                    status: '$questionnaire.status',
                    publisher: '$questionnaire.publisher',
                    assignee: '$questionnaire.assignee',
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
                                        _id: '$branch._id',
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
                    $setUnion: ['$branch.retailSegment', []],
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
                    $setUnion: ['$branch.outlet', []],
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
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.BRANCH}.length`)) {
            pipeline.push(...[
                {
                    $addFields: {
                        acceptable: {
                            $let: {
                                vars: {
                                    filters: {
                                        branch: queryFilter[CONTENT_TYPES.BRANCH],
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$branch',
                                                        as: 'branch',
                                                        cond: {
                                                            $and: [
                                                                { $setIsSubset: [['$$branch._id'], '$$filters.branch'] },
                                                            ],
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
                    questionnaire: {
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
                    questionnaire: {
                        $filter: {
                            input: '$questionnaire',
                            as: 'questionnaire',
                            cond: {
                                $setIsSubset: [['$$questionnaire.status'], queryFilter.status],
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
                },
            });
        } else {
            pipeline.push({
                $project: {
                    _id: '$items._id',
                    questionnaire: 1,
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
                },
            });
        }

        pipeline.push({
            $addFields: {
                questionnaire: {
                    $map: {
                        input: '$questionnaire',
                        as: 'questionnaire',
                        in: {
                            _id: '$$questionnaire._id',
                            name: '$$questionnaire.name',
                        },
                    },
                },
            },
        });

        if (_.get(queryFilter, 'questionnaire.length')) {
            pipeline.push({
                $match: {
                    _id: {
                        $in: queryFilter.questionnaire,
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
                    questionnaire: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    retailSegment: 1,
                    outlet: 1,
                    status: '$statuses',
                    publisher: 1,
                    assignee: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    questionnaire: { $first: '$questionnaire' }, // tip: same in all documents
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
                    questionnaire: 1,
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
                    publisher: {
                        $reduce: {
                            input: '$publisher',
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
                    assignedTo: '$assignee',
                    statuses: '$status',
                    questionnaires: '$questionnaire',
                },
            },
        ]);

        QuestionnaryModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_QUESTIONNAIRE, cb);
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
            regions: [],
            subRegions: [],
            retailSegments: [],
            outlets: [],
            branches: [],
            publishers: [],
            positions: [],
            assignedTo: [],
            statuses: [],
            questionnaires: [],
        };

        response.analyzeBy = [
            {
                name: {
                    en: 'Country',
                    ar: '',
                },
                value: 'country',
            },
            {
                name: {
                    en: 'Region',
                    ar: '',
                },
                value: 'region',
            },
            {
                name: {
                    en: 'Sub Region',
                    ar: '',
                },
                value: 'subRegion',
            },
            {
                name: {
                    en: 'Branch',
                    ar: '',
                },
                value: 'branch',
            },
            {
                name: {
                    en: 'Publisher',
                    ar: '',
                },
                value: 'publisher',
            },
            {
                name: {
                    en: 'Assignee',
                    ar: '',
                },
                value: 'assignee',
            },
            {
                name: {
                    en: 'Assignee Position',
                    ar: '',
                },
                value: 'assigneePosition',
            },
        ];

        res.status(200).send(response);
    });
};
