const co = require('co');
const _ = require('lodash');
const getSupervisorByAssigneeAndOriginator = require('./../../utils/getSupervisorByAssigneeAndOriginator');
const arrayOfObjectIdToArrayOfString = require('./../../utils/arrayOfObjectIdToArrayOfString');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const ActivityModel = require('./../../../../types/activityList/model');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.IN_STORE_REPORTING;
        const contentType = contentTypes.INSTORETASKS;
        const actionType = activityTypes.UPDATED;

        const {
            originatorId,
            accessRoleLevel,
            body,
        } = options;

        const [
            assignedTo,
        ] = arrayOfObjectIdToArrayOfString(
            body.assignedTo
        );
        const arrayOfSupervisor = yield getSupervisorByAssigneeAndOriginator({
            assignedTo,
            originator: originatorId,
        });

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
                user: originatorId,
            },
            accessRoleLevel,
            personnels: _.uniq([
                originatorId,
                ...assignedTo,
                ...arrayOfSupervisor,
            ]),
            assignedTo,
            country: body.country,
            region: body.region,
            subRegion: body.subRegion,
            retailSegment: body.retailSegment,
            outlet: body.outlet,
            branch: body.branch,
        });

        const savedActivity = yield newActivity.save();
        const activityAsJson = savedActivity.toJSON();

        const groups = [{
            recipients: [originatorId],
            subject: 'In-store task updated',
            payload: activityAsJson,
        }, {
            // if AM reassign task created by CA to SM
            recipients: _.difference(assignedTo, [originatorId]),
            subject: 'Received updated in-store task',
            payload: activityAsJson,
        }, {
            recipients: arrayOfSupervisor,
            subject: `Subordinate's in-store task updated`,
            payload: activityAsJson,
        }];

        yield dispatch(groups);
    });
};
