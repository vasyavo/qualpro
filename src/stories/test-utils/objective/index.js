const _ = require('lodash');
const arrayOfObjectIdToArrayOfString = require('./../../push-notifications/utils/arrayOfObjectIdToArrayOfString');
const ActivityLog = require('./../../push-notifications/activityLog');

class ObjectiveUtils {

    constructor(props) {
        const {
            userId,
            accessRoleLevel,
        } = props;

        this.state = {
            userId,
            accessRoleLevel,
        };
    }

    setPreviousState(state) {
        this.previousState = state;
    }

    setNextState(state) {
        this.nextState = state;
    }

    isStatusChanged() {
        const {
            previousState,
            nextState,
        } = this;

        return previousState.status !== nextState.status;
    }

    isReassigned() {
        const {
            previousState,
            nextState,
        } = this;
        const [
            previousAssignee,
            newAssignee,
        ] = arrayOfObjectIdToArrayOfString(
            previousState.assignedTo,
            nextState.assignedTo
        );

        return !!_.intersection(previousAssignee, newAssignee).length
    }

    difference() {
        const {
            state,
        } = this;

        state.status = this.isStatusChanged();
        state.reassigned = this.isReassigned();

        return state;
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
            objective: nextState,
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
