const co = require('co');
const _ = require('lodash');
const getSupervisorByAssigneeAndOriginator = require('./../../utils/objective/getSupervisorByAssigneeAndOriginator');
const getAssigneeNotOnLeaveAndTheyCover = require('./../../utils/objective/getAssigneeNotOnLeaveAndTheyCover');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');
const getAllowedRoles = require('./../../utils/objective/getAllowedRoles');
const setObjectIdToSetString = require('./../../utils/arrayOfObjectIdToArrayOfString');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.OBJECTIVE;
        const contentType = contentTypes.OBJECTIVES;
        const actionType = activityTypes.CREATED;

        const {
            accessRoleLevel,
            body,
        } = options;

        const setAllowedRole = getAllowedRoles({
            context: body.context,
        });
        const actionOriginator = toString(options, 'actionOriginator');
        const [
            setActualAssignee,
        ] = setObjectIdToSetString(
            body.assignedTo
        );

        const setAssigneeNotOnLeaveAndCover = yield getAssigneeNotOnLeaveAndTheyCover({
            assignedTo: setActualAssignee,
            actionOriginator,
            setAllowedRole,
        });
        const setAssignee = _.uniq([
            ...setActualAssignee,
            ...setAssigneeNotOnLeaveAndCover,
        ]);
        const setSupervisor = yield getSupervisorByAssigneeAndOriginator({
            assignedTo: setAssignee,
            originator: actionOriginator,
            setAllowedRole,
        });

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
            personnels: _.uniq([
                actionOriginator,
                ...setAssignee,
                ...setSupervisor,
            ]),
            assignedTo: setAssignee,
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
                en: 'Objective published',
                ar: '',
            },
            payload,
        }, {
            recipients: setAssignee.filter((assignee) => (assignee !== actionOriginator)),
            subject: {
                en: 'Received new objective',
                ar: '',
            },
            payload,
        }, {
            recipients: setSupervisor.filter((supervisor) => (supervisor !== actionOriginator)),
            subject: {
                en: 'Subordinate received new objective',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
