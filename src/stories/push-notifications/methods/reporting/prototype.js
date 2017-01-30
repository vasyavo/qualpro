const _ = require('lodash');
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');
const getReportGroupsByOriginator = require('./../../utils/getReportGroupsByOriginator');
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
    const contentAuthor = toString(body, 'createdBy.user');
    const {
        supervisor,
        setAdmin,
    } = yield getReportGroupsByOriginator({
        actionOriginator,
    });
    const setPersonnel = _.uniq([
        actionOriginator,
        contentAuthor,
        supervisor,
        ...setAdmin,
    ]);
    const setEveryoneInLocation = yield getEveryoneInLocation({
        exclude: setPersonnel,
        setCountry: Array.isArray(body.country) ? body.country : [],
        setRegion: Array.isArray(body.region) ? body.region : [],
        setSubRegion: Array.isArray(body.subRegion) ? body.subRegion : [],
        setOutlet: Array.isArray(body.outlet) ? body.outlet : [],
        setBranch: Array.isArray(body.branch) ? body.branch : [],
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
        personnels: [
            ...setPersonnel,
            ...setEveryoneInLocation,
        ],
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
        actionOriginator,
        contentAuthor,
        supervisor,
        setEveryoneInLocation: [
            ...setEveryoneInLocation,
            ...setAdmin,
        ],
    };
};
