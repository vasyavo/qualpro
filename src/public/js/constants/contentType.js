'use strict';

(function() {
    var root;

    var CONTNETTYPES = {
        ACTIVITYLIST : 'activityList',
        BRANCH : 'branch',
        BRANDING_AND_DISPLAY : 'brandingAndDisplayNew',
        BRANDING_ACTIVITY : 'brandingActivity',
        BRANDING_ACTIVITY_ITEMS : 'brandingActivityItems',
        BRANDINGANDDISPLAY : 'brandingAndDisplay',
        BRANDINGANDDISPLAYITEMS : 'brandingAndDisplayItems',
        CATEGORY : 'category',
        PRODUCT : 'product',
        PROMOTIONS : 'promotions',
        PROMOTIONSITEMS : 'promotionsItems',
        COMMENT : 'comment',
        //CONTRACT               : 'contract',
        CONTRACTSYEARLY : 'contractsYearly',
        CONTRACT_TYPE : 'contractType',
        CONTRACTSSECONDARY : 'contractsSecondary',
        CONFIGURATIONS : 'configuration',
        COUNTRY : 'country',
        CURRENCY : 'currency',
        DISTRIBUTIONLIST : 'distributionList',
        DOMAIN : 'domain',
        DISPLAY_TYPE : 'displayType',
        ITEM : 'item',
        INSTORETASKS : 'inStoreTasks',
        NOTES : 'notes',
        NOTIFICATIONS : 'notifications',
        OBJECTIVES : 'objectives',
        FILES : 'files',
        OBJECTIVESANDTASKSFORM : 'objectivesAndTasksForm',
        OUTLET : 'outlet',
        PERSONNEL : 'personnel',
        POSITION : 'position',
        PRIORITY : 'priority',
        OBJECTIVETYPE : 'objectiveType',
        REGION : 'region',
        REPORTING : 'reporting',
        RETAILSEGMENT : 'retailSegment',
        ROLE : 'accessRole',
        SHELF : 'shelf',
        STATUS : 'status',
        SUBREGION : 'subRegion',
        TASK : 'task',
        VARIANT : 'variant',
        VISIBILITYFORM : 'visibilityForm',
        RATING : 'rating',
        ITEMSPRICES : 'itemsPrices',
        ITEMSLOCATION : 'itemsLocation',
        ORIGIN : 'origin',
        COMPETITORVARIANT : 'competitorVariant',
        COMPETITORITEM : 'competitorItem',
        BRAND : 'brand',
        PLANOGRAM : 'planogram',
        COMPETITORSLIST : 'competitorsList',
        ACCESSROLE : 'accessRole',
        DISTRIBUTIONFORM : 'distributionForm',
        OBJECTIVEHISTORY : 'objectiveHistory',
        PERSONNELTASKS : 'personnelTasks',
        PERSONNELANSWERS : 'personnelAnswers',
        COMPETITORBRANDING : 'competitorBranding',
        COMPETITORPROMOTION : 'competitorPromotion',
        ACHIEVEMENTFORM : 'achievementForm',
        NEWPRODUCTLAUNCH : 'newProductLaunch',
        SHELFSHARES : 'shelfShares',
        MONTHLY : 'monthly',
        BIYEARLY : 'biYearly',
        ITEMHISTORY : 'itemHistory',
        DOCUMENTS : 'documents',
        CONTACT_US : 'contactUs',
        DISPLAYTYPE : 'displayType',
        MODULE : 'module',
        SESSION : 'session',

        PRICESURVEY : 'priceSurvey',
        SHELFSHARESANALYSIS : 'shelfSharesAnalysis',
        ALALALIPROMOEVALUATION : 'alAlaliPromoEvaluation',
        ALALALINEAREXPIRYREPORT : 'alAlaliNearExpiryReport',
        ALALALIMARKETINGACTIVITIES : 'alAlaliMarketingActivities',
        ALALALIACTIVITYREPORTING : 'alAlaliActivityReporting',
        ITEMSLIST : 'itemsList',
        PRICELIST : 'priceList',
        MUSTSTOCKLIST : 'mustStockList',
        COMPETITORS : 'competitors',
        COMPETITORSACTIVITY : 'competitorsActivity',
        CONTRACTS : 'contracts',
        FINANCIAL : 'financial',
        VISIBILITYLAYOUT : 'visibilityLayout',
        SECONDARYDISPLAYS : 'secondaryDisplays',
        RAMADANDISPLAYS : 'ramadanDisplays',
        OTHERDISPLAYS : 'otherDisplays',
        CUSTOMREPORTS : 'customReports',
        QUESTIONNARIES : 'questionnary',
        QUESTIONNARIES_ANSWER : 'questionnaryAnswer',
        CREATEQUESTIONNARIES : 'createQuestionnary',
        CREATE_CONSUMER_SURVEY : 'createConsumersSurvey',
        CONSUMER_SURVEY : 'consumersSurvey',
        CONSUMER_SURVEY_ANSWER : 'consumersSurveyAnswers',
        TASK_SCHEDULER : 'taskScheduler',
        DISPLAY_NAMES : {
            COUNTRY : 'Country',
            REGION : 'Region',
            SUB_REGION : 'Sub-region',
            RETAIL_SEGMENT : 'Trade channel',
            OUTLET : 'Outlet',
            BRANCH : 'Branch'
        }
    };

    if (typeof window === 'object' && this === window) {
        root = window;
    } else if (typeof global === 'object' && this === global) {
        root = global;
    } else {
        root = this;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = CONTNETTYPES;
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define([], function() {
            return CONTNETTYPES;
        });
    } else {
        root.CONTNETTYPES = CONTNETTYPES;
    }
}());