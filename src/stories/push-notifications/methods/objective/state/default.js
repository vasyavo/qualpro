const _ = require('lodash');
const ActivityModel = require('./../../../../../types/activityList/model');
const toString = require('./../../../../../utils/toString');
const getSupervisorByAssigneeAndOriginator = require('./../../../utils/objective/getSupervisorByAssigneeAndOriginator');
const getOriginatorByParentObjective = require('./../../../utils/objective/getOriginatorByParentObjective');
const getAssigneeNotOnLeaveAndTheyCover = require('./../../../utils/objective/getAssigneeNotOnLeaveAndTheyCover');
const getAllowedRoles = require('./../../../utils/objective/getAllowedRoles');
const setObjectIdToSetString = require('./../../../utils/arrayOfObjectIdToArrayOfString');

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
    } = options;

    const setAllowedRole = getAllowedRoles({
        context: body.context,
    });
    const actionOriginator = toString(options, 'actionOriginator');
    const contentAuthor = toString(body, 'createdBy.user');
    const arrayOfParentObjectiveId = _(body.parent)
        .values()
        .compact()
        .value();
    const [
        setActualAssignee,
    ] = setObjectIdToSetString(
        body.assignedTo
    );

    const setAssigneeNotOnLeaveAndCover = yield getAssigneeNotOnLeaveAndTheyCover({
        assignedTo: setActualAssignee,
        actionOriginator,
        setAllowedRole,
    });
    const setAssignee = _.uniq([
        ...setActualAssignee,
        ...setAssigneeNotOnLeaveAndCover,
    ]);
    const [
        setSupervisor,
        setOriginator,
    ] = yield [
        getSupervisorByAssigneeAndOriginator({
            assignedTo: setAssignee,
            originator: contentAuthor,
            setAllowedRole,
        }),
        getOriginatorByParentObjective({
            objectives: arrayOfParentObjectiveId,
        }),
    ];

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
            ...setSupervisor,
            ...setOriginator,
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
        actionOriginator,
        contentAuthor,
        setHighPriority: _.uniq([actionOriginator, contentAuthor]),
        setOriginator: setOriginator.filter((originator) => (originator !== actionOriginator)),
        setAssignee: setAssignee.filter((assignee) => (assignee !== actionOriginator)),
        setSupervisor: setSupervisor.filter((supervisor) => (supervisor !== actionOriginator)),
    };
};
