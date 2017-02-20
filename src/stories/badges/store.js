const aclModules = require('./../../constants/aclModulesNames');

const defaultState = {
    [aclModules.ACTIVITY_LIST]: 0,
    [aclModules.LOCATIONS]: {
        [aclModules.COUNTRY]: 0,
        [aclModules.CUSTOMER]: 0,
        [aclModules.TRADE_CHANNEL]: 0,
    },
    [aclModules.PERSONNEL]: 0,
    [aclModules.OBJECTIVE]: 0,
    [aclModules.IN_STORE_REPORTING]: 0,
    [aclModules.ITEMS_AND_PRICES]: 0,
    [aclModules.PLANOGRAM]: 0,
    [aclModules.COMPETITOR_LIST]: 0,
    [aclModules.REPORTING]: {
        [aclModules.COMPETITOR_PROMOTION_ACTIVITY]: 0,
        [aclModules.AL_ALALI_PROMO_EVALUATION]: 0,
        [aclModules.COMPETITOR_BRANDING_DISPLAY_REPORT]: 0,
        [aclModules.ACHIEVEMENT_FORM]: 0,
        [aclModules.NEW_PRODUCT_LAUNCH]: 0,
        [aclModules.SHELF_SHARES]: 0,
        [aclModules.PRICE_SURVEY]: 0,
    },
    [aclModules.AL_ALALI_MARKETING]: {
        [aclModules.AL_ALALI_QUESTIONNAIRE]: 0,
        [aclModules.AL_ALALI_BRANDING_ACTIVITY]: 0,
        [aclModules.CONSUMER_SURVEY]: 0,
        [aclModules.AL_ALALI_BRANDING_DISPLAY_REPORT]: 0,
    },
    [aclModules.CONTRACT]: {
        [aclModules.CONTRACT_YEARLY_AND_VISIBILITY]: 0,
        [aclModules.CONTRACT_SECONDARY]: 0,
    },
    [aclModules.NOTE]: 0,
    [aclModules.NOTIFICATION]: 0,
    [aclModules.DOCUMENT]: 0,
    [aclModules.CONTACT_US]: 0,
};


