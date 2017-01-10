const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants.js');
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
    return state.hasOwnProperty('status');
};

/*
 * @param state {Object} Objective
 * @returns {Boolean}
 * */
const isObjectiveAssigneeChanged = (state) => {
    return state.hasOwnProperty('assignedTo');
};

module.exports = {
    isObjectiveDraft,
    isObjectivePublished,
    isObjectiveStatusChanged,
    isObjectiveAssigneeChanged,
    isInStoreTaskDraft,
    isInStoreTaskPublished,
};
