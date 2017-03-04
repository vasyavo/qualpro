const _ = require('lodash');
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');
const getEveryAdminInCountry = require('./../../utils/getEveryAdminInSameCountryAsOriginator');

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
        coverUsers,
    } = options;

    const actionOriginator = toString(options, 'actionOriginator');

    const getEveryAdminsInCountry = yield getEveryAdminInCountry({
        actionOriginator,
    });

    if (coverUsers && coverUsers.length) {
        _.union(getEveryAdminsInCountry, coverUsers);
    }

    const newActivity = new ActivityModel();

    newActivity.set({
        itemType: contentType,
        module: moduleId,
        actionType,
        itemId: body._id,
        itemName: {
            en: body.firstName.en + body.lastName.en,
            ar: body.firstName.ar + body.lastName.ar,
        },
        createdBy: {
            user: actionOriginator,
        },
        accessRoleLevel,
        personnels: getEveryAdminsInCountry,
        country: body.country,
        region: body.region,
        subRegion: body.subRegion,
        retailSegment: body.retailSegment,
        outlet: body.outlet,
        branch: body.branch,
    });

    const result = yield newActivity.save();

    const payload = {
        actionType,
    };

    getEveryAdminsInCountry.push(options.actionOriginator);

    return {
        actionOriginator,
        payload,
        setEveryoneInLocation: getEveryAdminsInCountry,
        name: result.itemName,
    };
};
