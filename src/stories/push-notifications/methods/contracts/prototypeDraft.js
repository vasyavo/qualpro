const _ = require('lodash');
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
    } = options;

    const actionOriginator = toString(options, 'actionOriginator');
    const location = [
        body.country,
        body.region,
        body.subRegion,
        body.outlet,
        body.branch,
        body.retailSegment,
    ];
    const [
        setCountry,
        setRegion,
        setSubRegion,
        setOutlet,
        setBranch,
        setRetailSegment,
    ] = location.map(item => {
        if (Array.isArray(item)) {
            return item;
        }

        return [item];
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
            actionOriginator,
        ],
        assignedTo: [],
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
    };
};
