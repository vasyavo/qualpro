const aclModules = require('./../../constants/aclModulesNames');
const {
    ADD_ACTIVITY_LIST,
    CLEANUP_ACTIVITY_LIST,
} = require('./actionTypes');

const defaultState = {
    [aclModules.ACTIVITY_LIST]: 0,

    [aclModules.LOCATIONS]: 0,
    [aclModules.COUNTRY]: 0,
    [aclModules.CUSTOMER]: 0,
    [aclModules.TRADE_CHANNEL]: 0,

    [aclModules.PERSONNEL]: 0,
    [aclModules.OBJECTIVE]: 0,
    [aclModules.IN_STORE_REPORTING]: 0,
    [aclModules.ITEMS_AND_PRICES]: 0,
    [aclModules.PLANOGRAM]: 0,
    [aclModules.COMPETITOR_LIST]: 0,

    [aclModules.REPORTING]: 0,
    [aclModules.COMPETITOR_PROMOTION_ACTIVITY]: 0,
    [aclModules.AL_ALALI_PROMO_EVALUATION]: 0,
    [aclModules.COMPETITOR_BRANDING_DISPLAY_REPORT]: 0,
    [aclModules.ACHIEVEMENT_FORM]: 0,
    [aclModules.NEW_PRODUCT_LAUNCH]: 0,
    [aclModules.SHELF_SHARES]: 0,
    [aclModules.PRICE_SURVEY]: 0,

    [aclModules.AL_ALALI_MARKETING]: 0,
    [aclModules.AL_ALALI_QUESTIONNAIRE]: 0,
    [aclModules.AL_ALALI_BRANDING_ACTIVITY]: 0,
    [aclModules.CONSUMER_SURVEY]: 0,
    [aclModules.AL_ALALI_BRANDING_DISPLAY_REPORT]: 0,

    [aclModules.CONTRACT]: 0,
    [aclModules.CONTRACT_YEARLY_AND_VISIBILITY]: 0,
    [aclModules.CONTRACT_SECONDARY]: 0,

    [aclModules.NOTE]: 0,
    [aclModules.NOTIFICATION]: 0,
    [aclModules.DOCUMENT]: 0,
    [aclModules.CONTACT_US]: 0,
};

module.exports = (previousState, action) => {
    const state = previousState || defaultState;
    const {
        type,
    } = action;

    const isAdd = type.split('ADD').length === 2;

    Object.keys(state).forEach((key) => {
        const value = state[key];

        state[key] = parseInt(value, 10);
    });

    const baseState = Object.assign({}, state, {
        [aclModules.ACTIVITY_LIST]: isAdd ?
            state[aclModules.ACTIVITY_LIST] + 1 :
            state[aclModules.ACTIVITY_LIST],
    });

    switch (type) {
        case ADD_ACTIVITY_LIST:
            return Object.assign({}, baseState);
        case CLEANUP_ACTIVITY_LIST:
            return Object.assign({}, baseState, {
                [aclModules.ACTIVITY_LIST]: 0,
            });
        default:
            return baseState;
    }
};
