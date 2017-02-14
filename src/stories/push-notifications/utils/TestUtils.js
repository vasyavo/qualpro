const _ = require('lodash');
const contentTypes = require('./../../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');

const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

/*
* @param state {Object} Objective
* @returns {Boolean}
* */
const isObjectiveDraft = (state) => {
    return state.status === OBJECTIVE_STATUSES.DRAFT;
};

/*
* @param state {Object} Objective
* @returns {Boolean}
* */
const isObjectivePublished = (state) => {
    return state.status === OBJECTIVE_STATUSES.IN_PROGRESS;
};

/*
* @param state {Object} In-store task
* @returns {Boolean}
* */
const isInStoreTaskDraft = (state) => {
    return isObjectiveDraft(state);
};

/*
* @param state {Object} In-store task
* @returns {Boolean}
* */
const isInStoreTaskPublished = (state) => {
    return isObjectivePublished(state);
};

/*
 * @param state {Object} Objective
 * @returns {Boolean}
 * */
const isObjectiveStatusChanged = (state) => {
    return Object.hasOwnProperty.apply(state, ['status']);
};

/*
 * @param state {Object} Objective
 * @returns {Boolean}
 * */
const isObjectiveAssigneeChanged = (state) => {
    return Object.hasOwnProperty.apply(state, ['assignedTo']);
};

/*
 * @param state {Object} Objective
 * @returns {Boolean}
 * */
const isSubObjective = (state) => {
    return !!_(state.parent)
        .values()
        .compact()
        .values()
        .length;
};


/*
 * @param state {Object} Objective
 * @returns {Boolean}
 * */
const getObjectiveEventContext = (state) => {
    switch (state.context) {
        case contentTypes.OBJECTIVES:
            if (isSubObjective(state)) {
                return 'sub-objective';
            }

            return 'objective';
        case contentTypes.INSTORETASKS:
            return 'in-store-task';
        default:
            return 'objective';
    }
};

module.exports = {
    isObjectiveDraft,
    isObjectivePublished,
    isObjectiveStatusChanged,
    isObjectiveAssigneeChanged,
    isInStoreTaskDraft,
    isInStoreTaskPublished,
    isSubObjective,
    getObjectiveEventContext,
};
