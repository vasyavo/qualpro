class UtilsPrototype {

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

    difference() {
        const {
            state,
        } = this;

        state.status = this.isStatusChanged();

        return state;
    }

}

module.exports = UtilsPrototype;
