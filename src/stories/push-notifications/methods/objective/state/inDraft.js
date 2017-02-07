const _ = require('lodash');
const ActivityModel = require('./../../../../../types/activityList/model');
const toString = require('./../../../../../utils/toString');
const setObjectIdToSetString = require('./../../../utils/arrayOfObjectIdToArrayOfString');

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
    } = options;

    const actionOriginator = toString(options, 'actionOriginator');
    const contentAuthor = toString(body, 'createdBy.user');
    const [
        setAssignee,
    ] = setObjectIdToSetString(
        body.assignedTo
    );

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
        personnels: _.uniq([
            actionOriginator,
            contentAuthor,
            ...setAssignee,
        ]),
        assignedTo: setAssignee,
        country: body.country,
        region: body.region,
        subRegion: body.subRegion,
        retailSegment: body.retailSegment,
        outlet: body.outlet,
        branch: body.branch,
    });

    yield newActivity.save();

    const payload = {
        actionType,
    };

    return {
        payload,
        actionOriginator: _.uniq([actionOriginator, contentAuthor]).pop(),
        setOriginator: [],
        setAssignee: [],
        setSupervisor: [],
    };
};
