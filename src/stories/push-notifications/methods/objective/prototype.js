const defaultState = require('./state/default');
const inDraftState = require('./state/inDraft');
const {
    OBJECTIVE_STATUSES,
} = require('./../../../../public/js/constants/otherConstants');

module.exports = function * (options) {
    const {
        body,
    } = options;

    if (body.status === OBJECTIVE_STATUSES.DRAFT) {
        return yield inDraftState(options);
    }

    return yield defaultState(options);
};
