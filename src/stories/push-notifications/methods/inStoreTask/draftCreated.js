const co = require('co');
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
            personnels: [
                originatorId,
            ],
            assignedTo: inStoreTask.assignedTo,
            country: inStoreTask.country,
            region: inStoreTask.region,
            subRegion: inStoreTask.subRegion,
            retailSegment: inStoreTask.retailSegment,
            outlet: inStoreTask.outlet,
            branch: inStoreTask.branch,
        });

        yield newActivity.save();

        const payload = {
            actionType,
        };
        const groups = [{
            recipients: [originatorId],
            subject: {
                en: 'Draft in-store task saved',
                ar: 'Draft in-store task saved',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
