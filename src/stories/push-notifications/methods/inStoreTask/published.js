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
        const moduleId = aclModules.IN_STORE_REPORTING;
        const contentType = contentTypes.INSTORETASKS;
        const actionType = activityTypes.CREATED;

        const {
            accessRoleLevel,
            inStoreTask,
        } = options;

        const actionOriginator = toString(options, 'originatorId');
        const assignedTo = yield getAssigneeNotOnLeaveAndTheyCover({
            assignedTo: inStoreTask.assignedTo,
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
            itemId: inStoreTask._id,
            itemName: {
                en: inStoreTask.title.en,
                ar: inStoreTask.title.ar,
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
            country: inStoreTask.country,
            region: inStoreTask.region,
            subRegion: inStoreTask.subRegion,
            retailSegment: inStoreTask.retailSegment,
            outlet: inStoreTask.outlet,
            branch: inStoreTask.branch,
        });

        yield newActivity.save();

        const payload = {
            actionType,
        };
        const groups = [{
            recipients: [actionOriginator],
            subject: {
                en: 'In-store task published',
                ar: '',
            },
            payload,
        }, {
            recipients: assignedTo.filter((assignee) => (assignee !== actionOriginator)),
            subject: {
                en: 'Received new in-store task',
                ar: '',
            },
            payload,
        }, {
            recipients: arrayOfSupervisor.filter((supervisor) => (supervisor !== actionOriginator)),
            subject: {
                en: 'Subordinate received new in-store task',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
