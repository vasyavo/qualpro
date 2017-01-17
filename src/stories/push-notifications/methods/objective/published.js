const co = require('co');
const _ = require('lodash');
const getSupervisorByAssigneeAndOriginator = require('./../../utils/getSupervisorByAssigneeAndOriginator');
const arrayOfObjectIdToArrayOfString = require('./../../utils/arrayOfObjectIdToArrayOfString');
const getAssigneeNotOnLeaveAndTheyCover = require('./../../utils/getAssigneeNotOnLeaveAndTheyCover');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.OBJECTIVE;
        const contentType = contentTypes.OBJECTIVES;
        const actionType = activityTypes.CREATED;

        const {
            accessRoleLevel,
            objective,
        } = options;
        const actionOriginator = toString(options, 'originatorId');

        const assignedTo = yield getAssigneeNotOnLeaveAndTheyCover({
            assignedTo: objective.assignedTo,
            actionOriginator,
        });
        const arrayOfSupervisor = yield getSupervisorByAssigneeAndOriginator({
            assignedTo,
            originator: actionOriginator,
        });

        const newActivity = new ActivityModel();

        newActivity.set({
            itemType: contentType,
            module: moduleId,
            actionType,
            itemId: objective._id,
            itemName: {
                en: objective.title.en,
                ar: objective.title.ar,
            },
            createdBy: {
                user: actionOriginator,
            },
            accessRoleLevel,
            personnels: _.uniq([
                actionOriginator,
                ...assignedTo,
                ...arrayOfSupervisor,
            ]),
            assignedTo,
            country: objective.country,
            region: objective.region,
            subRegion: objective.subRegion,
            retailSegment: objective.retailSegment,
            outlet: objective.outlet,
            branch: objective.branch,
        });

        yield newActivity.save();

        const payload = {
            actionType,
        };
        const groups = [{
            recipients: [actionOriginator],
            subject: {
                en: 'Objective published',
                ar: '',
            },
            payload,
        }, {
            recipients: assignedTo.filter((assignee) => (assignee !== actionOriginator)),
            subject: {
                en: 'Received new objective',
                ar: '',
            },
            payload,
        }, {
            recipients: arrayOfSupervisor.filter((supervisor) => (supervisor !== actionOriginator)),
            subject: {
                en: 'Subordinate received new objective',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
