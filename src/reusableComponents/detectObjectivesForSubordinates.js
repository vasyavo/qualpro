const _ = require('underscore');

module.exports = (data, subordinatesId, currentUserId) => {
    return data.map((objective) => {
        let assignedToId;
        let createdById;

        if (_.isObject(objective.assignedTo[0])) {
            assignedToId = objective.assignedTo[0]._id.toString();
        }

        if (_.isObject(objective.createdBy.user)) {
            createdById = objective.createdBy.user._id.toString();
        }

        if (subordinatesId.indexOf(assignedToId) > -1 && createdById !== currentUserId) {
            objective.myCC = true;
        }

        return objective;
    });
};
