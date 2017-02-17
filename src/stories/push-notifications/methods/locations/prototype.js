const _ = require('lodash');
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');
const getEveryoneInLocation = require('./../../utils/getEveryoneInLocation');
const getParentLocations = require('./../../utils/getParentLocations');

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
        location,
        itemId
        } = options;

    const actionOriginator = toString(options, 'actionOriginator');

    let getEveryone = [];
    let getLocations = {};

    if (location){
        getEveryone = yield getEveryoneInLocation({
            exclude      : location.exclude || [],
            setCountry   : location.setCountry || [],
            setRegion    : location.setRegion || [],
            setSubRegion : location.setSubRegion || [],
            setOutlet    : location.setOutlet || [],
            setBranch    : location.setBranch || [],
        });

        getLocations = yield getParentLocations({
            itemId : itemId || body._id,
            contentType
        });

        if (body.subRegions && body.subRegions.length){
            getLocations.subRegion = body.subRegions;
        }
    }

    const newActivity = new ActivityModel();

    newActivity.set({
        itemType: contentType,
        module: moduleId,
        actionType,
        itemId: body._id,
        itemName: {
            en: body.name.en,
            ar: body.name.ar
        },
        createdBy: {
            user: actionOriginator,
        },
        accessRoleLevel,
        personnels: getEveryone || [],
        country: getLocations.country || [],
        region: getLocations.region || [],
        subRegion: getLocations.subRegion || [],
        retailSegment: getLocations.retailSegment || [],
        outlet: getLocations.outlet || [],
        branch: getLocations.branch || []
    });

    const result = yield newActivity.save();

    const payload = {
        actionType,
    };

    return {
        payload,
        setEveryoneInLocation : getEveryone,
        name : result.itemName
    };
};
