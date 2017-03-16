const _ = require('lodash');
const ActivityModel = require('./../../../../../types/activityList/model');
const toString = require('./../../../../../utils/toString');
const getReportGroupsByOriginator = require('./../../../utils/getReportGroupsByOriginator');
const getEveryoneInLocation = require('./../../../utils/getEveryoneInLocation');
const getLocationsFromBranch = require('./../../../utils/getLocationsFromBranch');

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

    const setOutlet = [body.outlet];
    const setBranch = [body.branch];
    const {
        setCountry,
        setRegion,
        setSubRegion,
        setRetailSegment,
    } = yield getLocationsFromBranch(body.branch);

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
        retailSegment: setRetailSegment,
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
