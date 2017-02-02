const co = require('co');
const _ = require('lodash');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const ActivityModel = require('./../../../../../types/activityList/model');
const toString = require('./../../../../../utils/toString');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_QUESTIONNAIRE;
        const contentType = contentTypes.QUESTIONNARIES;
        const actionType = activityTypes.CREATED;

        const {
            accessRoleLevel,
            body,
        } = options;

        const actionOriginator = toString(options, 'actionOriginator');

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
            personnels: [
                actionOriginator,
            ],
            assignedTo: body.assignedTo,
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
                en: 'Questionnaire saved',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
