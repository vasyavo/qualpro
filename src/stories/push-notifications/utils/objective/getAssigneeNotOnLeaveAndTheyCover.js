const ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');
const PersonnelModel = require('./../../../../types/personnel/model');

/*
* @description Returns assignee and cover assignee's if it acceptable
* @param {Object} options
* @param {String[]} options.assignedTo
* @param {String} options.actionOriginator
* @param {Number[]} options.setAllowedRole
* @returns {String[]}
* */
module.exports = function * (options) {
    const assigneeWithoutActionOriginator = _.difference(options.assignedTo, [options.actionOriginator])
        .map(id => ObjectId(id));

    const { setAllowedRole } = options;
    const pipeline = [{
        $match: {
            _id: {
                $in: assigneeWithoutActionOriginator,
            },
        },
    }, {
        $project: {
            onLeave: '$vacation.onLeave',
            cover: '$vacation.cover',
        },
    }, {
        $lookup: {
            from: 'personnels',
            localField: 'cover',
            foreignField: '_id',
            as: 'cover',
        },
    }, {
        $addFields: {
            cover: {
                $cond: {
                    if: { $gt: [{ $size: '$cover' }, 0] },
                    then: { $arrayElemAt: ['$cover', 0] },
                    else: null,
                },
            },
        },
    }, {
        $project: {
            onLeave: 1,
            'cover.accessRole': 1,
        },
    }, {
        $lookup: {
            from: 'accessRoles',
            localField: 'cover.accessRole',
            foreignField: '_id',
            as: 'cover.accessRole',
        },
    }, {
        $unwind: {
            path: '$cover.accessRole',
            preserveNullAndEmptyArrays: true,
        },
    }, {
        $project: {
            onLeave: 1,
            'cover.accessRole.level': 1,
        },
    }, {
        $group: {
            _id: null,
            personnels: { $push: '$$ROOT' },
        },
    }, {
        $project: {
            notOnLeave: {
                $filter: {
                    input: '$personnels',
                    as: 'item',
                    cond: { $eq: ['$$item.onLeave', false] },
                },
            },
            onLeaveAndWithoutCover: {
                $filter: {
                    input: '$personnels',
                    as: 'item',
                    cond: {
                        $and: [
                            { $eq: ['$$item.onLeave', true] },
                            { $eq: ['$$item.cover', null] },
                        ],
                    },
                },
            },
            onLeaveAndWithCover: {
                $filter: {
                    input: '$personnels',
                    as: 'item',
                    cond: {
                        $and: [
                            { $eq: ['$$item.onLeave', true] },
                            { $ne: ['$$item.cover', null] },
                            { $setIsSubset: [
                                ['$$item.cover.accessRole.level'],
                                setAllowedRole,
                            ] },
                        ],
                    },
                },
            },
        },
    }, {
        $project: {
            notOnLeave: {
                $map: {
                    input: '$notOnLeave',
                    as: 'item',
                    in: '$$item._id',
                },
            },
            onLeaveAndWithoutCover: {
                $map: {
                    input: '$onLeaveAndWithoutCover',
                    as: 'item',
                    in: '$$item._id',
                },
            },
            coverSet: {
                $map: {
                    input: '$onLeaveAndWithCover',
                    as: 'item',
                    in: '$$item.cover._id',
                },
            },
        },
    }, {
        $project: {
            assignee: {
                $setUnion: ['$notOnLeave', '$onLeaveAndWithoutCover', '$coverSet'],
            },
        },
    }];

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const groups = result.length ? result : [{ assignee: [] }];
    const assigneeSet = groups.slice()
        .pop()
        .assignee
        // personnel possibly haven't assigned to him manager
        .filter(objectId => objectId)
        .map(objectId => objectId.toString());

    return assigneeSet;
};
