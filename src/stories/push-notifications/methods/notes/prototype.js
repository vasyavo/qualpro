const _ = require('lodash');
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
    } = options;

    const actionOriginator = toString(options, 'actionOriginator');

    const newActivity = new ActivityModel();

    newActivity.set({
        itemType: contentType,
        module: moduleId,
        actionType,
        itemId: body._id,
        itemName: {
            en: _.get(body, 'title.en'),
            ar: _.get(body, 'title.ar'),
        },
        createdBy: {
            user: actionOriginator,
        },
        accessRoleLevel,
        personnels: [
            actionOriginator,
        ],
        assignedTo: [],
        country: [],
        region: [],
        subRegion: [],
        retailSegment: [],
        outlet: [],
        branch: [],
    });

    yield newActivity.save();

    const payload = {
        actionType,
    };

    return {
        payload,
        actionOriginator,
    };
};
