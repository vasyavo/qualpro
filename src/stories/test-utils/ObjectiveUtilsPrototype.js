const _ = require('lodash');
const arrayOfObjectIdToArrayOfString = require('./../push-notifications/utils/arrayOfObjectIdToArrayOfString');

class ObjectiveUtilsPrototype {

    constructor(props) {
        const {
            actionOriginator,
            accessRoleLevel,
        } = props;

        this.state = {
            actionOriginator,
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

}

module.exports = ObjectiveUtilsPrototype;
