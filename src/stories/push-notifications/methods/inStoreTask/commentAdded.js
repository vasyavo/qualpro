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
        const moduleId = aclModules.IN_STORE_REPORTING;
        const contentType = contentTypes.INSTORETASKS;
        const actionType = activityTypes.COMMENTED;

        const {
            actionOriginator,
            accessRoleLevel,
            body,
        } = options;

        const [
            assignedTo,
        ] = arrayOfObjectIdToArrayOfString(
            body.assignedTo
        );
        const [
            arrayOfSupervisor,
        ] = yield [
            getSupervisorByAssigneeAndOriginator({
                assignedTo,
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
                ...assignedTo,
                ...arrayOfSupervisor,
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
            recipients: [actionOriginator],
            subject: {
                en: 'Comment sent',
                ar: '',
            },
            payload: activityAsJson,
        }, {
            recipients: _.remove([assignedTo], (id) => {
                return id === actionOriginator
            }),
            subject: {
                en: 'Objective commented',
                ar: '',
            },
            payload: activityAsJson,
        }, {
            recipients: _.remove([arrayOfSupervisor], (id) => {
                return id === actionOriginator
            }),
            subject: {
                en: `Subordinate's objective commented`,
                ar: '',
            },
            payload: activityAsJson,
        }];

        yield dispatch(groups);
    });
};
