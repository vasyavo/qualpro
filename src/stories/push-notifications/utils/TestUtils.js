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
const isObjectiveInProgress = (state) => {
    return state.status === OBJECTIVE_STATUSES.IN_PROGRESS;
};

module.exports = {
    isObjectiveDraft,
    isObjectiveInProgress,
};
