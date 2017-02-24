const aclModules = require('./../../constants/aclModulesNames');
const {
    CLEANUP_ACTIVITY_LIST,

    ADD_COUNTRY,
    ADD_REGION,
    ADD_SUB_REGION,
    CLEANUP_COUNTRIES,
    ADD_CUSTOMER,
    ADD_BRANCH,
    CLEANUP_CUSTOMER,
    ADD_TRADE_CHANNEL,
    CLEANUP_TRADE_CHANNEL,

    ADD_PERSONNEL,
    ADD_OBJECTIVE,
    ADD_IN_STORE_REPORTING,
    ADD_ITEMS_AND_PRICES,
    ADD_PLANOGRAM,
    ADD_COMPETITOR_LIST,

    ADD_COMPETITOR_PROMOTION_ACTIVITIES,
    ADD_PROMO_EVALUATION,
    ADD_PROMOTION_ITEMS,
    ADD_COMPETITOR_BRANDING_DISPLAY_REPORT,
    ADD_ACHIEVEMENT_FORM,
    ADD_NEW_PRODUCT_LAUNCH,
    ADD_SHELF_SHARES,
    ADD_PRICE_SURVEY,

    ADD_QUESTIONNAIRE,
    ADD_MARKETING_CAMPAIGNS,
    ADD_CONSUMER_SURVEY,
    ADD_BRANDING_AND_MONTHLY_DISPLAY,

    ADD_CONTRACT_YEARLY_AND_VISIBILITY,
    ADD_CONTRACT_SECONDARY,

    ADD_NOTE,
    ADD_NOTIFICATION,
    ADD_DOCUMENT,
    ADD_CONTACT_US,
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
        case CLEANUP_ACTIVITY_LIST:
            return Object.assign({}, defaultState);

        case ADD_COUNTRY:
        case ADD_REGION:
        case ADD_SUB_REGION:
            ++baseState[aclModules.LOCATIONS];
            ++baseState[aclModules.COUNTRY];
            return baseState;
        case CLEANUP_COUNTRIES:
            baseState[aclModules.ACTIVITY_LIST] -= baseState[aclModules.COUNTRY];
            baseState[aclModules.LOCATIONS] -= baseState[aclModules.COUNTRY];
            baseState[aclModules.COUNTRY] = 0;
            return baseState;

        case ADD_CUSTOMER:
        case ADD_BRANCH:
            ++baseState[aclModules.LOCATIONS];
            ++baseState[aclModules.CUSTOMER];
            return baseState;
        case CLEANUP_CUSTOMER:
            baseState[aclModules.ACTIVITY_LIST] -= baseState[aclModules.CUSTOMER];
            baseState[aclModules.LOCATIONS] -= baseState[aclModules.CUSTOMER];
            baseState[aclModules.CUSTOMER] = 0;
            return baseState;

        case ADD_TRADE_CHANNEL:
            ++baseState[aclModules.LOCATIONS];
            ++baseState[aclModules.TRADE_CHANNEL];
            return baseState;
        case CLEANUP_TRADE_CHANNEL:
            baseState[aclModules.ACTIVITY_LIST] -= baseState[aclModules.TRADE_CHANNEL];
            baseState[aclModules.LOCATIONS] -= baseState[aclModules.TRADE_CHANNEL];
            baseState[aclModules.TRADE_CHANNEL] = 0;
            return baseState;

        case ADD_PERSONNEL:
            ++baseState[aclModules.PERSONNEL];
            return baseState;

        case ADD_OBJECTIVE:
            ++baseState[aclModules.OBJECTIVE];
            return baseState;

        case ADD_IN_STORE_REPORTING:
            ++baseState[aclModules.IN_STORE_REPORTING];
            return baseState;

        case ADD_ITEMS_AND_PRICES:
            ++baseState[aclModules.ITEMS_AND_PRICES];
            return baseState;

        case ADD_PLANOGRAM:
            ++baseState[aclModules.PLANOGRAM];
            return baseState;

        case ADD_COMPETITOR_LIST:
            ++baseState[aclModules.COMPETITOR_LIST];
            return baseState;

        case ADD_COMPETITOR_PROMOTION_ACTIVITIES:
            ++baseState[aclModules.REPORTING];
            ++baseState[aclModules.COMPETITOR_PROMOTION_ACTIVITY];
            return baseState;

        case ADD_PROMO_EVALUATION:
        case ADD_PROMOTION_ITEMS:
            ++baseState[aclModules.REPORTING];
            ++baseState[aclModules.AL_ALALI_PROMO_EVALUATION];
            return baseState;

        case ADD_COMPETITOR_BRANDING_DISPLAY_REPORT:
            ++baseState[aclModules.REPORTING];
            ++baseState[aclModules.COMPETITOR_BRANDING_DISPLAY_REPORT];
            return baseState;

        case ADD_ACHIEVEMENT_FORM:
            ++baseState[aclModules.REPORTING];
            ++baseState[aclModules.ACHIEVEMENT_FORM];
            return baseState;

        case ADD_NEW_PRODUCT_LAUNCH:
            ++baseState[aclModules.REPORTING];
            ++baseState[aclModules.NEW_PRODUCT_LAUNCH];
            return baseState;

        case ADD_SHELF_SHARES:
            ++baseState[aclModules.REPORTING];
            ++baseState[aclModules.SHELF_SHARES];
            return baseState;

        case ADD_PRICE_SURVEY:
            ++baseState[aclModules.REPORTING];
            ++baseState[aclModules.PRICE_SURVEY];
            return baseState;

        case ADD_QUESTIONNAIRE:
            ++baseState[aclModules.AL_ALALI_MARKETING];
            ++baseState[aclModules.AL_ALALI_QUESTIONNAIRE];
            return baseState;

        case ADD_MARKETING_CAMPAIGNS:
            ++baseState[aclModules.AL_ALALI_MARKETING];
            ++baseState[aclModules.AL_ALALI_BRANDING_ACTIVITY];
            return baseState;

        case ADD_CONSUMER_SURVEY:
            ++baseState[aclModules.AL_ALALI_MARKETING];
            ++baseState[aclModules.CONSUMER_SURVEY];
            return baseState;

        case ADD_BRANDING_AND_MONTHLY_DISPLAY:
            ++baseState[aclModules.AL_ALALI_MARKETING];
            ++baseState[aclModules.AL_ALALI_BRANDING_DISPLAY_REPORT];
            return baseState;

        case ADD_CONTRACT_YEARLY_AND_VISIBILITY:
            ++baseState[aclModules.CONTRACT];
            ++baseState[aclModules.CONTRACT_YEARLY_AND_VISIBILITY];
            return baseState;

        case ADD_CONTRACT_SECONDARY:
            ++baseState[aclModules.CONTRACT];
            ++baseState[aclModules.CONTRACT_SECONDARY];
            return baseState;

        case ADD_NOTE:
            ++baseState[aclModules.NOTE];
            return baseState;

        case ADD_NOTIFICATION:
            ++baseState[aclModules.NOTIFICATION];
            return baseState;

        case ADD_DOCUMENT:
            ++baseState[aclModules.DOCUMENT];
            return baseState;

        case ADD_CONTACT_US:
            ++baseState[aclModules.CONTACT_US];
            return baseState;

        default:
            return Object.assign({}, baseState);
    }
};
