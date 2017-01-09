const co = require('co');
const _ = require('lodash');
const getSupervisorByAssigneeAndOriginator = require('./../../../utils/getSupervisorByAssigneeAndOriginator');
const getOriginatorByParentObjective = require('./../../../utils/getOriginatorByParentObjective');
const arrayOfObjectIdToArrayOfString = require('./../../../utils/arrayOfObjectIdToArrayOfString');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const ActivityModel = require('./../../../../../types/activityList/model');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.OBJECTIVE;
        const contentType = contentTypes.OBJECTIVES;
        const actionType = activityTypes.CREATED;

        const {
            originatorId,
            accessRoleLevel,
            objective,
        } = options;

        const arrayOfParentObjectiveId = _(objective.parent)
            .values()
            .compact()
            .value();

        const [
            assignedTo,
        ] = arrayOfObjectIdToArrayOfString(
            objective.assignedTo
        );
        const [
            arrayOfSupervisor,
            arrayOfOriginator,
        ] = yield [
            getSupervisorByAssigneeAndOriginator({
                assignedTo,
                originator: originatorId,
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
            itemId: objective._id,
            itemName: {
                en: objective.title.en,
                ar: objective.title.ar,
            },
            createdBy: {
                user: originatorId,
            },
            accessRoleLevel,
            // we should store unique values in personnels
            personnels: _.uniq([
                originatorId,
                ...assignedTo,
                ...arrayOfSupervisor,
                ...arrayOfOriginator,
            ]),
            assignedTo,
            country: objective.country,
            region: objective.region,
            subRegion: objective.subRegion,
            retailSegment: objective.retailSegment,
            outlet: objective.outlet,
            branch: objective.branch,
        });

        const savedActivity = yield newActivity.save();
        const activityAsJson = savedActivity.toJSON();

        const groups = [{
            recipients: [originatorId],
            subject: 'Objective published',
            payload: activityAsJson,
        }, {
            recipients: arrayOfOriginator,
            subject: 'Sub-objective published',
            payload: activityAsJson,
        }, {
            recipients: assignedTo,
            subject: 'Received new objective',
            payload: activityAsJson,
        }, {
            /*
            * if CA assign to AM
            * then CA is an originator
            * and supervisor at the same time
            * then save difference
            * */
            recipients: arrayOfSupervisor,
            subject: 'Subordinate received new objective',
            payload: activityAsJson,
        }];

        yield dispatch(groups);
    });
};
