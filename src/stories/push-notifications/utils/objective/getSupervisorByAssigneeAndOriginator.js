const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../../types/personnel/model');

/*
 * @description Returns assignee's supervisor without action originator
 * @param {Object} options
 * @param {String[]} options.assignedTo
 * @param {String} options.originator
 * @param {Number[]} options.setAllowedRole
 * @returns {String[]}
 * */
module.exports = function * (options) {
    const assignedTo = options.assignedTo.map(id => ObjectId(id));
    const originator = ObjectId(options.originator);
    const { setAllowedRole } = options;

    const pipeline = [{
        $match: {
            $and: [{
                // looking for supervisor of each assignee
                _id: {
                    $in: assignedTo,
                },
            }, {
                // except supervisor which is originator himself
                manager: {
                    $ne: originator,
                },
            }],
        },
    }, {
        $project: {
            manager: 1,
        },
    }, {
        $lookup: {
            from: 'personnels',
            localField: 'manager',
            foreignField: '_id',
            as: 'manager',
        },
    }, {
        $unwind: {
            path: '$manager',
        },
    }, {
        $project: {
            'manager._id': 1,
            'manager.accessRole': 1,
        },
    }, {
        $lookup: {
            from: 'accessRoles',
            localField: 'manager.accessRole',
            foreignField: '_id',
            as: 'manager.accessRole',
        },
    }, {
        $unwind: {
            path: '$manager.accessRole',
        },
    }, {
        $project: {
            'manager._id': 1,
            'manager.accessRole.level': 1,
        },
    }, {
        $group: {
            _id: null,
            setManager: { $push: '$manager' },
        },
    }, {
        $project: {
            setManager: {
                $filter: {
                    input: '$setManager',
                    as: 'item',
                    cond: {
                        $setIsSubset: [['$$item.accessRole.level'], setAllowedRole],
                    },
                },
            },
        },
    }, {
        $project: {
            setManager: '$setManager._id',
        },
    }];

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const groups = result.length ? result : [{ setManager: [] }];
    const arrayOfSupervisor = groups.slice()
        .pop()
        .setManager
        // personnel possibly haven't assigned to him manager
        .filter(objectId => objectId)
        .map(objectId => objectId.toString());

    return arrayOfSupervisor;
};
