const co = require('co');
const _ = require('lodash');
const getSupervisorByAssigneeAndOriginator = require('./../../utils/getSupervisorByAssigneeAndOriginator');
const getOriginatorByParentObjective = require('./../../utils/getOriginatorByParentObjective');
const arrayOfObjectIdToArrayOfString = require('./../../utils/arrayOfObjectIdToArrayOfString');
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

        const [
            assignedTo,
        ] = arrayOfObjectIdToArrayOfString(
            body.assignedTo
        );
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

        const savedActivity = yield newActivity.save();
        const activityAsJson = savedActivity.toJSON();

        const groups = [{
            recipients: _.uniq([actionOriginator, contentAuthor]),
            subject: {
                en: 'Objective updated',
                ar: '',
            },
            payload: activityAsJson,
        }, {
            recipients: _.remove([arrayOfOriginator], (id) => {
                return id === actionOriginator
            }),
            subject: {
                en: 'Sub-objective updated',
                ar: '',
            },
            payload: activityAsJson,
        }, {
            recipients: _.remove([assignedTo], (id) => {
                return id === actionOriginator
            }),
            subject: {
                en: 'Received updated objective',
                ar: '',
            },
            payload: activityAsJson,
        }, {
            recipients: _.remove([arrayOfSupervisor], (id) => {
                return id === actionOriginator
            }),
            subject: {
                en: `Subordinate's objective updated`,
                ar: '',
            },
            payload: activityAsJson,
        }];

        yield dispatch(groups);
    });
};
