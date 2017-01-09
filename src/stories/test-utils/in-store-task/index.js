const _ = require('lodash');
const arrayOfObjectIdToArrayOfString = require('./../../push-notifications/utils/arrayOfObjectIdToArrayOfString');
const ActivityLog = require('./../../push-notifications/activityLog');
const ObjectiveUtilsPrototype = require('./../ObjectiveUtilsPrototype');

class InStoreTaskUtils extends ObjectiveUtilsPrototype {

    constructor(props) {
        super(props);
    }

    publish() {
        const {
            state,
            nextState,
        } = this;
        const {
            userId,
            accessRoleLevel,
        } = state;

        const eventPayload = {
            originatorId: userId,
            accessRoleLevel,
            body: nextState,
        };

        if (state.status && state.reassigned) {
            ActivityLog.emit('in-store-task:updated', eventPayload);
        } else if (state.status) {
            ActivityLog.emit('in-store-task:status-updated', eventPayload);
        } else if (state.reassigned) {
            ActivityLog.emit('in-store-task:reassigned', eventPayload);
        } else {
            ActivityLog.emit('in-store-task:updated', eventPayload);
        }
    }

}

module.exports = InStoreTaskUtils;
