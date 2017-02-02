const ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');
const PersonnelModel = require('./../../../types/personnel/model');
const accessRoles = require('./../../../constants/aclRolesNames');

module.exports = function * (options) {
    const assigneeWithoutActionOriginator = _.difference(options.assignedTo, [options.actionOriginator])
        .map(id => ObjectId(id));

    const allowedRoles = [
        accessRoles.MASTER_ADMIN,
        accessRoles.MASTER_UPLOADER,
        accessRoles.COUNTRY_ADMIN,
        accessRoles.COUNTRY_UPLOADER,
        accessRoles.AREA_MANAGER,
        accessRoles.AREA_IN_CHARGE,
        accessRoles.TRADE_MARKETER,
    ];
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
    }, {
        $lookup: {
            from: 'personnels',
            localField: 'cover',
            foreignField: '_id',
            as: 'cover',
        },
    }, {
        $project: {
            accessRole: 1,
            onLeave: 1,
            cover: {
                $cond: {
                    if: { $gt: [{ $size: '$cover' }, 0] },
                    then: { $arrayElemAt: ['$cover', 0] },
                    else: null,
                },
            },
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
                            { $setIsSubset: [
                                ['$$item.accessRole.level'],
                                allowedRoles,
                            ] },
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
