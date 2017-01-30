const _ = require('lodash');
const arrayOfObjectIdToArrayOfString = require('./../push-notifications/utils/arrayOfObjectIdToArrayOfString');
const UtilsPrototype = require('./UtilsPrototype');

class ObjectiveUtilsPrototype extends UtilsPrototype {

    constructor(props) {
        super(props);

        const {
            actionOriginator,
            accessRoleLevel,
        } = props;

        this.state = {
            actionOriginator,
            accessRoleLevel,
        };
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

        return !!_.intersection(previousAssignee, newAssignee).length;
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
