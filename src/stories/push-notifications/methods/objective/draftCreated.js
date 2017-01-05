const co = require('co');
const getOriginatorById = require('./../../utils/getOriginatorById');
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
            draftObjective,
        } = options;

        const originator = yield getOriginatorById({
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
        const objectiveAsJson = savedObjective.toJSON();
        const groups = [{
            recipients: [originatorId],
            subject: 'New draft objective created',
            payload: objectiveAsJson,
        }];

        yield dispatch(groups);
    });
};
