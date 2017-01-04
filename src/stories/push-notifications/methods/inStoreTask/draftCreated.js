const co = require('co');
const getPersonnelById = require('./../../utils/getPersonnelById');
const dispatchAction = require('./../../utils/dispatch');
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
            draftObjective,
        } = options;

        const originator = yield getPersonnelById({
            id: originatorId,
        });

        const newActivity = new ActivityModel();

        newActivity.set({
            itemType: contentType,
            module: moduleId,
            actionType,
            itemId: draftObjective._id,
            itemName: {
                en: draftObjective.title.en,
                ar: draftObjective.title.ar,
            },
            createdBy: {
                user: originatorId,
            },
            accessRoleLevel: originator.accessRole.level,
            personnels: [
                originatorId,
            ],
            assignedTo: draftObjective.assignedTo,
            country: draftObjective.country,
            region: draftObjective.region,
            subRegion: draftObjective.subRegion,
            retailSegment: draftObjective.retailSegment,
            outlet: draftObjective.outlet,
            branch: draftObjective.branch,
        });

        const savedObjective = yield newActivity.save();
        const action = {
            userId: originatorId,
            data: savedObjective.toJSON(),
        };

        yield dispatchAction(action);
    });
};
