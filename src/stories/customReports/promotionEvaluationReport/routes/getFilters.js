const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const PromotionModel = require('./../../../../types/promotion/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const sanitizeHtml = require('../../utils/sanitizeHtml');

const ajv = new Ajv();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const timeFilterSchema = {
        type: 'object',
        properties: {
            from: {
                type: 'string',
            },
            to: {
                type: 'string',
            },
        },
        required: [
            'from',
            'to',
        ],
    };

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

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate(timeFilter);

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

        const $generalMatch = generalFiler([CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.CATEGORY, 'displayType', 'status', 'promotionType.en'], queryFilter, personnel);

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
            $addFields: {
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
                from: CONTENT_TYPES.PROMOTIONSITEMS,
                localField: '_id',
                foreignField: 'promotion',
                as: 'promotion',
            },
        });

        pipeline.push({
            $unwind: '$promotion',
        });

        if (timeFilter) {
            pipeline.push({
                $match: {
                    $and: [
                        {
                            'promotion.createdBy.date': { $gt: new Date(timeFilter.from) },
                        },
                        {
                            'promotion.createdBy.date': { $lt: new Date(timeFilter.to) },
                        },
                    ],
                },
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

        pipeline.push({
            $group: {
                _id: null,
                countries: { $addToSet: '$country' },
                regions: { $addToSet: '$region' },
                subRegions: { $addToSet: '$subRegion' },
                branches: { $addToSet: '$branch' },
                retailSegments: { $addToSet: '$retailSegment' },
                categories: { $addToSet: '$category' },
                displayTypes: { $addToSet: '$displayType' },
                statuses: { $addToSet: '$status' },
                publishers: { $addToSet: '$createdBy.user._id' },
                positions: { $addToSet: '$createdBy.user.position' },
                personnels: { $addToSet: '$promotion.createdBy.user' },
                promotionTypes: { $addToSet: '$promotionType' },
            },
        });

        pipeline.push({
            $project: {
                countries: {
                    $filter: {
                        input: '$countries',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                regions: {
                    $filter: {
                        input: {
                            $reduce: {
                                input: '$regions',
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
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                subRegions: {
                    $filter: {
                        input: {
                            $reduce: {
                                input: '$subRegions',
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
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                branches: {
                    $filter: {
                        input: {
                            $reduce: {
                                input: '$branches',
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
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                retailSegments: {
                    $filter: {
                        input: {
                            $reduce: {
                                input: '$retailSegments',
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
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                displayTypes: {
                    $filter: {
                        input: {
                            $reduce: {
                                input: '$displayTypes',
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
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                categories: {
                    $filter: {
                        input: '$categories',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                statuses: {
                    $filter: {
                        input: '$statuses',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                publishers: {
                    $filter: {
                        input: '$publishers',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                positions: {
                    $filter: {
                        input: '$positions',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                personnels: {
                    $filter: {
                        input: '$personnels',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
                promotionTypes: {
                    $filter: {
                        input: '$promotionTypes',
                        as: 'item',
                        cond: {
                            $ne: ['$$item', null],
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'countries',
                foreignField: '_id',
                as: 'countries',
            },
        });

        pipeline.push({
            $addFields: {
                countries: {
                    $map: {
                        input: '$countries',
                        as: 'country',
                        in: {
                            _id: '$$country._id',
                            name: '$$country.name',
                        },
                    },
                },
            },
        });

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
                regions: {
                    $map: {
                        input: {
                            $let: {
                                vars: {
                                    setCountry: queryFilter[CONTENT_TYPES.COUNTRY] && queryFilter[CONTENT_TYPES.COUNTRY].length ? queryFilter[CONTENT_TYPES.COUNTRY] : {
                                        $map: {
                                            input: '$countries',
                                            as: 'item',
                                            in: '$$item._id',
                                        },
                                    },
                                    setRegion: queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length ? queryFilter[CONTENT_TYPES.REGION] : personnel[CONTENT_TYPES.REGION],
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: '$$setRegion',
                                            }, 0],
                                        },
                                        then: {
                                            $filter: {
                                                input: '$regions',
                                                as: 'item',
                                                cond: {
                                                    $and: [
                                                        { $setIsSubset: [['$$item.parent'], '$$setCountry'] },
                                                        { $setIsSubset: [['$$item._id'], '$$setRegion'] },
                                                    ],
                                                },
                                            },
                                        },
                                        else: {
                                            $filter: {
                                                input: '$regions',
                                                as: 'item',
                                                cond: {
                                                    $setIsSubset: [['$$item.parent'], '$$setCountry'],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        as: 'region',
                        in: {
                            _id: '$$region._id',
                            name: '$$region.name',
                        },
                    },
                },
            },
        });

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
                subRegions: {
                    $map: {
                        input: {
                            $let: {
                                vars: {
                                    setRegion: queryFilter[CONTENT_TYPES.REGION] && queryFilter[CONTENT_TYPES.REGION].length ? queryFilter[CONTENT_TYPES.REGION] : {
                                        $map: {
                                            input: '$regions',
                                            as: 'item',
                                            in: '$$item._id',
                                        },
                                    },
                                    setSubRegion: queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length ?
                                        queryFilter[CONTENT_TYPES.SUBREGION] :
                                        personnel[CONTENT_TYPES.SUBREGION],
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: '$$setSubRegion',
                                            }, 0],
                                        },
                                        then: {
                                            $filter: {
                                                input: '$subRegions',
                                                as: 'item',
                                                cond: {
                                                    $and: [
                                                        { $setIsSubset: [['$$item.parent'], '$$setRegion'] },
                                                        { $setIsSubset: [['$$item._id'], '$$setSubRegion'] },
                                                    ],
                                                },
                                            },
                                        },
                                        else: {
                                            $filter: {
                                                input: '$subRegions',
                                                as: 'item',
                                                cond: {
                                                    $setIsSubset: [['$$item.parent'], '$$setRegion'],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        as: 'subRegion',
                        in: {
                            _id: '$$subRegion._id',
                            name: '$$subRegion.name',
                        },
                    },
                },
            },
        });

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
                branches: {
                    $map: {
                        input: {
                            $let: {
                                vars: {
                                    setSubRegion: queryFilter[CONTENT_TYPES.SUBREGION] && queryFilter[CONTENT_TYPES.SUBREGION].length ? queryFilter[CONTENT_TYPES.SUBREGION] : {
                                        $map: {
                                            input: '$subRegions',
                                            as: 'item',
                                            in: '$$item._id',
                                        },
                                    },
                                    setBranches: queryFilter[CONTENT_TYPES.BRANCH] && queryFilter[CONTENT_TYPES.BRANCH].length ?
                                        queryFilter[CONTENT_TYPES.BRANCH] :
                                        personnel[CONTENT_TYPES.BRANCH],
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: '$$setBranches',
                                            }, 0],
                                        },
                                        then: {
                                            $filter: {
                                                input: '$branches',
                                                as: 'item',
                                                cond: {
                                                    $and: [
                                                        { $setIsSubset: [['$$item.subRegion'], '$$setSubRegion'] },
                                                        { $setIsSubset: [['$$item._id'], '$$setBranches'] },
                                                    ],
                                                },
                                            },
                                        },
                                        else: {
                                            $filter: {
                                                input: '$branches',
                                                as: 'item',
                                                cond: {
                                                    $setIsSubset: [['$$item.subRegion'], '$$setSubRegion'],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        as: 'branch',
                        in: {
                            _id: '$$branch._id',
                            name: '$$branch.name',
                            retailSegment: '$$branch.retailSegment',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                retailSegments: {
                    $let: {
                        vars: {
                            setRetailSegments: queryFilter[CONTENT_TYPES.RETAILSEGMENT] && queryFilter[CONTENT_TYPES.RETAILSEGMENT].length ? queryFilter[CONTENT_TYPES.RETAILSEGMENT] : [],
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$$setRetailSegments',
                                    }, 0],
                                },
                                then: {
                                    $filter: {
                                        input: '$retailSegments',
                                        as: 'item',
                                        cond: {
                                            $and: [
                                                { $setIsSubset: [['$$item'], '$branches.retailSegment'] },
                                                { $setIsSubset: [['$$item'], '$$setRetailSegments'] },
                                            ],
                                        },
                                    },
                                },
                                else: {
                                    $filter: {
                                        input: '$retailSegments',
                                        as: 'item',
                                        cond: {
                                            $setIsSubset: [['$$item'], '$branches.retailSegment'],
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
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegments',
                foreignField: '_id',
                as: 'retailSegments',
            },
        });

        pipeline.push({
            $addFields: {
                retailSegments: {
                    $map: {
                        input: '$retailSegments',
                        as: 'retailSegment',
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
                from: 'displayTypes',
                localField: 'displayTypes',
                foreignField: '_id',
                as: 'displayTypes',
            },
        });

        pipeline.push({
            $addFields: {
                displayTypes: {
                    $map: {
                        input: '$displayTypes',
                        as: 'displayType',
                        in: {
                            _id: '$$displayType._id',
                            name: '$$displayType.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
            },
        });

        pipeline.push({
            $addFields: {
                categories: {
                    $map: {
                        input: '$categories',
                        as: 'category',
                        in: {
                            _id: '$$category._id',
                            name: '$$category.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'publishers',
                foreignField: '_id',
                as: 'publishers',
            },
        });

        pipeline.push({
            $addFields: {
                publishers: {
                    $map: {
                        input: '$publishers',
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
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'positions',
                foreignField: '_id',
                as: 'positions',
            },
        });

        pipeline.push({
            $addFields: {
                positions: {
                    $map: {
                        input: '$positions',
                        as: 'position',
                        in: {
                            _id: '$$position._id',
                            name: '$$position.name',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'personnels',
                foreignField: '_id',
                as: 'personnels',
            },
        });

        pipeline.push({
            $addFields: {
                personnels: {
                    $map: {
                        input: '$personnels',
                        as: 'personnel',
                        in: {
                            _id: '$$personnel._id',
                            name: {
                                en: { $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] },
                                ar: { $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] },
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

        const response = result[0];

        response.promotionTypes = response.promotionTypes.map(item => {
            return {
                _id: item.en, // like ID
                name: {
                    en: sanitizeHtml(item.en),
                    ar: sanitizeHtml(item.ar),
                },
            };
        });

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
                    en: 'Category',
                    ar: '',
                },
                value: 'category',
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
                    en: 'Position',
                    ar: '',
                },
                value: 'position',
            },
            {
                name: {
                    en: 'Personnel',
                    ar: '',
                },
                value: 'personnel',
            },
            {
                name: {
                    en: 'Promotion Type',
                    ar: '',
                },
                value: 'promotionType',
            },
        ];

        res.status(200).send(response);
    });
};
