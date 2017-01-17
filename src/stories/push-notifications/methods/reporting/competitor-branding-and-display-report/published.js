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
        const moduleId = aclModules.COMPETITOR_BRANDING_DISPLAY_REPORT;
        const contentType = contentTypes.COMPETITORBRANDING;
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

        yield newActivity.save();

        const payload = {
            actionType,
        };
        const groups = [{
            recipients: [actionOriginator],
            subject: {
                en: 'Branding and display report published',
                ar: '',
            },
            payload,
        }, {
            recipients: [supervisor],
            subject: {
                en: 'Subordinate published report',
                ar: '',
            },
            payload,
        }, {
            recipients: admins.filter((admin) => (admin !== actionOriginator)),
            subject: {
                en: 'Competitor branding and display report received',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
