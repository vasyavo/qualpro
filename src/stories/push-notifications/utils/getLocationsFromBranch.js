const BranchModel = require('./../../../types/branch/model');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = function * (branch) {
    const pipeline = [];

    pipeline.push({
        $match: {
            _id: ObjectId(branch),
        },
    });

    pipeline.push({
        $project: {
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $addFields: {
            subRegion: {
                $let: {
                    vars: {
                        item: { $arrayElemAt: ['$subRegion', 0] },
                    },
                    in: '$$item._id',
                },
            },
            region: {
                $let: {
                    vars: {
                        item: { $arrayElemAt: ['$subRegion', 0] },
                    },
                    in: '$$item.parent',
                },
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $addFields: {
            region: {
                $let: {
                    vars: {
                        item: { $arrayElemAt: ['$region', 0] },
                    },
                    in: '$$item._id',
                },
            },
            country: {
                $let: {
                    vars: {
                        item: { $arrayElemAt: ['$region', 0] },
                    },
                    in: '$$item.parent',
                },
            },
        },
    });

    const result = yield BranchModel.aggregate(pipeline).exec();

    return {
        setCountry: [result[0].country],
        setRegion: [result[0].region],
        setSubRegion: [result[0].subRegion],
        setBranch: [result[0].branch],
        setRetailSegment: [result[0].retailSegment],
        setOutlet: [result[0].outlet],
    };
};
