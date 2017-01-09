const ObjectId = require('mongoose').Types.ObjectId;
const ObjectiveModel = require('./../../../types/objective/model');

/*
* @param {Object[]} options.objectives Array of parent objective ID
* @returns {String[]} Array of personnel ID which are parents
* */
module.exports = function * (options) {
    const objectives = options.objectives.map(id => ObjectId(id));

    const pipeline = [{
        $match: {
            _id: {
                $in: objectives,
            },
        },
    }, {
        $project: {
            '_id': 0,
            'originator': '$createdBy.user',
        },
    }, {
        $group: {
            _id: null,
            originator: { $addToSet: '$originator', },
        }
    }];

    const result = yield ObjectiveModel.aggregate(pipeline).exec();
    const groups = result.length ? result : [{ originator: [] }];
    const arrayOfOriginator = groups.slice()
        .pop()
        .originator
        .map((objectId) => objectId.toString());

    return arrayOfOriginator;
};
