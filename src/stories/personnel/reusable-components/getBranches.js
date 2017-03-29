const BranchCollection = require('./../../../types/branch/collection');

module.exports = (options, callback) => {
    const {
        setSubRegion,
        setBranch,
    } = options;

    const $match = {};
    const setSubRegionId = setSubRegion.map(item => item._id);

    if (setBranch.length) {
        const setBranchId = setBranch.map(item => item._id);

        $match.$and = [{
            _id: {
                $in: setBranchId,
            },
        }, {
            subRegion: {
                $in: setSubRegionId,
            },
        }];
    } else {
        $match.subRegion = {
            $in: setSubRegionId,
        };
    }

    const pipeline = [{
        $match,
    }, {
        $project: {
            'name.en': 1,
            'name.ar': 1,
            retailSegment: 1,
            outlet: 1,
        },
    }, {
        $group: {
            _id: null,
            setBranch: {
                $push: {
                    _id: '$_id',
                    name: {
                        en: '$name.en',
                        ar: '$name.ar',
                    },
                },
            },
            setRetailSegment: {
                $addToSet: '$retailSegment',
            },
            setOutlet: {
                $addToSet: '$outlet',
            },
        },
    }, {
        $project: {
            setBranch: 1,
            setRetailSegment: {
                $filter: {
                    input: '$setRetailSegment',
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
            setOutlet: {
                $filter: {
                    input: '$setOutlet',
                    as: 'item',
                    cond: {
                        $ne: ['$$item', null],
                    },
                },
            },
        },
    }, {
        $lookup: {
            from: 'retailSegments',
            localField: 'setRetailSegment',
            foreignField: '_id',
            as: 'setRetailSegment',
        },
    }, {
        $project: {
            setBranch: 1,
            setRetailSegment: {
                _id: 1,
                name: {
                    en: 1,
                    ar: 1,
                },
            },
            setOutlet: 1,
        },
    }, {
        $lookup: {
            from: 'outlets',
            localField: 'setOutlet',
            foreignField: '_id',
            as: 'setOutlet',
        },
    }, {
        $project: {
            setBranch: 1,
            setRetailSegment: 1,
            setOutlet: {
                _id: 1,
                name: {
                    en: 1,
                    ar: 1,
                },
            },
        },
    }];

    BranchCollection.aggregate(pipeline, callback);
};
