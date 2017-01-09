const _ = require('lodash');
const arrayOfObjectIdToArrayOfString = require('./../push-notifications/utils/arrayOfObjectIdToArrayOfString');
const ActivityLog = require('./../push-notifications/activityLog');
const ObjectiveUtilsPrototype = require('./ObjectiveUtilsPrototype');

class ObjectiveUtils extends ObjectiveUtilsPrototype {

    constructor(props) {
        super(props);
    }

    publish() {
        const {
            state,
            nextState,
        } = this;
        const {
            actionOriginator,
            accessRoleLevel,
        } = state;

        const eventPayload = {
            actionOriginator,
            accessRoleLevel,
            body: nextState,
        };

        if (state.status && state.reassigned) {
            ActivityLog.emit('objective:updated', eventPayload);
        } else if (state.status) {
            ActivityLog.emit('objective:status-updated', eventPayload);
        } else if (state.reassigned) {
            ActivityLog.emit('objective:reassigned', eventPayload);
        } else {
            ActivityLog.emit('objective:updated', eventPayload);
        }
    }

}

module.exports = ObjectiveUtils;
