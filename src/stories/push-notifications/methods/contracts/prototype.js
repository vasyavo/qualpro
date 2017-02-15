const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');
const getEveryoneInLocation = require('./../../utils/getEveryoneInLocation');

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
    } = options;

    const actionOriginator = toString(options, 'actionOriginator');
    const contentAuthor = toString(options, 'body.createdBy.user');
    const setCountry = [body.country];
    const setRegion = [body.region];
    const setSubRegion = [body.subRegion];
    const setOutlet = [body.outlet];
    const setBranch = [body.branch];

    const setEveryoneInLocation = yield getEveryoneInLocation({
        exclude: [],
        setCountry,
        setRegion,
        setSubRegion,
        setOutlet,
        setBranch,
    });

    const newActivity = new ActivityModel();

    newActivity.set({
        itemType: contentType,
        module: moduleId,
        actionType,
        itemId: body._id,
        itemName: {
            en: '',
            ar: '',
        },
        createdBy: {
            user: actionOriginator,
        },
        accessRoleLevel,
        assignedTo: [],
        personnels: setEveryoneInLocation,
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
        setEveryoneInLocation,
        contentAuthor,
    };
};
