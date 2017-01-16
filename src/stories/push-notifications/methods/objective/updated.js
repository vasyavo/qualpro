const co = require('co');
const _ = require('lodash');
const getSupervisorByAssigneeAndOriginator = require('./../../utils/getSupervisorByAssigneeAndOriginator');
const getOriginatorByParentObjective = require('./../../utils/getOriginatorByParentObjective');
const arrayOfObjectIdToArrayOfString = require('./../../utils/arrayOfObjectIdToArrayOfString');
const getAssigneeNotOnLeaveAndTheyCover = require('./../../utils/getAssigneeNotOnLeaveAndTheyCover');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const ActivityModel = require('./../../../../types/activityList/model');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.OBJECTIVE;
        const contentType = contentTypes.OBJECTIVES;
        const actionType = activityTypes.UPDATED;

        const {
            actionOriginator,
            accessRoleLevel,
            body,
        } = options;

        const contentAuthor = _.get(body, 'createdBy.user');
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
            personnels: _.uniqBy([
                actionOriginator,
                contentAuthor,
                ...assignedTo,
                ...arrayOfSupervisor,
                ...arrayOfOriginator,
            ], el => el.toString()),
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

        // fixme: make uniqBy on the database
        const groups = [{
            recipients: _.uniqBy([
                actionOriginator,
                contentAuthor
            ], el => el.toString()),
            subject: {
                en: 'Objective updated',
                ar: '',
            },
            payload,
        }, {
            recipients: _.uniqBy(arrayOfOriginator.filter((originator) => (originator !== actionOriginator)), el => el.toString()),
            subject: {
                en: 'Sub-objective updated',
                ar: '',
            },
            payload,
        }, {
            recipients: _.uniqBy(assignedTo.filter((assignee) => (assignee !== actionOriginator)), el => el.toString()),
            subject: {
                en: 'Received updated objective',
                ar: '',
            },
            payload,
        }, {
            recipients: _.uniqBy(arrayOfSupervisor.filter((supervisor) => (supervisor !== actionOriginator)),el => el.toString()),
            subject: {
                en: `Subordinate's objective updated`,
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
