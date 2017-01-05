const co = require('co');
const getOriginatorById = require('./../../utils/getOriginatorById');
const getSupervisorByAssigneeAndOriginator = require('./../../utils/getSupervisorByAssigneeAndOriginator');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const ActivityModel = require('./../../../../types/activityList/model');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.OBJECTIVE;
        const contentType = contentTypes.OBJECTIVES;
        const actionType = activityTypes.CREATED;

        const {
            originatorId,
            draftInStoreTask,
        } = options;

        const originator = yield getOriginatorById({
            id: originatorId,
        });
        const arrayOfSupervisor = yield getSupervisorByAssigneeAndOriginator({
            assignedTo: draftInStoreTask.assignedTo,
            originator: originatorId,
        });

        const newActivity = new ActivityModel();

        newActivity.set({
            itemType: contentType,
            module: moduleId,
            actionType,
            itemId: draftInStoreTask._id,
            itemName: {
                en: draftInStoreTask.title.en,
                ar: draftInStoreTask.title.ar,
            },
            createdBy: {
                user: originatorId,
            },
            accessRoleLevel: originator.accessRole.level,
            personnels: [
                originatorId,
                draftInStoreTask.assignedTo,
                arrayOfSupervisor,
            ],
            assignedTo: draftInStoreTask.assignedTo,
            country: draftInStoreTask.country,
            region: draftInStoreTask.region,
            subRegion: draftInStoreTask.subRegion,
            retailSegment: draftInStoreTask.retailSegment,
            outlet: draftInStoreTask.outlet,
            branch: draftInStoreTask.branch,
        });

        const savedInStoreTask = yield newActivity.save();
        const inStoreTaskAsJson = savedInStoreTask.toJSON();

        const groups = [{
            recipients: [originatorId],
            subject: 'New in-store task published',
            payload: inStoreTaskAsJson,
        }, {
            recipients: draftInStoreTask.assignedTo,
            subject: 'You assigned to new in-store task',
            payload: inStoreTaskAsJson,
        }, {
            recipients: arrayOfSupervisor,
            subject: 'Your subordinate received new in-store task',
            payload: inStoreTaskAsJson,
        }];

        yield dispatch(groups);
    });
};
