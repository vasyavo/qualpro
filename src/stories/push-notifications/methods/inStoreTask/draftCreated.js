const co = require('co');
const getOriginatorById = require('./../../utils/getOriginatorById');
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
            draftInStoreTask,
        } = options;

        const originator = yield getOriginatorById({
            id: originatorId,
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
            subject: 'New draft in-store task created',
            payload: inStoreTaskAsJson,
        }];

        yield dispatch(groups);
    });
};
