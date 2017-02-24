const co = require('co');
const _ = require('lodash');
const ActivityModel = require('./../../../../../types/activityList/model');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const toString = require('./../../../../../utils/toString');
const getEveryAdminInSameCountryAsOriginator = require('./../../../utils/getEveryAdminInSameCountryAsOriginator');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_BRANDING_DISPLAY_REPORT;
        const contentType = contentTypes.BRANDINGANDDISPLAY;
        const actionType = activityTypes.CREATED;
        const {
            accessRoleLevel,
            body,
        } = options;

        const actionOriginator = toString(options, 'actionOriginator');
        const setAdmin = yield getEveryAdminInSameCountryAsOriginator({
            actionOriginator,
        });

        const personnels = [
            actionOriginator,
            ...setAdmin,
        ];
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
            personnels,
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

        const groups = [{
            recipients: personnels,
            subject: {
                en: 'Branding & Display report published',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, { moduleId });
    });
};
