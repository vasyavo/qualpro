const wrap = require('co-express');
const _ = require('lodash');
const BranchModel = require('./../../../types/branch/model');
const logger = require('./../../../utils/logger');
const FilterMapper = require('./../../../helpers/filterMapper');

module.exports = wrap(function *(req, res, next) {
    const query = req.query;
    const queryFilter = query.filter || {};
    const pipeLine = [];

    const filterMapper = new FilterMapper();
    const filter = filterMapper.mapFilter({
        filter: queryFilter,
        personnel: req.personnelModel
    });
    const beforeFilter = _.pick(filter, 'subRegion', 'retailSegment', 'outlet');

    // match by 'subRegion', 'retailSegment', 'outlet'
    if (Object.keys(beforeFilter).length) {
        pipeLine.push({
            $match: beforeFilter
        });
    }

    // subRegion pipelines START
    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion',
            foreignField: '_id',
            as: 'subRegion'
        }
    }, {
        $unwind: {
            path: '$subRegion',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $project: {
            subRegion: {
                _id: 1,
                name: 1
            },
            region: '$subRegion.parent',
            _id: 1,
            name: 1,
            retailSegment: 1,
            outlet: 1
        }
    });
    // subRegion pipelines END

    // region pipelines START
    if (filter.region) {
        pipeLine.push({
            $match: {
                region: filter.region
            }
        });
    }

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'region',
            foreignField: '_id',
            as: 'region'
        }
    }, {
        $unwind: {
            path: '$region',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $project: {
            region: {
                _id: 1,
                name: 1
            },
            country: '$region.parent',
            _id: 1,
            name: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1
        }
    });
    // region pipelines END

    // country pipelines START
    if (filter.country) {
        pipeLine.push({
            $match: {
                country: filter.country
            }
        });
    }

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'country',
            foreignField: '_id',
            as: 'country'
        }
    }, {
        $unwind: {
            path: '$country',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $project: {
            country: {
                _id: 1,
                name: 1
            },
            _id: 1,
            name: 1,
            subRegion: 1,
            region: 1,
            retailSegment: 1,
            outlet: 1
        }
    });
    // country pipelines END

    // end pipelines - retailSegment, outlet
    pipeLine.push({
        $lookup: {
            from: 'retailSegments',
            localField: 'retailSegment',
            foreignField: '_id',
            as: 'retailSegment'
        }
    }, {
        $unwind: {
            path: '$retailSegment',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $lookup: {
            from: 'outlets',
            localField: 'outlet',
            foreignField: '_id',
            as: 'outlet'
        }
    }, {
        $unwind: {
            path: '$outlet',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $project: {
            retailSegment: {
                _id: 1,
                name: 1
            },
            outlet: {
                _id: 1,
                name: 1
            },
            country: 1,
            region: 1,
            subRegion: 1,
            branch: {
                _id: '$_id',
                name: '$name'
            }
        }
    });

    // group all data ito one document
    pipeLine.push({
        $group: {
            _id: null,
            country: { $addToSet: '$country' },
            region: { $addToSet: '$region' },
            subRegion: { $addToSet: '$subRegion' },
            retailSegment: { $addToSet: '$retailSegment' },
            outlet: { $addToSet: '$outlet' },
            branch: { $addToSet: '$branch' },
        }
    });

    const result = yield BranchModel.aggregate(pipeLine)
        .allowDiskUse(true)
        .exec();

    const groups = result[0] || {};
    const response = {
        country: groups.country || [],
        region: groups.region || [],
        subRegion: groups.subRegion || [],
        branch: groups.branch || [],
        retailSegment: groups.retailSegment || [],
        outlet: groups.outlet || [],
    };

    res.status(200).send(response);
});
