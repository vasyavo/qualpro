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

    const setCountry = Array.isArray(body.country) ? body.country : [];
    const setRegion = Array.isArray(body.region) ? body.region : [];
    const setSubRegion = Array.isArray(body.subRegion) ? body.subRegion : [];
    const setOutlet = Array.isArray(body.outlet) ? body.outlet : [];
    const setBranch = Array.isArray(body.branch) ? body.branch : [];

    const setEveryoneInLocation = yield getEveryoneInLocation({
        exclude: setPersonnel,
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
        personnels: [
            ...setPersonnel,
            ...setEveryoneInLocation,
        ],
        country: setCountry,
        region: setRegion,
        subRegion: setSubRegion,
        retailSegment: body.retailSegment,
        outlet: setOutlet,
        branch: setBranch,
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
