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
        $project: {
            _id: 1,
        },
    });

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

    pipeline.push({
        $group: {
            _id: null,
            branches: { $addToSet: '$promotion.branch' },
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
        $project: {
            branches: {
                _id: 1,
                name: 1,
                subRegion: 1,
                retailSegment: 1,
            },
            subRegions: '$branches.subRegion',
            retailSegments: '$branches.retailSegment',
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
        $lookup: {
            from: 'retailSegments',
            localField: 'retailSegments',
            foreignField: '_id',
            as: 'retailSegments',
        },
    });

    pipeline.push({
        $project: {
            branches: 1,
            subRegions: {
                _id: 1,
                name: 1,
                parent: 1,
            },
            retailSegments: {
                _id: 1,
                name: 1,
            },
            regions: '$subRegions.parent',
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
        $project: {
            branches: 1,
            subRegions: 1,
            retailSegments: 1,
            regions: {
                _id: 1,
                name: 1,
                parent: 1,
            },
            countries: '$regions.parent',
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
            branches: 1,
            retailSegments: 1,
            subRegions: 1,
            regions: 1,
            countriesIds: '$countries._id',
            countries: {
                _id: 1,
                name: 1,
            },
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
        $addFields: {
            countriesIds: null,
            regions: {
                $reduce: {
                    input: '$regions',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: { $setIsSubset: [['$$this.parent'], '$countriesIds'] },
                            then: {
                                $setUnion: [
                                    [
                                        {
                                            _id: '$$this._id',
                                            name: '$$this.name',
                                        },
                                    ],
                                    '$$value',
                                ],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
        },
    });

    if (regionFilter) {
        pipeline.push({
            $addFields: {
                regionsIds: {
                    $setIntersection: [regionFilter, '$regions._id'],
                },
            },
        });
    } else {
        pipeline.push({
            $addFields: {
                regionsIds: '$regions._id',
            },
        });
    }

    pipeline.push({
        $addFields: {
            regionsIds: null,
            subRegions: {
                $reduce: {
                    input: '$subRegions',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: { $setIsSubset: [['$$this.parent'], '$regionsIds'] },
                            then: {
                                $setUnion: [
                                    [
                                        {
                                            _id: '$$this._id',
                                            name: '$$this.name',
                                        },
                                    ],
                                    '$$value',
                                ],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
        },
    });

    if (subRegionFilter) {
        pipeline.push({
            $addFields: {
                subRegionsIds: {
                    $setIntersection: [subRegionFilter, '$subRegions._id'],
                },
            },
        });
    } else {
        pipeline.push({
            $addFields: {
                subRegionsIds: '$subRegions._id',
            },
        });
    }

    pipeline.push({
        $addFields: {
            retailSegments: {
                $reduce: {
                    input: {
                        $reduce: {
                            input: '$branches',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: { $setIsSubset: [['$$this.subRegion'], '$subRegionsIds'] },
                                    then: { $setUnion: [['$$this.retailSegment'], '$$value'] },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    initialValue: [],
                    in: {
                        $setUnion: [
                            '$$value',
                            [
                                {
                                    $let: {
                                        vars: {
                                            retailSegment: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: '$retailSegments',
                                                            as: 'retailSegment',
                                                            cond: {
                                                                $eq: ['$$retailSegment._id', '$$this'],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            _id: '$$retailSegment._id',
                                            name: '$$retailSegment.name',
                                        },
                                    },
                                },
                            ],
                        ],
                    },
                },
            },
        },
    });

    if (retailSegmentFilter) {
        pipeline.push({
            $addFields: {
                retailSegmentsIds: {
                    $setIntersection: [retailSegmentFilter, '$retailSegments._id'],
                },
            },
        });
    } else {
        pipeline.push({
            $addFields: {
                retailSegmentsIds: '$retailSegments._id',
            },
        });
    }

    pipeline.push({
        $addFields: {
            subRegionsIds: null,
            retailSegmentsIds: null,
            branches: {
                $reduce: {
                    input: '$branches',
                    initialValue: [],
                    in: {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $setIsSubset: [['$$this.subRegion'], '$subRegionsIds'],
                                    },
                                    {
                                        $setIsSubset: [['$$this.retailSegment'], '$retailSegmentsIds'],
                                    },
                                ],
                            },
                            then: {
                                $setUnion: [
                                    [
                                        {
                                            _id: '$$this._id',
                                            name: '$$this.name',
                                            subRegion: '$$this.subRegion',
                                            retailSegment: '$$this.retailSegment',
                                        },
                                    ],
                                    '$$value',
                                ],
                            },
                            else: '$$value',
                        },
                    },
                },
            },
        },
    });

    return pipeline;
};
