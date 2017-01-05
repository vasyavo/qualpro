const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');

module.exports = function * (options) {
    const assignedTo = options.assignedTo.map(id => ObjectId(id));
    const originator = options.originator;

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
            }]
        },
    }, {
        $project: {
            _id: null,
            manager: 1,
        },
    }, {
        $group: {
            manager: { $addToSet: '$manager', },
        }
    }];

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const arrayOfSupervisor = result.pop().manager;

    return arrayOfSupervisor;
};
