const _ = require('lodash');
const ObjectId = require('mongoose').Types.ObjectId;
const ActivityModel = require('./../../../../types/activityList/model');
const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const getEveryoneInCountry = require('./../../utils/getEveryoneInCountry');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.PERSONNEL;
        const contentType = contentTypes.PERSONNEL;
        const actionType = activityTypes.UPDATED;

        const {
            body,
            accessRoleLevel,
            coverUsers,
            actionOriginator,
        } = options;

        const setEveryoneInLocation = yield getEveryoneInCountry({
            setCountry: body.country.map(country => country._id),
        });

        setEveryoneInLocation.push(actionOriginator);

        if (coverUsers && coverUsers.length) {
            _.union(setEveryoneInLocation, coverUsers);
        }

        const newActivity = new ActivityModel();

        newActivity.set({
            itemType: contentType,
            module: moduleId,
            actionType,
            itemId: body._id,
            itemName: {
                en: `${body.firstName.en} ${body.lastName.en}`,
                ar: `${body.firstName.ar} ${body.lastName.ar}`,
            },
            createdBy: {
                user: actionOriginator,
            },
            accessRoleLevel,
            personnels: setEveryoneInLocation.map(id => ObjectId(id)),
            country: body.country,
            region: body.region,
            subRegion: body.subRegion,
            retailSegment: body.retailSegment,
            outlet: body.outlet,
            branch: body.branch,
        });

        const result = yield newActivity.save();

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: `Personnel ${result.itemName.en} ${actionType}`,
                ar: '',
            },
            payload: {
                actionType,
            },
        }];

        yield dispatch(groups, {
            actionOriginator,
            moduleId,
        });
    });
};
