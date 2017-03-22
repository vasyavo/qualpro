const mongoose = require('mongoose');
const logger = require('./../../../utils/logger');

const ObjectiveModel = require('./../../../types/objective/model');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (options) => {
    const {
        setObjectiveId,
        assignedTo,
    } = options;
    const query = {
        _id: {
            $in: setObjectiveId,
        },
    };

    ObjectiveModel.update(query, {
        $set: {
            'createdBy.user': ObjectId(assignedTo[0]),
        },
    }, {
        multi: true,
        runValidators: true,
    }, (err) => {
        if (err) {
            logger.error(err);
        }
    });
};
