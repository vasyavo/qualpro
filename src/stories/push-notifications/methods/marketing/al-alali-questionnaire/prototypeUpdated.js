const _ = require('lodash');
const ActivityModel = require('./../../../../../types/activityList/model');
const toString = require('./../../../../../utils/toString');
const getEveryoneInFilledLocation = require('./../../../utils/getEveryoneInFilledLocation');

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
    const setCountry = Array.isArray(body.country) ? body.country : [];
    const setRegion = Array.isArray(body.region) ? body.region : [];
    const setSubRegion = Array.isArray(body.subRegion) ? body.subRegion : [];
    const setOutlet = Array.isArray(body.outlet) ? body.outlet : [];
    const setBranch = Array.isArray(body.branch) ? body.branch : [];

    const setEveryoneInLocation = yield getEveryoneInFilledLocation({
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
            en: _.get(body, 'title.en'),
            ar: _.get(body, 'title.ar'),
        },
        createdBy: {
            user: actionOriginator,
        },
        accessRoleLevel,
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
        actionOriginator,
        payload,
        setEveryoneInLocation,
        contentAuthor,
    };
};
