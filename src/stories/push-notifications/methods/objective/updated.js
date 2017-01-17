const co = require('co');
const _ = require('lodash');
const getSupervisorByAssigneeAndOriginator = require('./../../utils/getSupervisorByAssigneeAndOriginator');
const getOriginatorByParentObjective = require('./../../utils/getOriginatorByParentObjective');
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
        const actionType = activityTypes.UPDATED;

        const {
            accessRoleLevel,
            body,
        } = options;

        const actionOriginator = toString(options, 'actionOriginator');
        const contentAuthor = toString(body, 'createdBy.user');
        const arrayOfParentObjectiveId = _(body.parent)
            .values()
            .compact()
            .value();

        const assignedTo = yield getAssigneeNotOnLeaveAndTheyCover({
            assignedTo: body.assignedTo,
            actionOriginator,
        });
        const [
            arrayOfSupervisor,
            arrayOfOriginator,
        ] = yield [
            getSupervisorByAssigneeAndOriginator({
                assignedTo,
                originator: contentAuthor,
            }),
            getOriginatorByParentObjective({
                objectives: arrayOfParentObjectiveId,
            })
        ];

        const newActivity = new ActivityModel();

        newActivity.set({
            itemType: contentType,
            module: moduleId,
            actionType,
            itemId: body._id,
            itemName: {
                en: body.title.en,
                ar: body.title.ar,
            },
            createdBy: {
                user: actionOriginator,
            },
            accessRoleLevel,
            personnels: _.uniq([
                actionOriginator,
                contentAuthor,
                ...assignedTo,
                ...arrayOfSupervisor,
                ...arrayOfOriginator,
            ]),
            assignedTo,
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
            recipients: _.uniq([actionOriginator, contentAuthor]),
            subject: {
                en: 'Objective updated',
                ar: '',
            },
            payload,
        }, {
            recipients: arrayOfOriginator.filter((originator) => (originator !== actionOriginator)),
            subject: {
                en: 'Sub-objective updated',
                ar: '',
            },
            payload,
        }, {
            recipients: assignedTo.filter((assignee) => (assignee !== actionOriginator)),
            subject: {
                en: 'Received updated objective',
                ar: '',
            },
            payload,
        }, {
            recipients: arrayOfSupervisor.filter((supervisor) => (supervisor !== actionOriginator)),
            subject: {
                en: `Subordinate's objective updated`,
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
