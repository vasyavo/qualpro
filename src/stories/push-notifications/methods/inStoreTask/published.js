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
        const actionType = activityTypes.CREATED;

        const {
            originatorId,
            accessRoleLevel,
            inStoreTask,
        } = options;

        const [
            assignedTo,
        ] = arrayOfObjectIdToArrayOfString(
            inStoreTask.assignedTo
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
            itemId: inStoreTask._id,
            itemName: {
                en: inStoreTask.title.en,
                ar: inStoreTask.title.ar,
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
            country: inStoreTask.country,
            region: inStoreTask.region,
            subRegion: inStoreTask.subRegion,
            retailSegment: inStoreTask.retailSegment,
            outlet: inStoreTask.outlet,
            branch: inStoreTask.branch,
        });

        const savedActivity = yield newActivity.save();
        const activityAsJson = savedActivity.toJSON();

        const groups = [{
            recipients: [originatorId],
            subject: 'In-store task published',
            payload: activityAsJson,
        }, {
            recipients: assignedTo,
            subject: 'Received new in-store task',
            payload: activityAsJson,
        }, {
            recipients: arrayOfSupervisor,
            subject: 'Subordinate received new in-store task',
            payload: activityAsJson,
        }];

        yield dispatch(groups);
    });
};
