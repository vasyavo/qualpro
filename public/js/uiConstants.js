(function () {
    var root;

    var CONSTANTS = {

        //<editor-fold desc="REGEXP">
        EMAIL_REGEXP: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        PHONE_REGEXP: /^[0-9\+]?([0-9-\s()])+[0-9()]$/,
        // </editor-fold>

        //<editor-fold desc="CONTENTS">
        ACTIVITYLIST          : 'ativityList',
        BRANCH                : 'branch',
        CATEGORY              : 'category',
        PRODUCT               : 'product',
        COMMENT               : 'comment',
        CONTRACT              : 'contract',
        COUNTRY               : 'country',
        CURRENCY              : 'currency',
        DISTRIBUTIONLIST      : 'distributionList',
        DOMAIN                : 'domain',
        ITEM                  : 'item',
        INSTORETASKS          : 'inStoreTasks',
        NOTE                  : 'note',
        NOTIFICATIONS         : 'notifications',
        OBJECTIVES            : 'objectives',
        OBJECTIVESANDTASKSFORM: 'objectivesAndTasksForm',
        OUTLET                : 'outlet',
        PERSONNEL             : 'personnel',
        POSITION              : 'position',
        PRIORITY              : 'priority',
        REGION                : 'region',
        REPORTING             : 'reporting',
        RETAILSEGMENT         : 'retailSegment',
        ROLE                  : 'accessRole',
        SHELF                 : 'shelf',
        STATUS                : 'status',
        SUBREGION             : 'subRegion',
        TASK                  : 'task',
        VISIBILITYFORM        : 'visibilityForm',
        CONFIGURATIONS        : 'configurations',


        PRICESURVEY                  : 'priceSurvey',
        SHELFSHARESANALYSIS          : 'shelfSharesAnalysis',
        COMPETITORPROMOTIONACTIVITIES: 'competitorPromotionActivities',
        COMPETITORMARKETINGACTIVITIES: 'competitorMarketingActivities',
        ALALALIPROMOEVALUATION       : 'alAlaliPromoEvaluation',
        ALALALINEAREXPIRYREPORT      : 'alAlaliNearExpiryReport',
        ALALALIMARKETINGACTIVITIES   : 'alAlaliMarketingActivities',
        ALALALIACTIVITYREPORTING     : 'alAlaliActivityReporting',
        PLANOGRAM                    : 'planogram',
        ITEMSANDPRICES               : 'itemsAndPrices',
        ITEMSLIST                    : 'itemsList',
        PRICELIST                    : 'priceList',
        MUSTSTOCKLIST                : 'mustStockList',
        COMPETITORS                  : 'competitors',
        COMPETITORSLIST              : 'competitorsList',
        COMPETITORSACTIVITY          : 'competitorsActivity',
        CONTRACTS                    : 'contracts',
        FINANCIAL                    : 'financial',
        VISIBILITYLAYOUT             : 'visibilityLayout',
        SECONDARYDISPLAYS            : 'secondaryDisplays',
        RAMADANDISPLAYS              : 'ramadanDisplays',
        OTHERDISPLAYS                : 'otherDisplays',
        CUSTOMREPORTS                : 'customReports'
        // </editor-fold>
    };

    if (typeof window == 'object' && this === window) {
        root = window;
    }
    else if (typeof global == 'object' && this === global) {
        root = global;
    }
    else {
        root = this;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = CONSTANTS;
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return CONSTANTS;
        });
    } else {
        root.CONSTANTS = CONSTANTS;
    }

}());