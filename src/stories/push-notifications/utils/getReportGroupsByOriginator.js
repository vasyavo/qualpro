const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');
const accessRoles = require('./../../../constants/aclRolesNames');

const setHighAdmin = [
    accessRoles.MASTER_ADMIN,
    accessRoles.TRADE_MARKETER,
];

module.exports = function * (options) {
    const actionOriginator = ObjectId(options.actionOriginator);

    const pipeline = [{
        $project: {
            accessRole: 1,
            manager: 1,
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
        },
    }, {
        $match: {
            $or: [{
                'accessRole.level': {
                    $in: setHighAdmin,
                },
            }, {
                _id: actionOriginator,
            }],
        },
    }, {
        $group: {
            _id: null,
            personnels: {
                $push: '$$ROOT',
            },
        },
    }, {
        $project: {
            originator: {
                $arrayElemAt: [{
                    $filter: {
                        input: '$personnels',
                        as: 'item',
                        cond: { $eq: ['$$item._id', actionOriginator] },
                    },
                }, 0],
            },
            setHighAdmin: {
                $filter: {
                    input: '$personnels',
                    as: 'item',
                    cond: { $ne: ['$$item._id', actionOriginator] },
                },
            },
        },
    }, {
        $lookup: {
            from: 'personnels',
            localField: 'originator.manager',
            foreignField: '_id',
            as: 'managerSM',
        },
    }, {
        $unwind: {
            path: '$managerSM',
            preserveNullAndEmptyArrays: true,
        },
    }, {
        $lookup: {
            from: 'personnels',
            localField: 'managerSM.manager',
            foreignField: '_id',
            as: 'managerAinM',
        },
    }, {
        $unwind: {
            path: '$managerAinM',
            preserveNullAndEmptyArrays: true,
        },
    }, {
        $lookup: {
            from: 'personnels',
            localField: 'managerAinM.manager',
            foreignField: '_id',
            as: 'managerAM',
        },
    }, {
        $unwind: {
            path: '$managerAM',
            preserveNullAndEmptyArrays: true,
        },
    }, {
        $project: {
            _id: 0,
            originator: '$originator._id',
            supervisor: '$managerSM._id',
            setAdmin: {
                $map: {
                    input: {
                        // fixme: filter action originator
                        $setDifference: [{
                            $setUnion: ['$setHighAdmin', ['$managerAinM', '$managerAM']],
                        }, [null]],
                    },
                    as: 'item',
                    in: '$$item._id',
                },
            },
        },
    }];

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const validResult = result.length ?
        result : [{
            originator: null,
            supervisor: null,
            setAdmin: [],
        }];
    return validResult
        .map(groups => ({
            originator: groups.originator ?
                groups.originator.toString() : null,
            supervisor: groups.supervisor ?
                groups.supervisor.toString() : null,
            setAdmin: groups.setAdmin.map(objectId => objectId.toString()),
        }))
        .pop();
};
