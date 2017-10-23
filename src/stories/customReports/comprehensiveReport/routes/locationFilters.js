const mongoose = require('mongoose');
const async = require('async');
const AccessManager = require('./../../../../helpers/access')();
const DomainModel = require('./../../../../types/domain/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const getFilter = require('./../utils/getFilter');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const query = req.body;
        const queryFilter = query.filter || {};
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
        ];
        const pipeline = [];

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        pipeline.push({
            $group: {
                _id: null,
                countries: {
                    $addToSet: {
                        $cond: {
                            if: {
                                $and: [
                                    { $eq: ['$type', 'country'] },
                                    { $eq: ['$archived', false] },
                                ],
                            },
                            then: {
                                _id: '$_id',
                                name: '$name',
                            },
                            else: null,
                        },
                    },
                },
                regions: {
                    $addToSet: {
                        $cond: {
                            if: {
                                $and: [
                                    { $eq: ['$type', 'region'] },
                                    { $eq: ['$archived', false] },
                                ],
                            },
                            then: {
                                _id: '$_id',
                                name: '$name',
                                parent: '$parent',
                            },
                            else: null,
                        },
                    },
                },
                subRegions: {
                    $addToSet: {
                        $cond: {
                            if: {
                                $and: [
                                    { $eq: ['$type', 'subRegion'] },
                                    { $eq: ['$archived', false] },
                                ],
                            },
                            then: {
                                _id: '$_id',
                                name: '$name',
                                parent: '$parent',
                            },
                            else: null,
                        },
                    },
                },
            },
        });

        const countryFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.COUNTRY);
        const regionFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.REGION);
        const subRegionFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.SUBREGION);
        const branchFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.BRANCH);
        const retailSegmentFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.RETAILSEGMENT);
        const outletFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.OUTLET);

        pipeline.push({
            $addFields: {
                countries: {
                    $filter: {
                        input: '$countries',
                        as: 'domain',
                        cond: {
                            $and: [
                                {
                                    $ne: ['$$domain', null],
                                },
                                {
                                    $in: ['$$domain._id', countryFilter],
                                },
                            ],
                        },
                    },
                },
                regions: countryFilter ? {
                    $reduce: {
                        input: '$regions',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $setIsSubset: [['$$this.parent'], countryFilter],
                                },
                                then: {
                                    $setUnion: [
                                        '$$value',
                                        [{
                                            _id: '$$this._id',
                                            name: '$$this.name',
                                            parent: '$$this.parent',
                                        }],
                                    ],
                                },
                                else: '$$value',
                            },
                        },
                    },
                } : {
                    $filter: {
                        input: '$regions',
                        as: 'domain',
                        cond: {
                            $ne: ['$$domain', null],
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                subRegions: {
                    $let: {
                        vars: {
                            regionFilter: regionFilter || '$regions._id',
                        },
                        in: {
                            $reduce: {
                                input: '$subRegions',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $setIsSubset: [['$$this.parent'], '$$regionFilter'],
                                        },
                                        then: {
                                            $setUnion: [
                                                '$$value',
                                                [{
                                                    _id: '$$this._id',
                                                    name: '$$this.name',
                                                    parent: '$$this.parent',
                                                }],
                                            ],
                                        },
                                        else: '$$value',
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
                subRegionsForBranches: subRegionFilter ? {
                    $reduce: {
                        input: '$subRegions',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: { $setIsSubset: [['$$this._id'], subRegionFilter] },
                                then: {
                                    $setUnion: ['$$value', ['$$this._id']],
                                },
                                else: '$$value',
                            },
                        },
                    },
                } : '$subRegions._id',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'subRegionsForBranches',
                foreignField: 'subRegion',
                as: 'branches',
            },
        });

        pipeline.push({
            $addFields: {
                branches: {
                    $let: {
                        vars: {
                            items: {
                                $filter: {
                                    input: '$branches',
                                    as: 'item',
                                    cond: { $eq: ['$$item.archived', false] },
                                },
                            },
                        },
                        in: {
                            $map: {
                                input: '$$items',
                                as: 'item',
                                in: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                    retailSegment: '$$item.retailSegment',
                                    outlet: '$$item.outlet',
                                    subRegion: '$$item.subRegion',
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $addFields: {
                retailSegments: { $setUnion: ['$branches.retailSegment', []] },
            },
        });

        pipeline.push({
            $addFields: {
                outlets: retailSegmentFilter ? {
                    $reduce: {
                        input: '$branches',
                        initialValue: [],
                        in: {
                            $cond: {
                                if: {
                                    $setIsSubset: [['$$this.retailSegment'], retailSegmentFilter],
                                },
                                then: {
                                    $setUnion: [
                                        '$$value',
                                        ['$$this.outlet'],
                                    ],
                                },
                                else: '$$value',
                            },
                        },
                    },
                } : { $setUnion: ['$branches.outlet', []] },
            },
        });

        pipeline.push({
            $project: {
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: ((() => {
                    if (!branchFilter && !retailSegmentFilter && !outletFilter) {
                        return {
                            _id: 1,
                            name: 1,
                        };
                    }

                    const condition = {
                        $and: [],
                    };

                    const $reduce = {
                        $reduce: {
                            input: '$branches',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: condition,
                                    then: {
                                        $setUnion: [
                                            '$$value',
                                            [{
                                                _id: '$$this._id',
                                                name: '$$this.name',
                                            }],
                                        ],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    };

                    if (branchFilter) {
                        condition.$and.push({
                            $setIsSubset: [['$$this._id'], branchFilter],
                        });
                    }

                    if (retailSegmentFilter) {
                        condition.$and.push({
                            $setIsSubset: [['$$this.retailSegment'], retailSegmentFilter],
                        });
                    }

                    if (outletFilter) {
                        condition.$and.push({
                            $setIsSubset: [['$$this.outlet'], outletFilter],
                        });
                    }

                    return $reduce;
                })()),
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
                    $let: {
                        vars: {
                            items: {
                                $filter: {
                                    input: '$retailSegments',
                                    as: 'item',
                                    cond: { $eq: ['$$item.archived', false] },
                                },
                            },
                        },
                        in: {
                            $map: {
                                input: '$$items',
                                as: 'item',
                                in: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlets',
                foreignField: '_id',
                as: 'outlets',
            },
        });

        pipeline.push({
            $addFields: {
                outlets: {
                    $let: {
                        vars: {
                            items: {
                                $filter: {
                                    input: '$outlets',
                                    as: 'item',
                                    cond: { $eq: ['$$item.archived', false] },
                                },
                            },
                        },
                        in: {
                            $map: {
                                input: '$$items',
                                as: 'item',
                                in: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                },
                            },
                        },
                    },
                },
            },
        });

        pipeline.push({
            $project: {
                countries: 1,
                regions: {
                    _id: 1,
                    name: 1,
                },
                subRegions: {
                    _id: 1,
                    name: 1,
                },
                retailSegments: {
                    _id: 1,
                    name: 1,
                },
                outlets: {
                    _id: 1,
                    name: 1,
                },
                branches: 1,
                categories: null,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'categories',
                foreignField: 'categories',
                as: 'categories',
            },
        });

        pipeline.push({
            $project: {
                countries: 1,
                regions: 1,
                subRegions: 1,
                retailSegments: 1,
                outlets: 1,
                branches: 1,
                categories: {
                    _id: 1,
                    name: 1,
                },
            },
        });

        DomainModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.LOCATIONS, cb);
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
            categories: [],
        };

        res.status(200).send(response);
    });
};
