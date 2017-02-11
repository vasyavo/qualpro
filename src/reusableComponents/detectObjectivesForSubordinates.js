const _ = require('lodash');
const toString = require('./../utils/toString');

module.exports = (data, subordinatesId, currentUserId) => {
    return data.map((objective) => {
        const assignedToId = toString(objective, 'assignedTo[0]._id');
        const createdById = toString(objective, 'createdBy.user._id');

        if (subordinatesId.indexOf(assignedToId) > -1 && createdById !== currentUserId) {
            objective.myCC = true;
        }

        return objective;
    });
};
