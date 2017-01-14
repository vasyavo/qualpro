const co = require('co');
const _ = require('lodash');
const getReportGroupsByOriginator = require('./../../../utils/getReportGroupsByOriginator');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const ActivityModel = require('./../../../../../types/activityList/model');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.SHELF_SHARES;
        const contentType = contentTypes.SHELFSHARES;
        const actionType = activityTypes.CREATED;

        const {
            actionOriginator,
            accessRoleLevel,
            body,
        } = options;

        const {
            supervisor,
            admins,
        } = yield getReportGroupsByOriginator({
            actionOriginator
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
            personnels: _.uniq([
                actionOriginator,
                supervisor,
                ...admins,
            ]),
            country: body.country,
            region: body.region,
            subRegion: body.subRegion,
            retailSegment: body.retailSegment,
            outlet: body.outlet,
            branch: body.branch,
        });

        const savedActivity = yield newActivity.save();
        const activityAsJson = savedActivity.toJSON();

        const groups = [{
            recipients: [actionOriginator],
            subject: {
                en: 'Shelf share published',
                ar: '',
            },
            payload: activityAsJson,
        }, {
            recipients: [supervisor],
            subject: {
                en: 'Subordinate published report',
                ar: '',
            },
            payload: activityAsJson,
        }, {
            recipients: admins.filter((admin) => (admin !== actionOriginator)),
            subject: {
                en: 'Shelf share received',
                ar: '',
            },
            payload: activityAsJson,
        }];

        yield dispatch(groups);
    });
};
