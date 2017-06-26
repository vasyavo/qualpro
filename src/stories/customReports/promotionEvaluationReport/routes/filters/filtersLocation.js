const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');

const getFilter = (queryFilter, personnel, CONTENT_TYPE) => {
    if (queryFilter[CONTENT_TYPE] && queryFilter[CONTENT_TYPE].length) {
        return queryFilter[CONTENT_TYPE];
    }

    if (personnel[CONTENT_TYPE] && personnel[CONTENT_TYPE].length) {
        return personnel[CONTENT_TYPE];
    }

    return null;
};

module.exports = (queryFilter, personnel) => {
    const countryFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.COUNTRY);
    const regionFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.REGION);
    const subRegionFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.SUBREGION);
    const retailSegmentFilter = getFilter(queryFilter, personnel, CONTENT_TYPES.RETAILSEGMENT);
    const pipeline = [];

    pipeline.push({
        $group: {
            _id: null,
            countries: { $addToSet: '$country' },
            regions: { $push: '$region' },
            subRegions: { $push: '$subRegion' },
            retailSegments: { $push: '$retailSegment' },
            branches: { $push: '$branch' },
        },
    });

    pipeline.push({
        $project: {
            countries: 1,
            regions: {
                $reduce: {
                    input: '$regions',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $ne: ['$$this', []],
                                    },
                                    {
                                        $ne: ['$$this', null],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
            subRegions: {
                $reduce: {
                    input: '$subRegions',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $ne: ['$$this', []],
                                    },
                                    {
                                        $ne: ['$$this', null],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
            retailSegments: {
                $reduce: {
                    input: '$retailSegments',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $ne: ['$$this', []],
                                    },
                                    {
                                        $ne: ['$$this', null],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
            branches: {
                $reduce: {
                    input: '$branches',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $ne: ['$$this', []],
                                    },
                                    {
                                        $ne: ['$$this', null],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: ['$$value', '$$this'],
                            },
                            else: '$$value',
                        },
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
        $project: {
            countries: {
                _id: 1,
                name: 1,
            },
            countriesIds: '$countries._id',
            regions: 1,
            subRegions: 1,
            retailSegments: 1,
            branches: 1,
        },
    });

    if (countryFilter) {
        pipeline.push({
            $addFields: {
                countriesIds: {
                    $setIntersection: [countryFilter, '$countriesIds'],
                },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'countriesIds',
            foreignField: 'parent',
            as: 'childRegions',
        },
    });

    pipeline.push({
        $addFields: {
            childRegions: null,
            countriesIds: null,
            regions: {
                $let: {
                    vars: {
                        setRegion: { $setIntersection: ['$regions', '$childRegions._id'] },
                    },
                    in: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$childRegions',
                                    as: 'region',
                                    cond: {
                                        $setIsSubset: [['$$region._id'], '$$setRegion'],
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
            },
        },
    });

    pipeline.push({
        $addFields: {
            regionsIds: '$regions._id',
        },
    });

    if (regionFilter) {
        pipeline.push({
            $addFields: {
                regionsIds: {
                    $setIntersection: [regionFilter, '$regionsIds'],
                },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'regionsIds',
            foreignField: 'parent',
            as: 'childSubRegions',
        },
    });

    pipeline.push({
        $addFields: {
            childSubRegions: null,
            regionsIds: null,
            subRegions: {
                $let: {
                    vars: {
                        setSubRegion: { $setIntersection: ['$subRegions', '$childSubRegions._id'] },
                    },
                    in: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$childSubRegions',
                                    as: 'subRegion',
                                    cond: {
                                        $setIsSubset: [['$$subRegion._id'], '$$setSubRegion'],
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
            },
        },
    });

    pipeline.push({
        $addFields: {
            subRegionsIds: '$subRegions._id',
        },
    });

    if (subRegionFilter) {
        pipeline.push({
            $addFields: {
                subRegionsIds: {
                    $setIntersection: [subRegionFilter, '$subRegionsIds'],
                },
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: 'subRegionsIds',
            foreignField: 'subRegion',
            as: 'childBranches',
        },
    });

    pipeline.push({
        $addFields: {
            childBranches: null,
            retailSegments: {
                $setIntersection: ['$childBranches.retailSegment', '$retailSegments'],
            },
            subRegionsIds: null,
            branches: {
                $let: {
                    vars: {
                        setBranches: { $setIntersection: ['$branches', '$childBranches._id'] },
                    },
                    in: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$childBranches',
                                    as: 'branch',
                                    cond: retailSegmentFilter ? {
                                        $and: [
                                            {
                                                $setIsSubset: [['$$branch._id'], '$$setBranches'],
                                            },
                                            {
                                                $setIsSubset: [['$$branch.retailSegment'], retailSegmentFilter],
                                            },
                                        ],
                                    } : {
                                        $setIsSubset: [['$$branch._id'], '$$setBranches'],
                                    },
                                },
                            },
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                                name: '$$branch.name',
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
        $project: {
            countries: 1,
            regions: 1,
            subRegions: 1,
            retailSegments: {
                _id: 1,
                name: 1,
            },
            branches: 1,
        }
    });


    return pipeline;
};
