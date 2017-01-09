const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');

module.exports = function * (options) {
    const { id } = options;
    const pipeline = [{
        $match: {
            _id: ObjectId(id),
        },
    }, {
        $project: {
            _id: 1,
            accessRole: 1,
            manager: 1,
            vacation: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
        },
    }, {
        $lookup: {
            from: 'accessRoles',
            localField: 'accessRole',
            foreignField: '_id',
            as: 'accessRole',
        },
    }, {
        $unwind: {
            path: '$accessRole',
            preserveNullAndEmptyArrays: true,
        },
    }];

    const result = yield PersonnelModel.aggregate(pipeline).exec();

    return result.pop();
};
