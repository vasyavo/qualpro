const _ = require('lodash');
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');
const getSupervisorByAssigneeAndOriginator = require('./../../utils/getSupervisorByAssigneeAndOriginator');
const getOriginatorByParentObjective = require('./../../utils/getOriginatorByParentObjective');
const getAssigneeNotOnLeaveAndTheyCover = require('./../../utils/getAssigneeNotOnLeaveAndTheyCover');

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
    const arrayOfParentObjectiveId = _(body.parent)
        .values()
        .compact()
        .value();

    const assignedTo = yield getAssigneeNotOnLeaveAndTheyCover({
        assignedTo: body.assignedTo,
        actionOriginator,
    });
    const [
        arrayOfSupervisor,
        arrayOfOriginator,
    ] = yield [
        getSupervisorByAssigneeAndOriginator({
            assignedTo,
            originator: contentAuthor,
        }),
        getOriginatorByParentObjective({
            objectives: arrayOfParentObjectiveId,
        })
    ];

    const newActivity = new ActivityModel();

    newActivity.set({
        itemType: contentType,
        module: moduleId,
        actionType,
        itemId: body._id,
        itemName: {
            en: body.title.en,
            ar: body.title.ar,
        },
        createdBy: {
            user: actionOriginator,
        },
        accessRoleLevel,
        personnels: _.uniq([
            actionOriginator,
            contentAuthor,
            ...assignedTo,
            ...arrayOfSupervisor,
            ...arrayOfOriginator,
        ]),
        assignedTo,
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
        setOriginator: arrayOfOriginator.filter((originator) => (originator !== actionOriginator)),
        setAssignee: assignedTo.filter((assignee) => (assignee !== actionOriginator)),
        setSupervisor: arrayOfSupervisor.filter((supervisor) => (supervisor !== actionOriginator)),
    };
};
