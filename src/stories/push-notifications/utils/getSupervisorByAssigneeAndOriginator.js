const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');

module.exports = function * (options) {
    const assignedTo = options.assignedTo.map(id => ObjectId(id));
    const originator = ObjectId(options.originator);

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
            _id: 0,
            manager: 1,
        },
    }, {
        $group: {
            _id: null,
            manager: { $push: '$manager' },
        },
    }];

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const groups = result.length ? result : [{ manager: [] }];
    const arrayOfSupervisor = groups.slice()
        .pop()
        .manager
        // personnel possibly haven't assigned to him manager
        .filter(objectId => objectId)
        .map(objectId => objectId.toString());

    return arrayOfSupervisor;
};
