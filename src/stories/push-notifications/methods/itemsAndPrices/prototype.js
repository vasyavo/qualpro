const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');
const getEveryoneInCountry = require('./../../utils/getEveryoneInCountry');

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
    } = options;

    const actionOriginator = toString(options, 'actionOriginator');
    const setCountry = Array.isArray(body.location) ?
        body.location.map(location => location.country) : [];

    const setEveryoneInCountry = yield getEveryoneInCountry({
        setCountry,
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
        personnels: setEveryoneInCountry,
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
        setEveryoneInCountry,
    };
};
